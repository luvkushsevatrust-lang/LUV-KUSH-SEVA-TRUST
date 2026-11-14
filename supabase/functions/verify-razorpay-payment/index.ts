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

async function generateMembershipNumber(supabase: any, orderId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_unique_membership_number');
    if (!error && typeof data === 'string' && data.startsWith('LKST-MEM-')) {
      return data;
    }
  } catch {
    // Fallback if sequence RPC not yet deployed
  }
  const yr = getCurrentYearIST();
  const suffix = orderId.replace(/^order_/, '').slice(-8).toUpperCase();
  return `LKST-MEM-${yr}-${suffix}`;
}

async function generateMembershipReceiptNumber(supabase: any, orderId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_unique_membership_receipt_number');
    if (!error && typeof data === 'string' && data.startsWith('LKST-MEM-REC-')) {
      return data;
    }
  } catch {
    // Fallback if sequence RPC not yet deployed
  }
  const yr = getCurrentYearIST();
  const suffix = orderId.replace(/^order_/, '').slice(-8).toUpperCase();
  return `LKST-MEM-REC-${yr}-${suffix}`;
}

async function findExistingMembership(
  supabase: any,
  razorpayPaymentId: string,
  razorpayOrderId: string
): Promise<{
  id: string;
  membership_number: string | null;
  receipt_number: string | null;
  payment_status: string | null;
  membership_type: string | null;
} | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('id, membership_number, receipt_number, payment_status, membership_type')
    .or(`razorpay_payment_id.eq.${razorpayPaymentId},razorpay_order_id.eq.${razorpayOrderId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error querying existing membership:', error.code, error.message);
    return null;
  }
  return data;
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateIST(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

async function sendReceiptEmailOnce(
  supabase: any,
  params: {
    isSmartId: boolean;
    isMembership?: boolean;
    membershipNumber?: string;
    membershipType?: string;
    paymentId: string;
    orderId: string;
    receiptNumber: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    paymentMethodLabel: string;
    purposeText: string;
    paidAtIso: string;
  }
): Promise<boolean> {
  try {
    const resendKey = (Deno.env.get('RESEND_API_KEY') || '').trim();
    const cleanEmail = String(params.donorEmail || '').trim();
    if (!resendKey || resendKey.includes('placeholder') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return false;
    }

    const table = params.isMembership
      ? 'memberships'
      : params.isSmartId
      ? 'id_card_orders'
      : 'donations';
    const matchCol = params.isSmartId ? 'payment_id' : 'razorpay_payment_id';

    // Atomically claim email delivery slot so concurrent verify + webhook never double-email
    const { data: claimedRows, error: claimErr } = await supabase
      .from(table)
      .update({
        receipt_email_sent: true,
        receipt_email_sent_at: new Date().toISOString(),
      })
      .eq(matchCol, params.paymentId)
      .eq('receipt_email_sent', false)
      .select('id');

    if (claimErr) {
      console.warn('Receipt email claim skipped:', claimErr.code, claimErr.message);
      return false;
    }

    if (!claimedRows || claimedRows.length === 0) {
      return false;
    }

    const fromAddress =
      (Deno.env.get('RECEIPT_FROM_EMAIL') || '').trim() ||
      'Luv Kush Seva Trust <onboarding@resend.dev>';

    const title = params.isMembership
      ? 'Membership Confirmation & Receipt'
      : params.isSmartId
      ? 'Smart ID Card Payment Receipt'
      : 'Official Donation Receipt';
    const subject = params.isMembership
      ? `Membership Confirmed (${params.membershipNumber || params.receiptNumber}) – Luv Kush Seva Trust`
      : params.isSmartId
      ? `Smart ID Card Payment Receipt (${params.receiptNumber}) – Luv Kush Seva Trust`
      : `Official Donation Receipt (${params.receiptNumber}) – Luv Kush Seva Trust`;

    const formattedAmount = `₹${Number(params.amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const formattedDate = `${formatDateIST(params.paidAtIso)} IST`;

    const introParagraph = params.isMembership
      ? `Heartiest congratulations and welcome to <strong>Luv Kush Seva Trust</strong>! Your application for <strong>${escapeHtml(
          params.membershipType || 'Life Member'
        )}</strong> membership and fee payment of <strong>${escapeHtml(
          formattedAmount
        )}</strong> have been verified and confirmed.`
      : `Thank you for your generous support to <strong>Luv Kush Seva Trust</strong>. Your online payment has been verified and recorded successfully.`;

    const membershipRowsHtml = params.isMembership
      ? `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Membership Number</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#1e3a8a;text-align:right;">${escapeHtml(
            params.membershipNumber || 'Confirmed'
          )}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Membership Category</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:bold;text-align:right;">${escapeHtml(
            params.membershipType || 'Life Member'
          )}</td>
        </tr>`
      : '';

    const verifyNoteHtml = params.isMembership
      ? `You can verify your Membership &amp; Payment Receipt anytime on <a href="https://www.luvkushsevatrust.in" style="color:#1d4ed8;">https://www.luvkushsevatrust.in</a> using Membership No. <strong>${escapeHtml(
          params.membershipNumber || params.receiptNumber
        )}</strong> or Receipt No. <strong>${escapeHtml(params.receiptNumber)}</strong>.`
      : `You can verify this receipt anytime on <a href="https://www.luvkushsevatrust.in" style="color:#1d4ed8;">https://www.luvkushsevatrust.in</a> using your Receipt Number <strong>${escapeHtml(
          params.receiptNumber
        )}</strong>.`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:24px;text-align:center;">
      <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#fbbf24;font-weight:bold;">
        Luv Kush Seva Trust, Rajgir
      </div>
      <h1 style="margin:8px 0 4px;font-size:22px;">${escapeHtml(title)}</h1>
      <p style="margin:0;font-size:13px;color:#cbd5e1;">लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार)</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${escapeHtml(params.donorName)}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        ${introParagraph}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
        ${membershipRowsHtml}
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Receipt Number</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:bold;text-align:right;">${escapeHtml(params.receiptNumber)}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Amount Paid</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#15803d;text-align:right;">${escapeHtml(formattedAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Purpose</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(params.purposeText)}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Payment Mode</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(params.paymentMethodLabel)}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Payment ID</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-family:monospace;text-align:right;">${escapeHtml(params.paymentId)}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;">Order ID</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-family:monospace;text-align:right;">${escapeHtml(params.orderId)}</td>
        </tr>
        <tr>
          <td style="padding:10px;color:#64748b;">Date &amp; Time</td>
          <td style="padding:10px;text-align:right;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>
      <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;font-size:12px;color:#475569;line-height:1.5;">
        ${verifyNoteHtml}
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;font-size:12px;color:#64748b;text-align:center;">
      Luv Kush Seva Trust • Raispar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar<br />
      Email: luvkushsevatrust@gmail.com | Web: https://www.luvkushsevatrust.in
    </div>
  </div>
</body>
</html>`.trim();

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [cleanEmail],
        reply_to: 'luvkushsevatrust@gmail.com',
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend email API failed:', resendRes.status, errBody);
      await supabase
        .from(table)
        .update({ receipt_email_sent: false, receipt_email_sent_at: null })
        .eq(matchCol, params.paymentId);
      return false;
    }

    const resJson = await resendRes.json().catch(() => null);
    if (resJson?.id) {
      await supabase
        .from(table)
        .update({ receipt_email_id: String(resJson.id) })
        .eq(matchCol, params.paymentId);
    }
    return true;
  } catch (err) {
    console.error('Unhandled error sending receipt email:', err);
    return false;
  }
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
    const isMembership = effectivePurpose === 'membership' || effectivePurpose === 'trust_membership';
    const cleanPurpose = isSmartId
      ? 'smart_id_card'
      : isMembership
      ? 'membership'
      : 'donation';

    if (isMembership && Number(payEntity.amount) !== 500000) {
      return jsonResponse(
        {
          success: false,
          error: 'Membership fee verification mismatch (expected ₹5,000.00).',
          code: 'AMOUNT_MISMATCH',
        },
        400
      );
    }

    const cleanDonorName = String(donorName || orderRow.donor_name || 'Supporter').trim().slice(0, 120);
    const cleanAddress = String(address || orderRow?.notes?.address || '').trim().slice(0, 300);
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
    let generatedMembershipNumber = '';
    let resolvedMembershipType = String(orderRow?.notes?.membershipType || 'Life Member');

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
    } else if (isMembership) {
      const existingMem = await findExistingMembership(supabase, cleanPaymentId, cleanOrderId);

      if (existingMem && existingMem.payment_status === 'Paid' && existingMem.membership_number && existingMem.receipt_number) {
        generatedMembershipNumber = existingMem.membership_number;
        generatedReceiptNumber = existingMem.receipt_number;
        if (existingMem.membership_type) {
          resolvedMembershipType = existingMem.membership_type;
        }
      } else {
        generatedMembershipNumber =
          existingMem?.membership_number || (await generateMembershipNumber(supabase, cleanOrderId));
        generatedReceiptNumber =
          existingMem?.receipt_number || (await generateMembershipReceiptNumber(supabase, cleanOrderId));

        if (existingMem?.membership_type) {
          resolvedMembershipType = existingMem.membership_type;
        }

        let confirmedMemId = existingMem?.id || null;

        if (existingMem?.id) {
          const { error: memUpdErr } = await supabase
            .from('memberships')
            .update({
              membership_number: generatedMembershipNumber,
              receipt_number: generatedReceiptNumber,
              razorpay_payment_id: cleanPaymentId,
              payment_status: 'Paid',
              status: 'Confirmed',
              payment_mode: paymentMethodLabel,
              paid_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', existingMem.id);

          if (memUpdErr) {
            console.error('Error confirming membership row:', memUpdErr.code, memUpdErr.message);
            return jsonResponse(
              {
                success: false,
                error: 'Failed to confirm membership payment status.',
                code: 'MEMBERSHIP_CONFIRM_ERROR',
              },
              500
            );
          }
        } else {
          const { data: insertedMem, error: memInsErr } = await supabase
            .from('memberships')
            .insert({
              membership_number: generatedMembershipNumber,
              receipt_number: generatedReceiptNumber,
              full_name: cleanDonorName,
              mobile: cleanMobile || '0000000000',
              email: cleanEmail || 'luvkushsevatrust@gmail.com',
              address: cleanAddress || 'Rajgir, Nalanda, Bihar',
              membership_type: resolvedMembershipType,
              fee_amount: 5000.0,
              payment_status: 'Paid',
              status: 'Confirmed',
              razorpay_order_id: cleanOrderId,
              razorpay_payment_id: cleanPaymentId,
              payment_mode: paymentMethodLabel,
              paid_at: nowIso,
              audit_status: 'Pending Audit',
              created_at: nowIso,
              updated_at: nowIso,
            })
            .select('id')
            .single();

          if (memInsErr) {
            console.error('Error inserting confirmed membership row:', memInsErr.code, memInsErr.message);
            return jsonResponse(
              {
                success: false,
                error: 'Failed to record confirmed membership.',
                code: 'MEMBERSHIP_CONFIRM_ERROR',
              },
              500
            );
          }
          confirmedMemId = insertedMem?.id || null;
        }

        if (confirmedMemId) {
          const { error: logErr } = await supabase.from('membership_audit_logs').insert({
            membership_id: confirmedMemId,
            membership_number: generatedMembershipNumber,
            action: 'PAYMENT_CONFIRMED',
            previous_audit_status: null,
            new_audit_status: 'Pending Audit',
            audit_notes: `Membership confirmed via Razorpay (${cleanPaymentId}). Receipt ${generatedReceiptNumber} issued.`,
            audited_by: 'Razorpay System',
            created_at: nowIso,
          });
          if (logErr) {
            console.warn('Audit log insert skipped:', logErr.code, logErr.message);
          }
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

    const resolvedPurposeText = isMembership
      ? `Trust Membership Fee (${resolvedMembershipType})`
      : isSmartId
      ? 'Special Service Smart ID Card Fee'
      : String(causeOrService || 'Charitable Donation for Humanity & Welfare').trim();

    const emailSent = await sendReceiptEmailOnce(supabase, {
      isSmartId,
      isMembership,
      membershipNumber: generatedMembershipNumber,
      membershipType: resolvedMembershipType,
      paymentId: cleanPaymentId,
      orderId: cleanOrderId,
      receiptNumber: generatedReceiptNumber,
      donorName: cleanDonorName,
      donorEmail: cleanEmail,
      amount: cleanAmount,
      paymentMethodLabel,
      purposeText: resolvedPurposeText,
      paidAtIso: nowIso,
    });

    return jsonResponse(
      {
        success: true,
        verified: true,
        orderId: cleanOrderId,
        paymentId: cleanPaymentId,
        purpose: cleanPurpose,
        receiptNumber: generatedReceiptNumber,
        membershipNumber: generatedMembershipNumber || null,
        donorName: cleanDonorName,
        amount: cleanAmount,
        status: isMembership ? 'Confirmed' : 'Approved',
        verifiedAt: nowIso,
        emailSent,
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
