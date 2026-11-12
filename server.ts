import 'dotenv/config';
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Tyq0rHJ0l5nvAb';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '28efjuq51lboK5IPX25OubBK';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yjbowhkgwatrwmuyvkja.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Optional server Supabase client for database synchronization
const supabase = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// In-memory processed webhook events set for idempotency check (in addition to DB)
const processedWebhooks = new Set<string>();

async function startServer() {
  const app = express();

  // Capture rawBody for cryptographic webhook HMAC-SHA256 verification
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-razorpay-signature');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Luv Kush Seva Trust Payment Backend',
      razorpayConfigured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Create Razorpay Order API Endpoint
  app.post('/api/create-razorpay-order', async (req: Request, res: Response) => {
    try {
      const { amount, purpose, donorName, mobile, email, address, notes, referenceId } = req.body;

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'Razorpay credentials not configured on server.',
          code: 'RAZORPAY_CONFIG_ERROR',
        });
      }

      const parsedAmount = Number(amount);
      if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 1) {
        return res.status(400).json({
          success: false,
          error: 'A valid donation amount of at least ₹1.00 is required.',
          code: 'INVALID_AMOUNT',
        });
      }

      const isSmartId = purpose === 'smart_id_card' || purpose === 'smart_id_card_fee';
      if (isSmartId && parsedAmount !== 200) {
        return res.status(400).json({
          success: false,
          error: 'Special Service Smart ID card fee must be exactly ₹200.00.',
          code: 'INVALID_FEE_AMOUNT',
        });
      }

      const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
      const amountPaise = Math.round(parsedAmount * 100);
      const cleanDonorName = (donorName || 'Supporter').trim().slice(0, 100);
      const cleanMobile = (mobile || '').replace(/\D/g, '').slice(0, 15);
      const cleanEmail = (email || '').trim().slice(0, 100);
      const cleanAddress = (address || '').trim().slice(0, 250);
      const receiptCode = `LKST_${isSmartId ? 'ID' : 'DON'}_${Date.now()}`;

      // Call Razorpay Orders API
      const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: receiptCode.slice(0, 40),
          payment_capture: 1, // Crucial for instant dynamic UPI QR and Intent auto-capture
          notes: {
            organization: 'Luv Kush Seva Trust',
            purpose: cleanPurpose,
            donorName: cleanDonorName,
            mobile: cleanMobile,
            email: cleanEmail,
            address: cleanAddress,
            referenceId: referenceId || '',
            ...(notes || {}),
          },
        }),
      });

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        console.error('Razorpay Orders API error:', errText);
        let parsedErr: any = null;
        try {
          parsedErr = JSON.parse(errText);
        } catch {
          parsedErr = { error: { description: errText } };
        }
        return res.status(502).json({
          success: false,
          error: parsedErr?.error?.description || 'Failed to create order on Razorpay server.',
          code: parsedErr?.error?.code || 'RAZORPAY_API_ERROR',
        });
      }

      const rzpData = await rzpRes.json();
      const razorpayOrderId = rzpData?.id;

      if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || !razorpayOrderId.startsWith('order_')) {
        return res.status(502).json({
          success: false,
          error: 'Razorpay returned an invalid order identifier.',
          code: 'MALFORMED_ORDER_RESPONSE',
        });
      }

      // Record in Supabase database if service role is available
      if (supabase) {
        try {
          await supabase.from('razorpay_orders').upsert(
            {
              id: `LKST-ORD-${Date.now()}`,
              order_id: razorpayOrderId,
              amount: parsedAmount,
              amount_paise: amountPaise,
              currency: 'INR',
              purpose: cleanPurpose,
              donor_or_applicant_name: cleanDonorName,
              email: cleanEmail || null,
              mobile: cleanMobile || null,
              reference_id: referenceId || null,
              status: 'created',
              receipt_code: receiptCode,
              metadata: {
                notes,
                address: cleanAddress,
                createdVia: 'express_server_proxy',
                rzpCreatedAt: rzpData.created_at,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'order_id' }
          );
        } catch (dbErr) {
          console.warn('Could not record order in Supabase database:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        orderId: razorpayOrderId,
        amount: parsedAmount,
        amountPaise,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        purpose: cleanPurpose,
      });
    } catch (err: any) {
      console.error('Exception in /api/create-razorpay-order:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error creating Razorpay order.',
      });
    }
  });

  // 2. Verify Razorpay Payment Signature API Endpoint
  app.post('/api/verify-razorpay-payment', async (req: Request, res: Response) => {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        purpose,
        donorName,
        mobile,
        email,
        address,
        amount,
        causeOrService,
        referenceId,
      } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: razorpayOrderId, razorpayPaymentId, or razorpaySignature.',
          code: 'MISSING_PARAMS',
        });
      }

      // Verify HMAC-SHA256 signature
      const payloadToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(payloadToSign)
        .digest('hex');

      if (expectedSignature !== razorpaySignature.trim()) {
        console.warn('HMAC-SHA256 signature mismatch:', { expectedSignature, received: razorpaySignature });
        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature. Payment could not be verified.',
          code: 'SIGNATURE_MISMATCH',
        });
      }

      const isSmartId = purpose === 'smart_id_card' || purpose === 'smart_id_card_fee';
      const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
      const cleanDonorName = (donorName || 'Supporter').trim().slice(0, 100);
      const cleanMobile = (mobile || '').replace(/\D/g, '').slice(0, 15);
      const cleanAddress = (address || '').trim().slice(0, 250);
      const cleanAmount = Number(amount) || (isSmartId ? 200 : 100);
      const nowIso = new Date().toISOString();
      let generatedReceiptNumber = `LKST-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      if (supabase) {
        try {
          await supabase
            .from('razorpay_orders')
            .update({ status: 'paid', updated_at: nowIso })
            .eq('order_id', razorpayOrderId);

          await supabase.from('razorpay_payments').upsert(
            {
              id: `LKST-PAY-${Date.now()}`,
              payment_id: razorpayPaymentId,
              order_id: razorpayOrderId,
              signature: razorpaySignature,
              amount: cleanAmount,
              currency: 'INR',
              status: 'captured',
              method: 'razorpay',
              verified_via: 'server_hmac',
              created_at: nowIso,
            },
            { onConflict: 'payment_id' }
          );

          if (cleanPurpose === 'donation') {
            const { data: insertedDonation } = await supabase
              .from('donations')
              .insert({
                id: `don-${Date.now()}`,
                receipt_number: generatedReceiptNumber,
                donor_name: cleanDonorName,
                mobile: cleanMobile,
                email: email ? String(email).trim().slice(0, 100) : null,
                address: cleanAddress || null,
                amount: cleanAmount,
                payment_mode: 'Razorpay',
                transaction_id: razorpayPaymentId,
                purpose: causeOrService || 'Charitable Donation for Humanity & Welfare',
                is_verified: true,
                status: 'Approved',
                approval_remarks: 'Verified automatically via Razorpay server-side signature',
                approved_at: nowIso,
                approved_by: 'Razorpay System',
                donated_at: nowIso,
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
                payment_gateway: 'razorpay',
                raw_data: {
                  donorName: cleanDonorName,
                  mobile: cleanMobile,
                  email: email || '',
                  address: cleanAddress,
                  amount: cleanAmount,
                  receiptNumber: generatedReceiptNumber,
                  paymentMethod: 'Online (Razorpay)',
                  transactionId: razorpayPaymentId,
                  isVerified: true,
                  status: 'Approved',
                  donatedAt: nowIso,
                },
              })
              .select()
              .single();

            if (insertedDonation?.receipt_number) {
              generatedReceiptNumber = insertedDonation.receipt_number;
            }
          } else if (isSmartId) {
            await supabase.from('id_card_orders').upsert({
              id: `LKST-IDORD-${Date.now()}`,
              registration_id: referenceId || `APP-${Date.now()}`,
              registration_type: 'service_application',
              tier: 'special_service_200',
              fee_amount: 200.0,
              payment_status: 'paid',
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              admin_approval_status: 'Pending',
              id_card_issued: false,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }
        } catch (dbErr) {
          console.warn('Database write error during payment verification:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        verified: true,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        purpose: cleanPurpose,
        receiptNumber: generatedReceiptNumber,
        donorName: cleanDonorName,
        amount: cleanAmount,
        status: 'Approved',
        verifiedAt: nowIso,
      });
    } catch (err: any) {
      console.error('Exception in /api/verify-razorpay-payment:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error verifying payment.',
      });
    }
  });

  // 3. Webhook Endpoint: POST /api/razorpay-webhook
  app.post('/api/razorpay-webhook', async (req: any, res: Response) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

      // Verify webhook signature if secret configured
      if (RAZORPAY_WEBHOOK_SECRET) {
        const expectedSignature = crypto
          .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
          .update(rawBody)
          .digest('hex');

        if (expectedSignature !== signature) {
          console.warn('Webhook signature mismatch');
          return res.status(400).json({ error: 'Invalid webhook signature' });
        }
      }

      const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
      const eventId = event.event_id || event.id || `evt_${Date.now()}`;
      const eventType = event.event;

      // Idempotency check: Ignore duplicate event deliveries
      if (processedWebhooks.has(eventId)) {
        return res.status(200).json({ status: 'already_processed', eventId });
      }
      processedWebhooks.add(eventId);

      console.log(`[Razorpay Webhook] Received ${eventType} event (ID: ${eventId})`);

      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = event?.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id || event?.payload?.order?.entity?.id;
        const paymentId = paymentEntity?.id;

        if (paymentEntity && supabase) {
          const notes = paymentEntity.notes || {};
          const cleanAmount = (paymentEntity.amount || 0) / 100;

          // Update order status
          if (orderId) {
            await supabase
              .from('razorpay_orders')
              .update({ status: 'paid', updated_at: new Date().toISOString() })
              .eq('order_id', orderId);
          }

          // Check if donation already recorded to prevent duplicates
          if (paymentId) {
            const { data: existing } = await supabase
              .from('donations')
              .select('id')
              .eq('transaction_id', paymentId)
              .maybeSingle();

            if (!existing) {
              const receiptNumber = `LKST-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
              const nowIso = new Date().toISOString();
              await supabase.from('donations').insert({
                id: `don-${Date.now()}`,
                receipt_number: receiptNumber,
                donor_name: notes.donorName || paymentEntity.email || 'Anonymous Supporter',
                mobile: notes.mobile || paymentEntity.contact || '',
                email: paymentEntity.email || null,
                address: notes.address || null,
                amount: cleanAmount,
                payment_mode: 'Razorpay',
                transaction_id: paymentId,
                purpose: notes.purpose || 'Charitable Donation for Humanity & Welfare',
                is_verified: true,
                status: 'Approved',
                approval_remarks: 'Confirmed via Razorpay Webhook (payment.captured)',
                approved_at: nowIso,
                approved_by: 'Razorpay Webhook',
                donated_at: nowIso,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                payment_gateway: 'razorpay',
              });
            }
          }
        }
      }

      return res.status(200).json({ status: 'ok', eventId });
    } catch (whErr: any) {
      console.error('Webhook processing exception:', whErr);
      return res.status(500).json({ error: whErr.message });
    }
  });

  // Vite integration: middleware in dev, static serving in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Luv Kush Seva Trust server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
