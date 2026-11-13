import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
const RAZORPAY_WEBHOOK_SECRET = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://yjbowhkgwatrwmuyvkja.supabase.co'
).trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || '').trim();
// Ephemeral fallback guarantees no hardcoded secret exists if ADMIN_SESSION_SECRET is not set
const ADMIN_SESSION_SECRET =
  (process.env.ADMIN_SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const processedWebhooks = new Set<string>();

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function createAdminToken(username: string): string {
  const payload = {
    sub: username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12 hours
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAdminToken(token: string): { valid: boolean; username?: string } {
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [encoded, sig] = parts;
  if (!encoded || !sig) return { valid: false };
  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  if (!timingSafeEqualString(sig, expectedSig)) return { valid: false };
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (parsed?.role !== 'admin' || typeof parsed?.exp !== 'number') {
      return { valid: false };
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }
    return { valid: true, username: String(parsed.sub || 'Admin') };
  } catch {
    return { valid: false };
  }
}

async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Admin authorization required.' });
  }
  const token = authHeader.slice(7).trim();

  // 1. Verify HMAC session token issued by /api/admin/login
  const localCheck = verifyAdminToken(token);
  if (localCheck.valid) {
    (req as any).adminUser = localCheck.username;
    return next();
  }

  // 2. Fallback: verify Supabase Auth JWT with app_metadata.role === 'admin'
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user && data.user.app_metadata?.role === 'admin') {
        (req as any).adminUser = data.user.email || data.user.id;
        return next();
      }
    } catch {
      // ignore
    }
  }

  return res.status(401).json({ success: false, error: 'Invalid or expired admin session.' });
}

async function generateUniqueReceiptNumber(refId: string): Promise<string> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('generate_unique_receipt_number');
      if (!error && typeof data === 'string' && data.startsWith('LKST-REC-')) {
        return data;
      }
    } catch {
      // Fallback if Phase 1 SQL migration RPC hasn't been executed yet
    }
  }
  const suffix = refId.replace(/^(order_|pay_)/, '').slice(-8).toUpperCase();
  return `LKST-REC-${new Date().getFullYear()}-${suffix || Date.now().toString().slice(-6)}`;
}

async function insertDonationWithCompat(donationRow: Record<string, any>) {
  if (!supabase) return { data: null, error: new Error('Supabase service role client not configured') };

  const primary = await supabase
    .from('donations')
    .insert(donationRow)
    .select('id, receipt_number')
    .single();

  if (
    primary.error &&
    (primary.error.code === 'PGRST204' || String(primary.error.message || '').includes('column'))
  ) {
    const {
      address: _a,
      approval_remarks: _r,
      approved_at: _at,
      approved_by: _by,
      ...compatRow
    } = donationRow;
    return await supabase
      .from('donations')
      .insert(compatRow)
      .select('id, receipt_number')
      .single();
  }

  return primary;
}

function mapDonationRow(row: any) {
  return {
    ...(row.raw_data || {}),
    id: row.id,
    receiptNumber: row.receipt_number || row.raw_data?.receiptNumber,
    donorName: row.donor_name || row.raw_data?.donorName,
    mobile: row.mobile || row.raw_data?.mobile,
    email: row.email || row.raw_data?.email,
    address: row.address || row.raw_data?.address,
    panCard: row.pan_card || row.pan_or_aadhaar || row.raw_data?.panCard,
    amount: Number(row.amount ?? row.raw_data?.amount ?? 0),
    paymentMethod: row.payment_mode || row.raw_data?.paymentMethod || 'UPI',
    transactionId: row.transaction_id || row.raw_data?.transactionId,
    message: row.purpose || row.raw_data?.message,
    isVerified: row.is_verified ?? row.raw_data?.isVerified ?? true,
    status: row.status || row.raw_data?.status || (row.is_verified ? 'Approved' : 'Pending'),
    approvalRemarks: row.approval_remarks || row.raw_data?.approvalRemarks,
    approvedAt: row.approved_at || row.raw_data?.approvedAt,
    approvedBy: row.approved_by || row.raw_data?.approvedBy,
    paymentGateway:
      row.payment_gateway ||
      row.raw_data?.paymentGateway ||
      (row.razorpay_payment_id ? 'razorpay' : 'manual'),
    razorpayOrderId: row.razorpay_order_id || row.raw_data?.razorpayOrderId,
    razorpayPaymentId: row.razorpay_payment_id || row.raw_data?.razorpayPaymentId,
    donatedAt: row.donated_at || row.raw_data?.donatedAt,
  };
}

async function startServer() {
  const app = express();

  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, apikey, x-razorpay-signature'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Luv Kush Seva Trust Payment Backend',
      razorpayConfigured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
      webhookSecretConfigured: Boolean(RAZORPAY_WEBHOOK_SECRET),
      supabaseServiceConfigured: Boolean(supabase),
      adminAuthConfigured: Boolean(ADMIN_USERNAME && (ADMIN_PASSWORD || ADMIN_PASSWORD_HASH)),
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
      if (!parsedAmount || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount < 1) {
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

      const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: receiptCode.slice(0, 40),
          payment_capture: 1,
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

      if (supabase) {
        const nowIso = new Date().toISOString();
        // Omit `id` so PostgreSQL gen_random_uuid() generates valid UUID PK
        const { error: dbErr } = await supabase.from('razorpay_orders').upsert(
          {
            order_id: razorpayOrderId,
            purpose: cleanPurpose,
            amount: parsedAmount,
            amount_paise: amountPaise,
            currency: 'INR',
            status: 'created',
            donor_name: cleanDonorName,
            email: cleanEmail || null,
            contact: cleanMobile || '0000000000',
            receipt_number: receiptCode,
            notes: {
              ...(notes || {}),
              address: cleanAddress,
              referenceId: referenceId || null,
              createdVia: 'express_server_proxy',
              rzpCreatedAt: rzpData.created_at,
            },
            created_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: 'order_id' }
        );
        if (dbErr) {
          console.error('Error recording razorpay_orders in Supabase:', dbErr);
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

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'Razorpay credentials not configured on server.',
          code: 'RAZORPAY_CONFIG_ERROR',
        });
      }

      // Verify HMAC-SHA256 signature with timing-safe comparison
      const payloadToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(payloadToSign)
        .digest('hex');

      const receivedSig = String(razorpaySignature).trim();
      if (!timingSafeEqualString(expectedSignature, receivedSig)) {
        console.warn('HMAC-SHA256 signature mismatch for order:', razorpayOrderId);
        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature. Payment could not be verified.',
          code: 'SIGNATURE_MISMATCH',
        });
      }

      let orderRow: any = null;
      if (supabase) {
        const { data } = await supabase
          .from('razorpay_orders')
          .select('*')
          .eq('order_id', razorpayOrderId)
          .maybeSingle();
        orderRow = data;
      }

      // Mandatory Razorpay Payments API cross-verification
      const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
      const payRes = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpayPaymentId)}`,
        {
          method: 'GET',
          headers: { Authorization: authHeader },
        }
      );

      if (!payRes.ok) {
        const errText = await payRes.text();
        console.error('Razorpay payment lookup failed:', payRes.status, errText);
        return res.status(502).json({
          success: false,
          error: 'Unable to confirm payment status with Razorpay gateway.',
          code: 'RAZORPAY_VERIFY_FAILED',
        });
      }

      const payEntity = await payRes.json();

      if (payEntity?.order_id !== razorpayOrderId) {
        return res.status(400).json({
          success: false,
          error: 'Payment order mismatch detected.',
          code: 'ORDER_MISMATCH',
        });
      }
      if (payEntity?.currency !== 'INR') {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment currency.',
          code: 'CURRENCY_MISMATCH',
        });
      }
      if (!['captured', 'authorized'].includes(payEntity?.status)) {
        return res.status(400).json({
          success: false,
          error: `Payment is not completed (status: ${payEntity?.status || 'unknown'}).`,
          code: 'PAYMENT_NOT_CAPTURED',
        });
      }
      if (orderRow?.amount_paise && Number(payEntity.amount) !== Number(orderRow.amount_paise)) {
        return res.status(400).json({
          success: false,
          error: 'Paid amount does not match original order amount.',
          code: 'AMOUNT_MISMATCH',
        });
      }

      const effectivePurpose = orderRow?.purpose || purpose;
      const isSmartId = effectivePurpose === 'smart_id_card' || effectivePurpose === 'smart_id_card_fee';
      const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
      const cleanDonorName = (donorName || orderRow?.donor_name || 'Supporter').trim().slice(0, 100);
      const cleanMobile = (mobile || orderRow?.contact || '').replace(/\D/g, '').slice(0, 15);
      const cleanEmail = (email || orderRow?.email || payEntity?.email || '').trim().slice(0, 100);
      const cleanAddress = (address || orderRow?.notes?.address || '').trim().slice(0, 250);
      const cleanAmount = Number(payEntity.amount) / 100 || Number(amount) || (isSmartId ? 200 : 100);
      const paymentMethodLabel = payEntity?.method
        ? `Online (Razorpay - ${String(payEntity.method).toUpperCase()})`
        : 'Online (Razorpay)';
      const nowIso = new Date().toISOString();

      let generatedReceiptNumber = await generateUniqueReceiptNumber(razorpayOrderId);

      if (supabase) {
        await supabase
          .from('razorpay_orders')
          .update({ status: 'paid', updated_at: nowIso })
          .eq('order_id', razorpayOrderId);

        const { error: payUpsertErr } = await supabase.from('razorpay_payments').upsert(
          {
            payment_id: razorpayPaymentId,
            order_id: razorpayOrderId,
            amount: cleanAmount,
            currency: 'INR',
            status: payEntity.status === 'authorized' ? 'authorized' : 'captured',
            method: payEntity.method || 'razorpay',
            bank: payEntity.bank || null,
            wallet: payEntity.wallet || null,
            vpa: payEntity.vpa || null,
            email: cleanEmail || null,
            contact: payEntity.contact || cleanMobile || null,
            signature_verified: true,
            verified_at: nowIso,
            raw_response: payEntity,
            created_at: nowIso,
          },
          { onConflict: 'payment_id' }
        );
        if (payUpsertErr) {
          console.error('Error upserting razorpay_payments record:', payUpsertErr);
        }

        if (cleanPurpose === 'donation') {
          const { data: existingDonation } = await supabase
            .from('donations')
            .select('id, receipt_number')
            .or(
              `razorpay_payment_id.eq.${razorpayPaymentId},razorpay_order_id.eq.${razorpayOrderId},transaction_id.eq.${razorpayPaymentId}`
            )
            .maybeSingle();

          if (existingDonation?.receipt_number) {
            generatedReceiptNumber = existingDonation.receipt_number;
          } else {
            const rawDataPayload = {
              donorName: cleanDonorName,
              mobile: cleanMobile,
              email: cleanEmail,
              address: cleanAddress,
              amount: cleanAmount,
              receiptNumber: generatedReceiptNumber,
              paymentMethod: paymentMethodLabel,
              transactionId: razorpayPaymentId,
              razorpayOrderId,
              razorpayPaymentId,
              paymentGateway: 'razorpay',
              approvalRemarks: 'Verified automatically via Razorpay server-side signature',
              approvedAt: nowIso,
              approvedBy: 'Razorpay System',
              isVerified: true,
              status: 'Approved',
              donatedAt: nowIso,
            };

            const donationRow: Record<string, any> = {
              id: `don-${razorpayPaymentId}`,
              receipt_number: generatedReceiptNumber,
              donor_name: cleanDonorName,
              mobile: cleanMobile,
              email: cleanEmail || null,
              address: cleanAddress || null,
              amount: cleanAmount,
              payment_mode: paymentMethodLabel,
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
              raw_data: rawDataPayload,
            };

            const { data: insertedDonation, error: donErr } =
              await insertDonationWithCompat(donationRow);

            if (donErr) {
              console.error('Error inserting verified donation in Supabase:', donErr);
              return res.status(500).json({
                success: false,
                error: 'Failed to persist verified donation record.',
                code: 'DONATION_PERSIST_ERROR',
              });
            }
            if (insertedDonation?.receipt_number) {
              generatedReceiptNumber = insertedDonation.receipt_number;
            }
          }
        } else if (isSmartId) {
          const { data: existingIdOrder } = await supabase
            .from('id_card_orders')
            .select('id')
            .or(`payment_id.eq.${razorpayPaymentId},order_id.eq.${razorpayOrderId}`)
            .maybeSingle();

          if (!existingIdOrder) {
            const { error: idErr } = await supabase.from('id_card_orders').insert({
              order_id: razorpayOrderId,
              payment_id: razorpayPaymentId,
              tier: 'special_service_200',
              applicant_id: referenceId || null,
              full_name: cleanDonorName,
              mobile: cleanMobile || '0000000000',
              email: cleanEmail || null,
              service_category: orderRow?.notes?.serviceCategory || null,
              amount_fee: 200.0,
              is_paid: true,
              admin_approved: false,
              card_issued: false,
              created_at: nowIso,
              updated_at: nowIso,
            });
            if (idErr) {
              console.error('Error inserting id_card_orders:', idErr);
            }
          }
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

  // 3. Webhook Endpoint: POST /api/razorpay-webhook (Fail-Closed Signature Verification)
  app.post('/api/razorpay-webhook', async (req: any, res: Response) => {
    try {
      if (!RAZORPAY_WEBHOOK_SECRET) {
        console.error('RAZORPAY_WEBHOOK_SECRET is not configured; rejecting webhook request.');
        return res.status(500).json({ error: 'Webhook secret not configured on server.' });
      }

      const signature = String(req.headers['x-razorpay-signature'] || '').trim();
      if (!signature) {
        return res.status(401).json({ error: 'Missing Razorpay webhook signature.' });
      }

      const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (!timingSafeEqualString(expectedSignature, signature)) {
        console.warn('Webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }

      const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
      const paymentEntity = event?.payload?.payment?.entity;
      const orderEntity = event?.payload?.order?.entity;
      const orderId = paymentEntity?.order_id || orderEntity?.id || null;
      const paymentId = paymentEntity?.id || null;
      const eventId =
        event?.event_id ||
        event?.id ||
        String(req.headers['x-razorpay-event-id'] || '') ||
        `evt_${event?.event || 'unknown'}_${paymentId || orderId || Date.now()}`;
      const eventType = event?.event || 'unknown';
      const entityId = paymentId || orderId || eventId;
      const nowIso = new Date().toISOString();

      if (processedWebhooks.has(eventId)) {
        return res.status(200).json({ status: 'already_processed', eventId });
      }

      if (supabase) {
        const { data: existingEvent } = await supabase
          .from('razorpay_webhooks')
          .select('id')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvent) {
          processedWebhooks.add(eventId);
          return res.status(200).json({ status: 'already_processed', eventId });
        }

        const { error: whErr } = await supabase.from('razorpay_webhooks').insert({
          event_id: eventId,
          event_type: eventType,
          entity_id: entityId,
          payload: event,
          signature_verified: true,
          processed: true,
          created_at: nowIso,
        });
        if (whErr) {
          console.error('Error recording webhook event:', whErr);
        }
      }
      processedWebhooks.add(eventId);

      if ((eventType === 'payment.captured' || eventType === 'order.paid') && paymentEntity && supabase) {
        const notes = paymentEntity.notes || {};
        const cleanAmount = (paymentEntity.amount || 0) / 100;
        const purpose = notes.purpose || 'donation';

        if (orderId) {
          await supabase
            .from('razorpay_orders')
            .update({ status: 'paid', updated_at: nowIso })
            .eq('order_id', orderId);
        }

        if (paymentId && orderId) {
          await supabase.from('razorpay_payments').upsert(
            {
              payment_id: paymentId,
              order_id: orderId,
              amount: cleanAmount,
              currency: paymentEntity.currency || 'INR',
              status: 'captured',
              method: paymentEntity.method || 'razorpay',
              bank: paymentEntity.bank || null,
              wallet: paymentEntity.wallet || null,
              vpa: paymentEntity.vpa || null,
              email: paymentEntity.email || null,
              contact: paymentEntity.contact || null,
              signature_verified: true,
              verified_at: nowIso,
              raw_response: paymentEntity,
              created_at: nowIso,
            },
            { onConflict: 'payment_id' }
          );
        }

        if (paymentId && (purpose === 'donation' || purpose === 'charitable_donation')) {
          const orFilter = orderId
            ? `razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId},transaction_id.eq.${paymentId}`
            : `razorpay_payment_id.eq.${paymentId},transaction_id.eq.${paymentId}`;

          const { data: existing } = await supabase
            .from('donations')
            .select('id')
            .or(orFilter)
            .maybeSingle();

          if (!existing) {
            const receiptNumber = await generateUniqueReceiptNumber(orderId || paymentId);
            const donorName = notes.donorName || paymentEntity.email || 'Supporter';
            const mobile = String(notes.mobile || notes.contact || paymentEntity.contact || '')
              .replace(/\D/g, '')
              .slice(0, 15);
            const paymentMethodLabel = paymentEntity.method
              ? `Online (Razorpay - ${String(paymentEntity.method).toUpperCase()})`
              : 'Online (Razorpay)';

            await insertDonationWithCompat({
              id: `don-${paymentId}`,
              receipt_number: receiptNumber,
              donor_name: donorName,
              mobile,
              email: paymentEntity.email || null,
              address: notes.address || null,
              amount: cleanAmount,
              payment_mode: paymentMethodLabel,
              transaction_id: paymentId,
              purpose: notes.cause || 'Charitable Donation for Humanity & Welfare',
              is_verified: true,
              status: 'Approved',
              approval_remarks: `Confirmed via Razorpay Webhook (${eventType})`,
              approved_at: nowIso,
              approved_by: 'Razorpay Webhook',
              donated_at: nowIso,
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              payment_gateway: 'razorpay',
              raw_data: {
                donorName,
                mobile,
                email: paymentEntity.email || '',
                address: notes.address || '',
                amount: cleanAmount,
                receiptNumber,
                paymentMethod: paymentMethodLabel,
                transactionId: paymentId,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                paymentGateway: 'razorpay',
                isVerified: true,
                status: 'Approved',
                donatedAt: nowIso,
              },
            });
          }
        } else if (
          paymentId &&
          orderId &&
          (purpose === 'smart_id_card' || purpose === 'smart_id_card_fee')
        ) {
          const { data: existingIdOrder } = await supabase
            .from('id_card_orders')
            .select('id')
            .or(`payment_id.eq.${paymentId},order_id.eq.${orderId}`)
            .maybeSingle();

          if (!existingIdOrder) {
            await supabase.from('id_card_orders').insert({
              order_id: orderId,
              payment_id: paymentId,
              tier: 'special_service_200',
              applicant_id: notes.referenceId || null,
              full_name: notes.donorName || 'Applicant',
              mobile:
                String(notes.mobile || notes.contact || paymentEntity.contact || '0000000000')
                  .replace(/\D/g, '')
                  .slice(0, 15) || '0000000000',
              email: paymentEntity.email || null,
              service_category: notes.serviceCategory || null,
              amount_fee: 200.0,
              is_paid: true,
              admin_approved: false,
              card_issued: false,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }
        }
      } else if (eventType === 'payment.failed' && paymentEntity && supabase) {
        if (orderId) {
          await supabase
            .from('razorpay_orders')
            .update({ status: 'failed', updated_at: nowIso })
            .eq('order_id', orderId);
        }
      }

      return res.status(200).json({ status: 'ok', eventId });
    } catch (whErr: any) {
      console.error('Webhook processing exception:', whErr);
      return res.status(500).json({ error: whErr.message });
    }
  });

  // 4. Safe Public Exact-Match Receipt Lookup (Replaces open public table dump)
  app.get('/api/receipt-lookup', async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || '').trim();
      if (q.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 6 characters.',
        });
      }
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Database service unavailable.',
        });
      }

      const digits = q.replace(/\D/g, '');
      const filters = [
        `receipt_number.ilike.${q}`,
        `razorpay_payment_id.eq.${q}`,
        `transaction_id.eq.${q}`,
      ];
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        filters.push(`mobile.eq.${last10}`, `mobile.eq.+91${last10}`, `mobile.eq.91${last10}`);
      }

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'Approved')
        .or(filters.join(','))
        .order('donated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Receipt lookup query error:', error);
        return res.status(500).json({ success: false, error: 'Failed to look up receipt.' });
      }

      const row = data?.[0];
      return res.json({
        success: true,
        donation: row ? mapDonationRow(row) : null,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Public Service Registration Smart ID Order Link (Verified / Free Tier Only)
  app.post('/api/id-card-orders', async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }
      const { orderId, paymentId, tier, applicantId, fullName, mobile, email, serviceCategory } =
        req.body || {};
      const nowIso = new Date().toISOString();

      if (tier === 'special_service_200') {
        if (!orderId || !paymentId) {
          return res.status(400).json({
            success: false,
            error: 'Verified orderId and paymentId required for paid Smart ID registration.',
          });
        }
        // Verify genuine captured payment exists in razorpay_payments
        const { data: verifiedPay } = await supabase
          .from('razorpay_payments')
          .select('payment_id, order_id, status')
          .eq('payment_id', paymentId)
          .eq('order_id', orderId)
          .eq('signature_verified', true)
          .maybeSingle();

        if (!verifiedPay) {
          return res.status(403).json({
            success: false,
            error: 'Payment record is not verified yet.',
          });
        }

        const { data: existingOrder } = await supabase
          .from('id_card_orders')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (existingOrder) {
          await supabase
            .from('id_card_orders')
            .update({
              applicant_id: applicantId || null,
              registration_id: applicantId || null,
              full_name: String(fullName || 'Applicant').slice(0, 100),
              mobile: String(mobile || '0000000000').replace(/\D/g, '').slice(0, 15),
              email: email || null,
              service_category: serviceCategory || null,
              updated_at: nowIso,
            })
            .eq('id', existingOrder.id);
        } else {
          await supabase.from('id_card_orders').insert({
            order_id: orderId,
            payment_id: paymentId,
            tier: 'special_service_200',
            applicant_id: applicantId || null,
            full_name: String(fullName || 'Applicant').slice(0, 100),
            mobile: String(mobile || '0000000000').replace(/\D/g, '').slice(0, 15),
            email: email || null,
            service_category: serviceCategory || null,
            amount_fee: 200.0,
            is_paid: true,
            admin_approved: false,
            card_issued: false,
            created_at: nowIso,
            updated_at: nowIso,
          });
        }

        return res.json({ success: true });
      }

      // General Associate Free Tier
      await supabase.from('id_card_orders').insert({
        order_id: null,
        payment_id: null,
        tier: 'general_associate_free',
        applicant_id: applicantId || null,
        full_name: String(fullName || 'Applicant').slice(0, 100),
        mobile: String(mobile || '0000000000').replace(/\D/g, '').slice(0, 15),
        email: email || null,
        service_category: serviceCategory || null,
        amount_fee: 0,
        is_paid: false,
        admin_approved: false,
        card_issued: false,
        created_at: nowIso,
        updated_at: nowIso,
      });

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Error in POST /api/id-card-orders:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Server-Side Admin Authentication (No hardcoded passwords in frontend!)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {};

    if (!ADMIN_USERNAME || (!ADMIN_PASSWORD && !ADMIN_PASSWORD_HASH)) {
      return res.status(503).json({
        success: false,
        error:
          'Server admin authentication is not configured (set ADMIN_USERNAME and ADMIN_PASSWORD environment variables).',
        code: 'ADMIN_AUTH_NOT_CONFIGURED',
      });
    }

    const cleanUser = String(username || '').trim().toLowerCase();
    const expectedUser = ADMIN_USERNAME.toLowerCase();
    const cleanPass = String(password || '').trim();

    let passwordValid = false;
    if (ADMIN_PASSWORD_HASH) {
      const providedHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
      passwordValid = timingSafeEqualString(providedHash, ADMIN_PASSWORD_HASH.toLowerCase());
    } else if (ADMIN_PASSWORD) {
      passwordValid = timingSafeEqualString(cleanPass, ADMIN_PASSWORD);
    }

    const userValid = timingSafeEqualString(cleanUser, expectedUser);

    if (!userValid || !passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = createAdminToken(ADMIN_USERNAME);
    return res.json({
      success: true,
      token,
      username: ADMIN_USERNAME,
    });
  });

  app.get('/api/admin/session', requireAdminAuth, (req: Request, res: Response) => {
    res.json({
      success: true,
      authenticated: true,
      username: (req as any).adminUser,
    });
  });

  // 7. Protected Admin Donation Management API (Uses SUPABASE_SERVICE_ROLE_KEY server-side)
  app.get('/api/admin/donations', requireAdminAuth, async (_req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database service role not configured.' });
    }
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('donated_at', { ascending: false });
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({
      success: true,
      donations: (data || []).map(mapDonationRow),
    });
  });

  app.post('/api/admin/donations', requireAdminAuth, async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database service role not configured.' });
    }
    const d = req.body || {};
    const payload = {
      id: d.id || `don-${Date.now()}`,
      receipt_number: d.receiptNumber,
      donor_name: d.donorName,
      mobile: d.mobile,
      email: d.email || null,
      address: d.address || null,
      pan_card: d.panCard || null,
      amount: d.amount,
      payment_mode: d.paymentMethod,
      transaction_id: d.transactionId || null,
      purpose: d.message || null,
      is_verified: Boolean(d.isVerified),
      status: d.status || (d.isVerified ? 'Approved' : 'Pending'),
      approval_remarks: d.approvalRemarks || null,
      approved_at: d.approvedAt || null,
      approved_by: d.approvedBy || (req as any).adminUser || 'Admin',
      payment_gateway: d.paymentGateway || (d.razorpayPaymentId ? 'razorpay' : 'manual'),
      razorpay_order_id: d.razorpayOrderId || null,
      razorpay_payment_id: d.razorpayPaymentId || null,
      donated_at: d.donatedAt || new Date().toISOString(),
      raw_data: d,
    };

    const { error } = await supabase.from('donations').upsert(payload);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true });
  });

  app.delete('/api/admin/donations/:id', requireAdminAuth, async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database service role not configured.' });
    }
    const { id } = req.params;
    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true });
  });

  app.get('/api/admin/id-card-orders', requireAdminAuth, async (_req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database service role not configured.' });
    }
    const { data, error } = await supabase
      .from('id_card_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({
      success: true,
      orders: (data || []).map((row: any) => ({
        id: row.id,
        orderId: row.order_id || row.id,
        paymentId: row.payment_id,
        tier: row.tier,
        applicantId: row.applicant_id,
        fullName: row.full_name,
        mobile: row.mobile,
        email: row.email,
        serviceCategory: row.service_category,
        amountFee: Number(row.amount_fee || 0),
        isPaid: Boolean(row.is_paid),
        adminApproved: Boolean(row.admin_approved),
        adminApprovedAt: row.admin_approved_at,
        adminApprovedBy: row.admin_approved_by,
        cardIssued: Boolean(row.card_issued),
        idCardId: row.id_card_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  });

  app.patch(
    '/api/admin/id-card-orders/:orderId',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      if (!supabase) {
        return res.status(503).json({ success: false, error: 'Database service role not configured.' });
      }
      const { orderId } = req.params;
      const { adminApproved, cardIssued, idCardId, adminName } = req.body || {};
      const nowIso = new Date().toISOString();

      const updateFields: Record<string, any> = {
        admin_approved: Boolean(adminApproved),
        admin_approved_at: adminApproved ? nowIso : null,
        admin_approved_by: adminApproved ? adminName || (req as any).adminUser || 'Admin' : null,
        updated_at: nowIso,
      };
      if (cardIssued !== undefined) updateFields.card_issued = Boolean(cardIssued);
      if (idCardId !== undefined) updateFields.id_card_id = idCardId;

      const query = String(orderId).startsWith('order_')
        ? supabase.from('id_card_orders').update(updateFields).eq('order_id', orderId)
        : supabase.from('id_card_orders').update(updateFields).eq('id', orderId);

      const { error } = await query;
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true });
    }
  );

  // Vite integration: middleware in dev, static serving in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
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
