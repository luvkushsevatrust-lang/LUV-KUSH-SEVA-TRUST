import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Validate Razorpay Key ID format: rzp_test_... or rzp_live_...
function isValidRazorpayKeyId(keyId: string | null | undefined): boolean {
  if (!keyId) return false;
  const trimmed = keyId.trim();
  if (
    trimmed.includes('placeholder') ||
    trimmed.includes('YOUR_KEY') ||
    trimmed.includes('xxxx') ||
    trimmed.includes('MY_KEY')
  ) {
    return false;
  }
  return /^rzp_(test|live)_[a-zA-Z0-9]{10,}$/.test(trimmed);
}

// Validate Razorpay Key Secret format (at least 16 alphanumeric characters, non-placeholder)
function isValidRazorpaySecret(secret: string | null | undefined): boolean {
  if (!secret) return false;
  const trimmed = secret.trim();
  if (
    trimmed.includes('placeholder') ||
    trimmed.includes('YOUR_KEY') ||
    trimmed.includes('xxxx') ||
    trimmed.length < 16
  ) {
    return false;
  }
  return /^[a-zA-Z0-9_-]{16,}$/.test(trimmed);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawKeyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const rawKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://yjbowhkgwatrwmuyvkja.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // 1 & 2 & 3: Validate credentials. NEVER accept placeholders. NEVER generate mock IDs.
    if (!isValidRazorpayKeyId(rawKeyId) || !isValidRazorpaySecret(rawKeySecret)) {
      console.error('Razorpay API configuration missing or invalid in Supabase Edge Function environment');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Razorpay payment gateway credentials not configured or invalid.',
          code: 'RAZORPAY_CONFIG_ERROR',
          message:
            'A valid RAZORPAY_KEY_ID (rzp_test_... or rzp_live_...) and RAZORPAY_KEY_SECRET must be configured in Supabase Edge Function secrets.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 7: Do not use SUPABASE_ANON_KEY as substitute for SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is required for privileged order record insertion');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.',
          code: 'SUPABASE_CONFIG_ERROR',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { amount, purpose, donorName, mobile, email, notes, referenceId } = body;

    // 9: Validate amount and paise calculations
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount < 1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Valid donation amount is required (minimum ₹1.00).',
          code: 'INVALID_AMOUNT',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (parsedAmount > 5000000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Amount exceeds maximum allowed transaction limit of ₹50,00,000.',
          code: 'AMOUNT_EXCEEDS_LIMIT',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strict validation for purpose
    const isSmartId = purpose === 'smart_id_card' || purpose === 'smart_id_card_fee';
    if (isSmartId) {
      if (parsedAmount !== 200) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Special Service Smart ID card fee must be exactly ₹200.00.',
            code: 'INVALID_FEE_AMOUNT',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
    const amountPaise = Math.round(parsedAmount * 100);
    const cleanDonorName = (donorName || 'Supporter').trim().slice(0, 100);
    const cleanMobile = (mobile || '').replace(/\D/g, '').slice(0, 15);
    const cleanEmail = (email || '').trim().slice(0, 100);
    const receiptCode = `LKST_${isSmartId ? 'ID' : 'DON'}_${Date.now()}`;

    // 4: Call official Razorpay Orders API
    const basicAuth = btoa(`${rawKeyId.trim()}:${rawKeySecret.trim()}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
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
          referenceId: referenceId || '',
          ...(notes || {}),
        },
      }),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error('Razorpay Orders API error response:', errText);
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch (_) {
        parsedErr = { error: { description: errText } };
      }

      // 10: Never expose private credentials, sanitize error
      return new Response(
        JSON.stringify({
          success: false,
          error: parsedErr?.error?.description || 'Failed to create Razorpay order.',
          code: parsedErr?.error?.code || 'RAZORPAY_API_ERROR',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rzpData = await rzpRes.json();
    const razorpayOrderId = rzpData?.id;

    if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || !razorpayOrderId.startsWith('order_')) {
      console.error('Invalid order response structure from Razorpay API:', rzpData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Razorpay returned an invalid order identifier.',
          code: 'MALFORMED_ORDER_RESPONSE',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5 & 6 & 8: Check Supabase database insertion errors; do not ignore them; ensure unique order record
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: dbError } = await supabase.from('razorpay_orders').upsert(
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
          createdVia: 'supabase_edge_function',
          rzpCreatedAt: rzpData.created_at,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'order_id' }
    );

    if (dbError) {
      console.error('Supabase database error in razorpay_orders insertion:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database ledger error while recording order.',
          code: 'DATABASE_INSERTION_ERROR',
          details: dbError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return real order details for client checkout
    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrderId,
        amount: parsedAmount,
        amountPaise,
        currency: 'INR',
        keyId: rawKeyId.trim(),
        purpose: cleanPurpose,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unhandled exception in create-razorpay-order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error processing payment order.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
