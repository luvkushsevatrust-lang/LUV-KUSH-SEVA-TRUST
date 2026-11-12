import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to compute HMAC-SHA256 hex string using Web Crypto API
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
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://yjbowhkgwatrwmuyvkja.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET.includes('placeholder')) {
      console.error('RAZORPAY_KEY_SECRET is missing in environment vault');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment verification failed: Server secret key is not configured.',
          code: 'CONFIG_MISSING',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database service role key missing for verified record writing.',
          code: 'DATABASE_AUTH_MISSING',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
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
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: razorpayOrderId, razorpayPaymentId, or razorpaySignature.',
          code: 'MISSING_VERIFICATION_PARAMS',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cryptographic HMAC-SHA256 signature verification
    const payloadToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET.trim(), payloadToSign);

    if (expectedSignature !== razorpaySignature.trim()) {
      console.warn('HMAC-SHA256 signature mismatch for order:', razorpayOrderId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid payment signature. Payment could not be verified.',
          code: 'SIGNATURE_MISMATCH',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSmartId = purpose === 'smart_id_card' || purpose === 'smart_id_card_fee';
    const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
    const cleanDonorName = (donorName || 'Supporter').trim().slice(0, 100);
    const cleanMobile = (mobile || '').replace(/\D/g, '').slice(0, 15);
    const cleanAddress = (address || '').trim().slice(0, 250);
    const cleanAmount = Number(amount) || (isSmartId ? 200 : 100);
    const nowIso = new Date().toISOString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let generatedReceiptNumber = `LKST-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Update razorpay_orders status to 'paid'
    const { error: orderUpdateErr } = await supabase
      .from('razorpay_orders')
      .update({ status: 'paid', updated_at: nowIso })
      .eq('order_id', razorpayOrderId);

    if (orderUpdateErr) {
      console.warn('Error updating razorpay_orders status:', orderUpdateErr);
    }

    // 2. Insert verified payment record with onConflict: 'payment_id'
    const { error: payInsertErr } = await supabase.from('razorpay_payments').upsert(
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

    if (payInsertErr) {
      console.error('Error inserting razorpay_payments record:', payInsertErr);
    }

    // 3. Strict Ledger Separation + Duplicate Prevention
    if (cleanPurpose === 'donation') {
      const { data: existingDonation } = await supabase
        .from('donations')
        .select('id, receipt_number')
        .or(`razorpay_payment_id.eq.${razorpayPaymentId},transaction_id.eq.${razorpayPaymentId}`)
        .maybeSingle();

      if (existingDonation?.receipt_number) {
        generatedReceiptNumber = existingDonation.receipt_number;
      } else {
        // Record in public.donations with status 'Approved'
        const donationRecord = {
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
            razorpayOrderId,
            isVerified: true,
            status: 'Approved',
            donatedAt: nowIso,
          },
        };

        const { data: insertedDonation, error: donErr } = await supabase
          .from('donations')
          .insert(donationRecord)
          .select('receipt_number')
          .single();

        if (donErr) {
          console.error('Error inserting verified donation in Supabase:', donErr);
        } else if (insertedDonation?.receipt_number) {
          generatedReceiptNumber = insertedDonation.receipt_number;
        }
      }
    } else if (isSmartId) {
      const { data: existingIdOrder } = await supabase
        .from('id_card_orders')
        .select('id')
        .or(`razorpay_payment_id.eq.${razorpayPaymentId},razorpay_order_id.eq.${razorpayOrderId}`)
        .maybeSingle();

      if (!existingIdOrder) {
        const { error: idCardErr } = await supabase.from('id_card_orders').insert({
          id: `LKST-IDORD-${Date.now()}`,
          registration_id: referenceId || `APP-${Date.now()}`,
          registration_type: 'service_application',
          tier: 'special_service_200',
          fee_amount: 200.0,
          payment_status: 'paid',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          admin_approval_status: 'Pending', // Hard lock: Admin must review before ID issuance
          id_card_issued: false,
          created_at: nowIso,
          updated_at: nowIso,
        });

        if (idCardErr) {
          console.error('Error recording id_card_orders:', idCardErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal payment verification error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
