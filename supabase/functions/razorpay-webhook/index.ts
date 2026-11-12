import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://yjbowhkgwatrwmuyvkja.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Critical: Read raw text body BEFORE any JSON parsing to preserve byte-level HMAC accuracy
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-razorpay-signature') || '';

    if (RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = await hmacSha256(RAZORPAY_WEBHOOK_SECRET, rawBody);
      if (expectedSignature !== signatureHeader) {
        console.warn('Webhook HMAC signature mismatch');
        return new Response('Invalid webhook signature', { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventId = event?.event_id || event?.id || `evt_${Date.now()}`;
    const eventType = event?.event || 'unknown';

    const supabase = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    if (supabase) {
      // 1. Idempotency Check: Prevent duplicate processing if event was already received
      const { data: existing } = await supabase
        .from('razorpay_webhooks')
        .select('id, processed')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existing) {
        console.log(`Webhook event ${eventId} already received. Returning 200 OK.`);
        return new Response(JSON.stringify({ status: 'already_processed', eventId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const paymentEntity = event?.payload?.payment?.entity;
      const orderEntity = event?.payload?.order?.entity;
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      // 2. Insert event record in razorpay_webhooks
      await supabase.from('razorpay_webhooks').insert({
        event_id: eventId,
        event_type: eventType,
        order_id: orderId || null,
        payment_id: paymentId || null,
        payload: event,
        signature: signatureHeader || 'verified',
        processed: true,
        processed_at: new Date().toISOString(),
      });

      // 3. Handle specific event types
      if ((eventType === 'payment.captured' || eventType === 'order.paid') && paymentEntity) {
        const amountRs = (paymentEntity.amount || 0) / 100;
        const notes = paymentEntity.notes || {};
        const purpose = notes.purpose || 'donation';

        // Update razorpay_orders
        if (orderId) {
          await supabase
            .from('razorpay_orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('order_id', orderId);
        }

        // Record payment idempotently
        if (paymentId) {
          await supabase.from('razorpay_payments').upsert(
            {
              id: `LKST-PAY-${Date.now()}`,
              payment_id: paymentId,
              order_id: orderId || `order_auto_${Date.now()}`,
              signature: signatureHeader || 'webhook_captured',
              amount: amountRs,
              currency: paymentEntity.currency || 'INR',
              status: 'captured',
              method: paymentEntity.method || 'online',
              vpa: paymentEntity.vpa || null,
              bank: paymentEntity.bank || null,
              fee: paymentEntity.fee ? paymentEntity.fee / 100 : 0,
              tax: paymentEntity.tax ? paymentEntity.tax / 100 : 0,
              verified_via: 'webhook',
              created_at: new Date().toISOString(),
            },
            { onConflict: 'payment_id' }
          );
        }

        // Ensure donation is marked Approved without duplicates
        if (paymentId && (purpose === 'donation' || purpose === 'charitable_donation')) {
          const { data: existingDon } = await supabase
            .from('donations')
            .select('id')
            .or(`razorpay_payment_id.eq.${paymentId},transaction_id.eq.${paymentId}`)
            .maybeSingle();

          if (!existingDon) {
            const receiptNumber = `LKST-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const donorName = notes.donorName || paymentEntity.email || 'Donor';
            const mobile = notes.mobile || notes.contact || paymentEntity.contact || '';
            const nowIso = new Date().toISOString();

            await supabase.from('donations').insert({
              id: `don-${Date.now()}`,
              receipt_number: receiptNumber,
              donor_name: donorName,
              mobile,
              email: paymentEntity.email || null,
              address: notes.address || null,
              amount: amountRs,
              payment_mode: 'Razorpay',
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
                amount: amountRs,
                receiptNumber,
                paymentMethod: 'Online (Razorpay)',
                transactionId: paymentId,
                isVerified: true,
                status: 'Approved',
                donatedAt: nowIso,
              },
            });
          }
        }
      } else if (eventType === 'payment.failed' && paymentEntity) {
        if (orderId) {
          await supabase
            .from('razorpay_orders')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('order_id', orderId);
        }
      }
    }

    return new Response(JSON.stringify({ status: 'ok', eventId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
