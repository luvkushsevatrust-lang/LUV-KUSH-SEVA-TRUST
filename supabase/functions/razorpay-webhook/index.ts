import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-event-id',
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

async function generateReceiptNumber(
  supabase: any,
  refId: string,
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
  const suffix = refId.replace(/^(order_|pay_)/, '').slice(-8).toUpperCase();
  return attempt === 0
    ? `LKST-REC-${yr}-${suffix}`
    : `LKST-REC-${yr}-${suffix}-${attempt}`;
}

async function findExistingDonation(
  supabase: any,
  paymentId: string,
  orderId: string
): Promise<{ id: string; receipt_number: string } | null> {
  const { data, error } = await supabase
    .from('donations')
    .select('id, receipt_number')
    .or(
      `razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId},transaction_id.eq.${paymentId}`
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing donation in webhook:', error.code, error.message);
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
    // Fallback
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
    // Fallback
  }
  const yr = getCurrentYearIST();
  const suffix = orderId.replace(/^order_/, '').slice(-8).toUpperCase();
  return `LKST-MEM-REC-${yr}-${suffix}`;
}

async function findExistingMembership(
  supabase: any,
  paymentId: string,
  orderId: string
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
    .or(`razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing membership in webhook:', error.code, error.message);
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
      console.warn('Webhook receipt email claim skipped:', claimErr.code, claimErr.message);
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
      console.error('Webhook Resend API failed:', resendRes.status, errBody);
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
    console.error('Unhandled webhook email error:', err);
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
    const RAZORPAY_WEBHOOK_SECRET = (Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '').trim();
    const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').trim();
    const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

    if (!RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET.includes('placeholder')) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return jsonResponse({ error: 'Webhook configuration error.', code: 'CONFIG_ERROR' }, 500);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      console.error('Database service role credentials missing.');
      return jsonResponse({ error: 'Server configuration error.', code: 'CONFIG_ERROR' }, 500);
    }

    const signatureHeader = (req.headers.get('x-razorpay-signature') || '').trim().toLowerCase();
    if (!signatureHeader) {
      return jsonResponse(
        { error: 'Missing Razorpay webhook signature.', code: 'MISSING_SIGNATURE' },
        401
      );
    }

    // Read exact raw request body BEFORE JSON parsing to preserve exact signature bytes
    const rawBody = await req.text();
    const expectedSignature = await hmacSha256(RAZORPAY_WEBHOOK_SECRET, rawBody);

    if (!timingSafeEqualString(expectedSignature, signatureHeader)) {
      console.warn('Webhook HMAC signature mismatch.');
      return jsonResponse(
        { error: 'Invalid webhook signature.', code: 'INVALID_SIGNATURE' },
        400
      );
    }

    let event: Record<string, any>;
    try {
      const parsed = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return jsonResponse({ error: 'Invalid JSON payload.', code: 'INVALID_JSON' }, 400);
      }
      event = parsed;
    } catch {
      return jsonResponse({ error: 'Malformed JSON payload.', code: 'INVALID_JSON' }, 400);
    }

    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const orderId = String(paymentEntity?.order_id || orderEntity?.id || '').trim();
    const paymentId = String(paymentEntity?.id || '').trim();
    const eventType = String(event?.event || 'unknown').trim();
    const entityId = paymentId || orderId || eventType;

    // Prefer Razorpay's canonical `x-razorpay-event-id` header for strict delivery idempotency
    const headerEventId = (req.headers.get('x-razorpay-event-id') || '').trim();
    const bodyEventId =
      (typeof event?.event_id === 'string' && event.event_id.trim()) ||
      (typeof event?.id === 'string' && event.id.trim()) ||
      '';
    const eventId = headerEventId || bodyEventId || `evt_${eventType}_${entityId}`;
    const nowIso = new Date().toISOString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Idempotency check BEFORE claiming the event (never assume `processed: true` prematurely)
    const { data: existingEvent, error: lookupEventErr } = await supabase
      .from('razorpay_webhooks')
      .select('id, processed')
      .eq('event_id', eventId)
      .maybeSingle();

    if (lookupEventErr) {
      console.error('Error checking razorpay_webhooks idempotency:', lookupEventErr.code, lookupEventErr.message);
      return jsonResponse({ error: 'Webhook state check failed.', code: 'DATABASE_ERROR' }, 500);
    }

    if (existingEvent?.processed === true) {
      return jsonResponse({ status: 'already_processed', eventId }, 200);
    }

    if (!existingEvent) {
      const { error: claimErr } = await supabase.from('razorpay_webhooks').insert({
        event_id: eventId,
        event_type: eventType,
        entity_id: entityId,
        payload: event,
        signature_verified: true,
        processed: false,
        processing_error: null,
        created_at: nowIso,
      });

      if (claimErr) {
        if (claimErr.code === '23505') {
          const { data: concurrentEvent } = await supabase
            .from('razorpay_webhooks')
            .select('processed')
            .eq('event_id', eventId)
            .maybeSingle();

          if (concurrentEvent?.processed === true) {
            return jsonResponse({ status: 'already_processed', eventId }, 200);
          }
          // Concurrent worker still processing or previously failed: ask Razorpay to retry
          return jsonResponse({ error: 'Concurrent event in progress.', code: 'RETRY_IN_PROGRESS' }, 500);
        }
        console.error('Error recording webhook claim row:', claimErr.code, claimErr.message);
        return jsonResponse({ error: 'Failed to log webhook event.', code: 'DATABASE_ERROR' }, 500);
      }
    }

    const failWebhook = async (errCode: string, statusCode: number): Promise<Response> => {
      await supabase
        .from('razorpay_webhooks')
        .update({ processed: false, processing_error: errCode })
        .eq('event_id', eventId);
      return jsonResponse({ error: 'Webhook processing failed.', code: errCode }, statusCode);
    };

    // 2. Process payment capture events ONLY when payment status is strictly `captured`
    const isCaptureEvent =
      eventType === 'payment.captured' ||
      (eventType === 'order.paid' && paymentEntity?.status === 'captured');

    if (isCaptureEvent && paymentEntity) {
      if (paymentEntity.status !== 'captured') {
        return await failWebhook('PAYMENT_NOT_CAPTURED', 400);
      }

      if (!orderId || !paymentId) {
        return await failWebhook('MISSING_ORDER_OR_PAYMENT_ID', 400);
      }

      // Require matching authoritative order record in razorpay_orders
      const { data: orderRow, error: orderFetchErr } = await supabase
        .from('razorpay_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (orderFetchErr) {
        console.error('Error loading razorpay_orders in webhook:', orderFetchErr.code, orderFetchErr.message);
        return await failWebhook('DATABASE_ERROR', 500);
      }

      if (!orderRow) {
        console.error('Webhook order_id not found in razorpay_orders:', orderId);
        return await failWebhook('ORDER_NOT_FOUND', 500);
      }

      if (paymentEntity.currency !== 'INR' || paymentEntity.currency !== orderRow.currency) {
        return await failWebhook('CURRENCY_MISMATCH', 400);
      }

      if (Number(paymentEntity.amount) !== Number(orderRow.amount_paise)) {
        return await failWebhook('AMOUNT_MISMATCH', 400);
      }

      const amountRs = Math.round(Number(paymentEntity.amount)) / 100;
      const notes = paymentEntity.notes || {};
      const effectivePurpose = orderRow.purpose || notes.purpose || 'donation';
      const isSmartId = effectivePurpose === 'smart_id_card' || effectivePurpose === 'smart_id_card_fee';
      const isMembership = effectivePurpose === 'membership' || effectivePurpose === 'trust_membership';

      // 2a. Update razorpay_orders -> paid
      const { error: orderUpdErr } = await supabase
        .from('razorpay_orders')
        .update({ status: 'paid', updated_at: nowIso })
        .eq('order_id', orderId);

      if (orderUpdErr) {
        console.error('Webhook error updating razorpay_orders:', orderUpdErr.code, orderUpdErr.message);
        return await failWebhook('ORDER_UPDATE_FAILED', 500);
      }

      // 2b. Upsert razorpay_payments -> captured
      const { error: payUpdErr } = await supabase.from('razorpay_payments').upsert(
        {
          payment_id: paymentId,
          order_id: orderId,
          amount: amountRs,
          currency: 'INR',
          status: 'captured',
          method: paymentEntity.method || 'razorpay',
          bank: paymentEntity.bank || null,
          wallet: paymentEntity.wallet || null,
          vpa: paymentEntity.vpa || null,
          email: paymentEntity.email || orderRow.email || null,
          contact: paymentEntity.contact || orderRow.contact || null,
          signature_verified: true,
          verified_at: nowIso,
          raw_response: paymentEntity,
          created_at: nowIso,
        },
        { onConflict: 'payment_id' }
      );

      if (payUpdErr) {
        console.error('Webhook error upserting razorpay_payments:', payUpdErr.code, payUpdErr.message);
        return await failWebhook('PAYMENT_UPSERT_FAILED', 500);
      }

      // 2c. Persist Donation / Membership / Smart ID Card Order & Send Receipt Email Once
      const donorNameForEmail = String(
        notes.donorName || orderRow.donor_name || paymentEntity.email || 'Supporter'
      ).trim().slice(0, 120);
      const emailForReceipt = String(orderRow.email || paymentEntity.email || '').trim().slice(0, 120);
      const paymentMethodLabelForEmail = paymentEntity.method
        ? `Online (Razorpay - ${String(paymentEntity.method).toUpperCase()})`
        : 'Online (Razorpay)';

      if (isMembership) {
        const existingMem = await findExistingMembership(supabase, paymentId, orderId);
        let finalMembershipNo = existingMem?.membership_number || '';
        let finalReceiptNo = existingMem?.receipt_number || '';
        let resolvedType = String(existingMem?.membership_type || notes.membershipType || 'Life Member');

        if (!existingMem || existingMem.payment_status !== 'Paid' || !finalMembershipNo || !finalReceiptNo) {
          finalMembershipNo = finalMembershipNo || (await generateMembershipNumber(supabase, orderId));
          finalReceiptNo = finalReceiptNo || (await generateMembershipReceiptNumber(supabase, orderId));
          let confirmedMemId = existingMem?.id || null;

          if (existingMem?.id) {
            const { error: memUpdErr } = await supabase
              .from('memberships')
              .update({
                membership_number: finalMembershipNo,
                receipt_number: finalReceiptNo,
                razorpay_payment_id: paymentId,
                payment_status: 'Paid',
                status: 'Confirmed',
                payment_mode: paymentMethodLabelForEmail,
                paid_at: nowIso,
                updated_at: nowIso,
              })
              .eq('id', existingMem.id);

            if (memUpdErr) {
              console.error('Webhook error confirming membership:', memUpdErr.code, memUpdErr.message);
              return await failWebhook('MEMBERSHIP_CONFIRM_FAILED', 500);
            }
          } else {
            const { data: insertedMem, error: memInsErr } = await supabase
              .from('memberships')
              .insert({
                membership_number: finalMembershipNo,
                receipt_number: finalReceiptNo,
                full_name: donorNameForEmail || 'Member',
                mobile:
                  String(notes.mobile || notes.contact || orderRow.contact || paymentEntity.contact || '0000000000')
                    .replace(/\D/g, '')
                    .slice(0, 15) || '0000000000',
                email: emailForReceipt || 'luvkushsevatrust@gmail.com',
                address: String(notes.address || orderRow?.notes?.address || 'Rajgir, Nalanda, Bihar').trim().slice(0, 300),
                membership_type: resolvedType,
                fee_amount: 5000.0,
                payment_status: 'Paid',
                status: 'Confirmed',
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                payment_mode: paymentMethodLabelForEmail,
                paid_at: nowIso,
                audit_status: 'Pending Audit',
                created_at: nowIso,
                updated_at: nowIso,
              })
              .select('id')
              .single();

            if (memInsErr) {
              console.error('Webhook error inserting membership:', memInsErr.code, memInsErr.message);
              return await failWebhook('MEMBERSHIP_INSERT_FAILED', 500);
            }
            confirmedMemId = insertedMem?.id || null;
          }

          if (confirmedMemId) {
            await supabase.from('membership_audit_logs').insert({
              membership_id: confirmedMemId,
              membership_number: finalMembershipNo,
              action: 'PAYMENT_CONFIRMED',
              previous_audit_status: null,
              new_audit_status: 'Pending Audit',
              audit_notes: `Membership confirmed via Razorpay Webhook (${eventType}, ${paymentId}).`,
              audited_by: 'Razorpay Webhook',
              created_at: nowIso,
            });
          }
        }

        await sendReceiptEmailOnce(supabase, {
          isSmartId: false,
          isMembership: true,
          membershipNumber: finalMembershipNo,
          membershipType: resolvedType,
          paymentId,
          orderId,
          receiptNumber: finalReceiptNo,
          donorName: donorNameForEmail,
          donorEmail: emailForReceipt,
          amount: amountRs,
          paymentMethodLabel: paymentMethodLabelForEmail,
          purposeText: `Trust Membership Fee (${resolvedType})`,
          paidAtIso: nowIso,
        });
      } else if (!isSmartId) {
        const existingDon = await findExistingDonation(supabase, paymentId, orderId);
        let finalReceiptNumber = existingDon?.receipt_number || '';
        const purposeText = String(notes.cause || 'Charitable Donation for Humanity & Welfare').trim();

        if (!existingDon) {
          let persisted = false;
          const mobile = String(
            notes.mobile || notes.contact || orderRow.contact || paymentEntity.contact || ''
          ).replace(/\D/g, '').slice(0, 15);
          const address = String(notes.address || orderRow?.notes?.address || '').trim().slice(0, 250);

          for (let attempt = 0; attempt < 3 && !persisted; attempt++) {
            const receiptNumber = await generateReceiptNumber(supabase, orderId, attempt);

            const donationRow: Record<string, any> = {
              id: `don-${paymentId}`,
              receipt_number: receiptNumber,
              donor_name: donorNameForEmail,
              mobile,
              email: emailForReceipt || null,
              address: address || null,
              amount: amountRs,
              payment_mode: paymentMethodLabelForEmail,
              transaction_id: paymentId,
              purpose: purposeText,
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
                donorName: donorNameForEmail,
                mobile,
                email: emailForReceipt,
                address,
                amount: amountRs,
                receiptNumber,
                paymentMethod: paymentMethodLabelForEmail,
                transactionId: paymentId,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                paymentGateway: 'razorpay',
                isVerified: true,
                status: 'Approved',
                donatedAt: nowIso,
              },
            };

            let { error: donErr } = await supabase.from('donations').insert(donationRow);
            if (donErr && (donErr.code === 'PGRST204' || String(donErr.message || '').includes('column'))) {
              const {
                address: _a,
                approval_remarks: _r,
                approved_at: _at,
                approved_by: _by,
                ...compatRow
              } = donationRow;
              const retry = await supabase.from('donations').insert(compatRow);
              donErr = retry.error;
            }

            if (!donErr) {
              finalReceiptNumber = receiptNumber;
              persisted = true;
              break;
            }

            if (donErr.code === '23505') {
              const winner = await findExistingDonation(supabase, paymentId, orderId);
              if (winner?.id) {
                finalReceiptNumber = winner.receipt_number || receiptNumber;
                persisted = true;
                break;
              }
              continue;
            }

            console.error('Webhook error inserting donation:', donErr.code, donErr.message);
            return await failWebhook('DONATION_INSERT_FAILED', 500);
          }

          if (!persisted) {
            return await failWebhook('RECEIPT_ALLOCATION_FAILED', 500);
          }
        }

        if (finalReceiptNumber) {
          await sendReceiptEmailOnce(supabase, {
            isSmartId: false,
            paymentId,
            orderId,
            receiptNumber: finalReceiptNumber,
            donorName: donorNameForEmail,
            donorEmail: emailForReceipt,
            amount: amountRs,
            paymentMethodLabel: paymentMethodLabelForEmail,
            purposeText,
            paidAtIso: nowIso,
          });
        }
      } else {
        const { data: existingIdOrd, error: idCheckErr } = await supabase
          .from('id_card_orders')
          .select('id')
          .or(`payment_id.eq.${paymentId},order_id.eq.${orderId}`)
          .limit(1)
          .maybeSingle();

        if (idCheckErr) {
          console.error('Webhook error checking id_card_orders:', idCheckErr.code, idCheckErr.message);
          return await failWebhook('ID_ORDER_CHECK_FAILED', 500);
        }

        if (!existingIdOrd) {
          let verifiedApplicantId: string | null = null;
          const refId = String(notes.referenceId || orderRow?.notes?.referenceId || '').trim();
          if (refId) {
            const { data: appRow } = await supabase
              .from('applications')
              .select('id')
              .eq('id', refId)
              .maybeSingle();
            if (appRow?.id) verifiedApplicantId = appRow.id;
          }

          const { error: idInsErr } = await supabase.from('id_card_orders').insert({
            order_id: orderId,
            payment_id: paymentId,
            tier: 'special_service_200',
            applicant_id: verifiedApplicantId,
            full_name: donorNameForEmail || 'Applicant',
            mobile:
              String(notes.mobile || notes.contact || orderRow.contact || paymentEntity.contact || '0000000000')
                .replace(/\D/g, '')
                .slice(0, 15) || '0000000000',
            email: emailForReceipt || null,
            service_category: notes.serviceCategory || orderRow?.notes?.serviceCategory || null,
            amount_fee: 200.0,
            is_paid: true,
            admin_approved: false,
            card_issued: false,
            created_at: nowIso,
            updated_at: nowIso,
          });

          if (idInsErr && idInsErr.code !== '23505') {
            console.error('Webhook error inserting id_card_orders:', idInsErr.code, idInsErr.message);
            return await failWebhook('ID_ORDER_INSERT_FAILED', 500);
          }
        }

        const idReceipt = `LKST-ID-${getCurrentYearIST()}-${orderId.replace(/^order_/, '').slice(-6).toUpperCase()}`;
        await sendReceiptEmailOnce(supabase, {
          isSmartId: true,
          paymentId,
          orderId,
          receiptNumber: idReceipt,
          donorName: donorNameForEmail,
          donorEmail: emailForReceipt,
          amount: amountRs,
          paymentMethodLabel: paymentMethodLabelForEmail,
          purposeText: 'Special Service Smart ID Card Fee',
          paidAtIso: nowIso,
        });
      }
    } else if (eventType === 'payment.failed' && paymentEntity) {
      if (orderId) {
        const { data: orderRow } = await supabase
          .from('razorpay_orders')
          .select('status, email, contact, amount')
          .eq('order_id', orderId)
          .maybeSingle();

        // Record failed attempt in razorpay_payments for Admin visibility
        if (paymentId) {
          const failedAmountRs = Number.isFinite(Number(paymentEntity.amount))
            ? Math.round(Number(paymentEntity.amount)) / 100
            : Number(orderRow?.amount || 0);
          await supabase.from('razorpay_payments').upsert(
            {
              payment_id: paymentId,
              order_id: orderId,
              amount: failedAmountRs,
              currency: 'INR',
              status: 'failed',
              method: paymentEntity.method || 'razorpay',
              bank: paymentEntity.bank || null,
              wallet: paymentEntity.wallet || null,
              vpa: paymentEntity.vpa || null,
              email: paymentEntity.email || orderRow?.email || null,
              contact: paymentEntity.contact || orderRow?.contact || null,
              error_code: paymentEntity.error_code ? String(paymentEntity.error_code).slice(0, 80) : null,
              error_description: paymentEntity.error_description
                ? String(paymentEntity.error_description).slice(0, 250)
                : null,
              signature_verified: true,
              raw_response: paymentEntity,
              created_at: nowIso,
            },
            { onConflict: 'payment_id' }
          );
        }

        // Only mark order failed if not already settled as paid
        if (orderRow && orderRow.status !== 'paid') {
          const { error: failUpdErr } = await supabase
            .from('razorpay_orders')
            .update({ status: 'failed', updated_at: nowIso })
            .eq('order_id', orderId);

          if (failUpdErr) {
            console.error('Webhook error marking order failed:', failUpdErr.code, failUpdErr.message);
            return await failWebhook('ORDER_FAIL_UPDATE_FAILED', 500);
          }

          await supabase
            .from('memberships')
            .update({ payment_status: 'Failed', updated_at: nowIso })
            .eq('razorpay_order_id', orderId)
            .neq('payment_status', 'Paid');
        }
      }
    }

    // 3. Mark webhook processed ONLY AFTER all required database operations succeed
    const { error: finalizeErr } = await supabase
      .from('razorpay_webhooks')
      .update({ processed: true, processing_error: null })
      .eq('event_id', eventId);

    if (finalizeErr) {
      console.error('Error finalizing webhook processed flag:', finalizeErr.code, finalizeErr.message);
      return jsonResponse({ error: 'Failed to finalize webhook status.', code: 'DATABASE_ERROR' }, 500);
    }

    return jsonResponse({ status: 'ok', eventId }, 200);
  } catch (error) {
    console.error('Unhandled webhook error:', error);
    return jsonResponse({ error: 'Internal webhook error.', code: 'INTERNAL_ERROR' }, 500);
  }
});
