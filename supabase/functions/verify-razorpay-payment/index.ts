import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getCurrentYearIST(): number {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.getUTCFullYear();
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const b = new Uint8Array(signature);
  return Array.from(b).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function authorizeClientRequest(req: Request, supabaseUrl: string): Promise<boolean> {
  const apiKeyHeader = (req.headers.get('apikey') || '').trim();
  const authHeader = (req.headers.get('authorization') || '').trim();
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  const candidateKey = apiKeyHeader || bearerToken;
  if (!candidateKey || candidateKey.startsWith('sb_secret_')) {
    return false;
  }

  const configuredAnon = (Deno.env.get('SUPABASE_ANON_KEY') || '').trim();
  const configuredPublishable = (Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '').trim();

  if (configuredAnon && timingSafeEqualString(candidateKey, configuredAnon)) {
    return true;
  }
  if (configuredPublishable && timingSafeEqualString(candidateKey, configuredPublishable)) {
    return true;
  }

  try {
    const verifyHeaders: Record<string, string> = { apikey: candidateKey };
    if (bearerToken && bearerToken.split('.').length === 3) {
      verifyHeaders['Authorization'] = `Bearer ${bearerToken}`;
    }
    const authCheckRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: verifyHeaders,
    });
    return authCheckRes.ok;
  } catch {
    return false;
  }
}

async function generateReceiptNumber(
  supabase: any,
  orderId: string,
  attempt: number = 0
): Promise<string> {
  if (attempt === 0) {
    try {
      const { data, error } = await supabase.rpc('generate_unique_receipt_number');
      if (!error && typeof data === 'string' && data.startsWith('LKST-REC-')) {
        return data;
      }
    } catch {
      // Fallback if DB sequence/RPC migration has not yet been executed
    }
  }
  const yr = getCurrentYearIST();
  const suffix = orderId.replace(/^order_/, '').slice(-8).toUpperCase();
  return attempt === 0
    ? `LKST-REC-${yr}-${suffix}`
    : `LKST-REC-${yr}-${suffix}-${attempt}`;
}

async function findExistingDonation(
  supabase: any,
  razorpayPaymentId: string,
  razorpayOrderId: string
): Promise<{ id: string; receipt_number: string } | null> {
  const { data, error } = await supabase
    .from('donations')
    .select('id, receipt_number')
    .or(
      `razorpay_payment_id.eq.${razorpayPaymentId},razorpay_order_id.eq.${razorpayOrderId},transaction_id.eq.${razorpayPaymentId}`
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error querying existing donation:', error.code, error.message);
    return null;
  }
  return data;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
      405
    );
  }

  try {
    const RAZORPAY_KEY_ID = (Deno.env.get('RAZORPAY_KEY_ID') || '').trim();
    const RAZORPAY_KEY_SECRET = (Deno.env.get('RAZORPAY_KEY_SECRET') || '').trim();
    const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').trim();
    const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET.includes('placeholder')) {
      console.error('Server Razorpay credentials missing.');
      return jsonResponse(
        {
          success: false,
          error: 'Payment verification configuration error.',
          code: 'CONFIG_MISSING',
        },
        500
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      console.error('Supabase service role credentials missing.');
      return jsonResponse(
        {
          success: false,
          error: 'Server database configuration error.',
          code: 'DATABASE_AUTH_MISSING',
        },
        500
      );
    }

    const authorized = await authorizeClientRequest(req, SUPABASE_URL);
    if (!authorized) {
      return jsonResponse(
        {
          success: false,
          error: 'Unauthorized request.',
          code: 'UNAUTHORIZED',
        },
        401
      );
    }

    let body: Record<string, any>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return jsonResponse(
          { success: false, error: 'Invalid JSON request body.', code: 'INVALID_JSON' },
          400
        );
      }
      body = parsed;
    } catch {
      return jsonResponse(
        { success: false, error: 'Malformed JSON request body.', code: 'INVALID_JSON' },
        400
      );
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      purpose,
      donorName,
      mobile,
      email,
      address,
      causeOrService,
      referenceId,
    } = body;

    const cleanOrderId = String(razorpayOrderId || '').trim();
    const cleanPaymentId = String(razorpayPaymentId || '').trim();
    const receivedSig = String(razorpaySignature || '').trim().toLowerCase();

    if (
      !/^order_[a-zA-Z0-9]{10,}$/.test(cleanOrderId) ||
      !/^pay_[a-zA-Z0-9]{10,}$/.test(cleanPaymentId) ||
      !/^[a-f0-9]{64}$/.test(receivedSig)
    ) {
      return jsonResponse(
        {
          success: false,
          error: 'Missing or invalid payment verification parameters.',
          code: 'INVALID_VERIFICATION_PARAMS',
        },
        400
      );
    }

    // 1. Cryptographic HMAC-SHA256 signature verification
    const payloadToSign = `${cleanOrderId}|${cleanPaymentId}`;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, payloadToSign);

    if (!timingSafeEqualString(expectedSignature, receivedSig)) {
      console.warn('HMAC-SHA256 signature mismatch for order:', cleanOrderId);
      return jsonResponse(
        {
          success: false,
          error: 'Invalid payment signature. Payment could not be verified.',
          code: 'SIGNATURE_MISMATCH',
        },
        400
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Require a valid matching order record in razorpay_orders before approval
    const { data: orderRow, error: orderFetchErr } = await supabase
      .from('razorpay_orders')
      .select('*')
      .eq('order_id', cleanOrderId)
      .maybeSingle();

    if (orderFetchErr) {
      console.error('Database error looking up razorpay_orders:', orderFetchErr.code, orderFetchErr.message);
      return jsonResponse(
        {
          success: false,
          error: 'Unable to verify original payment order.',
          code: 'DATABASE_ERROR',
        },
        500
      );
    }

    if (!orderRow) {
      console.warn('Payment verification rejected: order_id not found in razorpay_orders:', cleanOrderId);
      return jsonResponse(
        {
          success: false,
          error: 'Matching payment order record was not found.',
          code: 'ORDER_NOT_FOUND',
        },
        400
      );
    }

    // 3. Mandatory cross-verification with Razorpay Payments API
    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const payRes = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(cleanPaymentId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${basicAuth}` },
      }
    );

    if (!payRes.ok) {
      const errText = await payRes.text();
      console.error('Razorpay payment lookup failed:', payRes.status, errText);
      return jsonResponse(
        {
          success: false,
          error: 'Unable to confirm payment status with Razorpay gateway.',
          code: 'RAZORPAY_VERIFY_FAILED',
        },
        502
      );
    }

    const payEntity = await payRes.json();

    if (payEntity?.order_id !== cleanOrderId) {
      return jsonResponse(
        { success: false, error: 'Payment order mismatch detected.', code: 'ORDER_MISMATCH' },
        400
      );
    }

    if (payEntity?.currency !== 'INR' || payEntity?.currency !== orderRow.currency) {
      return jsonResponse(
        { success: false, error: 'Invalid payment currency.', code: 'CURRENCY_MISMATCH' },
        400
      );
    }

    if (Number(payEntity?.amount) !== Number(orderRow.amount_paise)) {
      return jsonResponse(
        {
          success: false,
          error: 'Paid amount does not match original order amount.',
          code: 'AMOUNT_MISMATCH',
        },
        400
      );
    }

    const cleanAmount = Math.round(Number(payEntity.amount)) / 100;
    const cleanEmail = String(email || orderRow.email || payEntity?.email || '').trim().slice(0, 100);
    const cleanMobile = String(mobile || orderRow.contact || '').replace(/\D/g, '').slice(0, 15);
    const nowIso = new Date().toISOString();

    // 4. Only issue an approved receipt when payment status is strictly `captured`
    if (payEntity?.status === 'authorized') {
      const { error: authPayErr } = await supabase.from('razorpay_payments').upsert(
        {
          payment_id: cleanPaymentId,
          order_id: cleanOrderId,
          amount: cleanAmount,
          currency: 'INR',
          status: 'authorized',
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
      if (authPayErr) {
        console.error('Error recording authorized payment:', authPayErr.code, authPayErr.message);
      }

      return jsonResponse(
        {
          success: false,
          verified: false,
          error: 'Payment is authorized and awaiting capture. Your receipt will be issued once payment settles.',
          code: 'PAYMENT_PENDING_CAPTURE',
        },
        409
      );
    }

    if (payEntity?.status !== 'captured') {
      return jsonResponse(
        {
          success: false,
          error: 'Payment has not been captured by the gateway.',
          code: 'PAYMENT_NOT_CAPTURED',
        },
        400
      );
    }

    const effectivePurpose = orderRow.purpose || purpose;
    const isSmartId = effectivePurpose === 'smart_id_card' || effectivePurpose === 'smart_id_card_fee';
    const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
    const cleanDonorName = String(donorName || orderRow.donor_name || 'Supporter').trim().slice(0, 100);
    const cleanAddress = String(address || orderRow?.notes?.address || '').trim().slice(0, 250);
    const paymentMethodLabel = payEntity?.method
      ? `Online (Razorpay - ${String(payEntity.method).toUpperCase()})`
      : 'Online (Razorpay)';

    // 5. Update razorpay_orders status to `paid` and verify write
    const { error: orderUpdateErr } = await supabase
      .from('razorpay_orders')
      .update({ status: 'paid', updated_at: nowIso })
      .eq('order_id', cleanOrderId);

    if (orderUpdateErr) {
      console.error('Error updating razorpay_orders status:', orderUpdateErr.code, orderUpdateErr.message);
      return jsonResponse(
        {
          success: false,
          error: 'Failed to update payment order status.',
          code: 'DATABASE_ERROR',
        },
        500
      );
    }

    // 6. Upsert captured payment record aligned to live razorpay_payments schema
    const { error: payUpsertErr } = await supabase.from('razorpay_payments').upsert(
      {
        payment_id: cleanPaymentId,
        order_id: cleanOrderId,
        amount: cleanAmount,
        currency: 'INR',
        status: 'captured',
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
      console.error('Error upserting razorpay_payments record:', payUpsertErr.code, payUpsertErr.message);
      return jsonResponse(
        {
          success: false,
          error: 'Failed to record verified payment transaction.',
          code: 'DATABASE_ERROR',
        },
        500
      );
    }

    let generatedReceiptNumber = '';

    // 7. Strict Ledger Separation + Atomic Concurrency / 23505 Handling
    if (cleanPurpose === 'donation') {
      const existingDonation = await findExistingDonation(supabase, cleanPaymentId, cleanOrderId);

      if (existingDonation?.receipt_number) {
        generatedReceiptNumber = existingDonation.receipt_number;
      } else {
        let persisted = false;

        for (let attempt = 0; attempt < 3 && !persisted; attempt++) {
          generatedReceiptNumber = await generateReceiptNumber(supabase, cleanOrderId, attempt);

          const rawDataPayload = {
            donorName: cleanDonorName,
            mobile: cleanMobile,
            email: cleanEmail,
            address: cleanAddress,
            amount: cleanAmount,
            receiptNumber: generatedReceiptNumber,
            paymentMethod: paymentMethodLabel,
            transactionId: cleanPaymentId,
            razorpayOrderId: cleanOrderId,
            razorpayPaymentId: cleanPaymentId,
            paymentGateway: 'razorpay',
            approvalRemarks: 'Verified automatically via Razorpay server-side signature',
            approvedAt: nowIso,
            approvedBy: 'Razorpay System',
            isVerified: true,
            status: 'Approved',
            donatedAt: nowIso,
          };

          const fullDonationRecord: Record<string, any> = {
            id: `don-${cleanPaymentId}`,
            receipt_number: generatedReceiptNumber,
            donor_name: cleanDonorName,
            mobile: cleanMobile,
            email: cleanEmail || null,
            address: cleanAddress || null,
            amount: cleanAmount,
            payment_mode: paymentMethodLabel,
            transaction_id: cleanPaymentId,
            purpose: causeOrService || 'Charitable Donation for Humanity & Welfare',
            is_verified: true,
            status: 'Approved',
            approval_remarks: 'Verified automatically via Razorpay server-side signature',
            approved_at: nowIso,
            approved_by: 'Razorpay System',
            donated_at: nowIso,
            razorpay_order_id: cleanOrderId,
            razorpay_payment_id: cleanPaymentId,
            payment_gateway: 'razorpay',
            raw_data: rawDataPayload,
          };

          let { data: insertedDonation, error: donErr } = await supabase
            .from('donations')
            .insert(fullDonationRecord)
            .select('receipt_number')
            .single();

          // Compatibility fallback if pre-migration columns are not yet applied in Postgres
          if (donErr && (donErr.code === 'PGRST204' || String(donErr.message || '').includes('column'))) {
            const {
              address: _a,
              approval_remarks: _r,
              approved_at: _at,
              approved_by: _by,
              ...compatRecord
            } = fullDonationRecord;
            const retry = await supabase
              .from('donations')
              .insert(compatRecord)
              .select('receipt_number')
              .single();
            insertedDonation = retry.data;
            donErr = retry.error;
          }

          if (!donErr) {
            if (insertedDonation?.receipt_number) {
              generatedReceiptNumber = insertedDonation.receipt_number;
            }
            persisted = true;
            break;
          }

          // Handle Postgres 23505 (concurrent browser verify vs webhook OR receipt_number collision)
          if (donErr.code === '23505') {
            const concurrentWinner = await findExistingDonation(supabase, cleanPaymentId, cleanOrderId);
            if (concurrentWinner?.receipt_number) {
              generatedReceiptNumber = concurrentWinner.receipt_number;
              persisted = true;
              break;
            }
            // Otherwise collision was on receipt_number; loop retries with new suffix
            continue;
          }

          console.error('Error inserting verified donation:', donErr.code, donErr.message);
          return jsonResponse(
            {
              success: false,
              error: 'Failed to save verified donation record.',
              code: 'DATABASE_ERROR',
            },
            500
          );
        }

        if (!persisted) {
          return jsonResponse(
            {
              success: false,
              error: 'Unable to allocate unique receipt number.',
              code: 'RECEIPT_ALLOCATION_FAILED',
            },
            500
          );
        }
      }
    } else if (isSmartId) {
      generatedReceiptNumber = `LKST-ID-${getCurrentYearIST()}-${cleanOrderId.replace(/^order_/, '').slice(-6).toUpperCase()}`;

      const { data: existingIdOrder, error: idLookupErr } = await supabase
        .from('id_card_orders')
        .select('id')
        .or(`payment_id.eq.${cleanPaymentId},order_id.eq.${cleanOrderId}`)
        .limit(1)
        .maybeSingle();

      if (idLookupErr) {
        console.error('Error checking id_card_orders:', idLookupErr.code, idLookupErr.message);
        return jsonResponse(
          {
            success: false,
            error: 'Failed to check Smart ID order state.',
            code: 'DATABASE_ERROR',
          },
          500
        );
      }

      if (!existingIdOrder) {
        // Validate optional applicant_id before attaching to avoid FK violations
        let verifiedApplicantId: string | null = null;
        if (referenceId && typeof referenceId === 'string') {
          const { data: appRow } = await supabase
            .from('applications')
            .select('id')
            .eq('id', referenceId.trim())
            .maybeSingle();
          if (appRow?.id) verifiedApplicantId = appRow.id;
        }

        const { error: idCardErr } = await supabase.from('id_card_orders').insert({
          order_id: cleanOrderId,
          payment_id: cleanPaymentId,
          tier: 'special_service_200',
          applicant_id: verifiedApplicantId,
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

        if (idCardErr && idCardErr.code !== '23505') {
          console.error('Error recording id_card_orders:', idCardErr.code, idCardErr.message);
          return jsonResponse(
            {
              success: false,
              error: 'Failed to record Smart ID service order.',
              code: 'DATABASE_ERROR',
            },
            500
          );
        }
      }
    }

    return jsonResponse(
      {
        success: true,
        verified: true,
        orderId: cleanOrderId,
        paymentId: cleanPaymentId,
        purpose: cleanPurpose,
        receiptNumber: generatedReceiptNumber,
        donorName: cleanDonorName,
        amount: cleanAmount,
        status: 'Approved',
        verifiedAt: nowIso,
      },
      200
    );
  } catch (error) {
    console.error('Unhandled error in verify-razorpay-payment:', error);
    return jsonResponse(
      {
        success: false,
        error: 'Internal server error verifying payment.',
        code: 'INTERNAL_ERROR',
      },
      500
    );
  }
});
