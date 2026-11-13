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

      // 2c. Persist Donation OR Smart ID Card Order
      if (!isSmartId) {
        const existingDon = await findExistingDonation(supabase, paymentId, orderId);

        if (!existingDon) {
          let persisted = false;
          const donorName = String(
            notes.donorName || orderRow.donor_name || paymentEntity.email || 'Supporter'
          ).trim().slice(0, 100);
          const mobile = String(
            notes.mobile || notes.contact || orderRow.contact || paymentEntity.contact || ''
          ).replace(/\D/g, '').slice(0, 15);
          const email = String(paymentEntity.email || orderRow.email || '').trim().slice(0, 100);
          const address = String(notes.address || orderRow?.notes?.address || '').trim().slice(0, 250);
          const paymentMethodLabel = paymentEntity.method
            ? `Online (Razorpay - ${String(paymentEntity.method).toUpperCase()})`
            : 'Online (Razorpay)';

          for (let attempt = 0; attempt < 3 && !persisted; attempt++) {
            const receiptNumber = await generateReceiptNumber(supabase, orderId, attempt);

            const donationRow: Record<string, any> = {
              id: `don-${paymentId}`,
              receipt_number: receiptNumber,
              donor_name: donorName,
              mobile,
              email: email || null,
              address: address || null,
              amount: amountRs,
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
                email,
                address,
                amount: amountRs,
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
              persisted = true;
              break;
            }

            if (donErr.code === '23505') {
              const winner = await findExistingDonation(supabase, paymentId, orderId);
              if (winner?.id) {
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
            full_name: String(notes.donorName || orderRow.donor_name || 'Applicant').trim().slice(0, 100),
            mobile:
              String(notes.mobile || notes.contact || orderRow.contact || paymentEntity.contact || '0000000000')
                .replace(/\D/g, '')
                .slice(0, 15) || '0000000000',
            email: paymentEntity.email || orderRow.email || null,
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
      }
    } else if (eventType === 'payment.failed' && paymentEntity) {
      if (orderId) {
        const { data: orderRow } = await supabase
          .from('razorpay_orders')
          .select('status')
          .eq('order_id', orderId)
          .maybeSingle();

        // Only mark failed if not already settled as paid
        if (orderRow && orderRow.status !== 'paid') {
          const { error: failUpdErr } = await supabase
            .from('razorpay_orders')
            .update({ status: 'failed', updated_at: nowIso })
            .eq('order_id', orderId);

          if (failUpdErr) {
            console.error('Webhook error marking order failed:', failUpdErr.code, failUpdErr.message);
            return await failWebhook('ORDER_FAIL_UPDATE_FAILED', 500);
          }
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
