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

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

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

/**
 * In-function request authentication when gateway `verify_jwt = false`.
 * Requires a valid project `apikey` (including `sb_publishable_...` or anon key)
 * or authenticated user Bearer JWT, while rejecting secret keys.
 */
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

  // Verify presented publishable key / JWT directly against Supabase Auth settings
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
    const rawKeyId = (Deno.env.get('RAZORPAY_KEY_ID') || '').trim();
    const rawKeySecret = (Deno.env.get('RAZORPAY_KEY_SECRET') || '').trim();
    const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').trim();
    const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

    if (!isValidRazorpayKeyId(rawKeyId) || !isValidRazorpaySecret(rawKeySecret)) {
      console.error('Razorpay API credentials missing or invalid in Edge Function environment.');
      return jsonResponse(
        {
          success: false,
          error: 'Payment gateway configuration error.',
          code: 'RAZORPAY_CONFIG_ERROR',
        },
        500
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in Edge Function environment.');
      return jsonResponse(
        {
          success: false,
          error: 'Server configuration error.',
          code: 'SUPABASE_CONFIG_ERROR',
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

    const { amount, purpose, donorName, mobile, email, address, notes, referenceId } = body;

    const rawAmount = Number(amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return jsonResponse(
        {
          success: false,
          error: 'Valid donation amount is required (minimum ₹1.00).',
          code: 'INVALID_AMOUNT',
        },
        400
      );
    }

    // Normalize to exactly two decimal places before converting to paise
    const normalizedAmount = Math.round(rawAmount * 100) / 100;
    const amountPaise = Math.round(normalizedAmount * 100);

    if (amountPaise < 100) {
      return jsonResponse(
        {
          success: false,
          error: 'Valid donation amount is required (minimum ₹1.00).',
          code: 'INVALID_AMOUNT',
        },
        400
      );
    }

    if (normalizedAmount > 5000000) {
      return jsonResponse(
        {
          success: false,
          error: 'Amount exceeds maximum allowed transaction limit of ₹50,00,000.',
          code: 'AMOUNT_EXCEEDS_LIMIT',
        },
        400
      );
    }

    const isSmartId = purpose === 'smart_id_card' || purpose === 'smart_id_card_fee';
    if (isSmartId && amountPaise !== 20000) {
      return jsonResponse(
        {
          success: false,
          error: 'Special Service Smart ID card fee must be exactly ₹200.00.',
          code: 'INVALID_FEE_AMOUNT',
        },
        400
      );
    }

    const cleanPurpose = isSmartId ? 'smart_id_card' : 'donation';
    const cleanDonorName = String(donorName || 'Supporter').trim().slice(0, 100) || 'Supporter';
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(0, 15) || '0000000000';
    const cleanEmail = String(email || '').trim().slice(0, 100);
    const cleanAddress = String(address || '').trim().slice(0, 250);
    const receiptCode = `LKST_${isSmartId ? 'ID' : 'DON'}_${Date.now()}`;

    const sanitizedNotes: Record<string, string> = {};
    if (notes && typeof notes === 'object' && !Array.isArray(notes)) {
      for (const [k, v] of Object.entries(notes)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          sanitizedNotes[String(k).slice(0, 40)] = String(v).slice(0, 200);
        }
      }
    }

    const basicAuth = btoa(`${rawKeyId}:${rawKeySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: receiptCode.slice(0, 40),
        payment_capture: 1,
        notes: {
          ...sanitizedNotes,
          organization: 'Luv Kush Seva Trust',
          purpose: cleanPurpose,
          donorName: cleanDonorName,
          mobile: cleanMobile,
          email: cleanEmail,
          address: cleanAddress,
          referenceId: referenceId ? String(referenceId).slice(0, 80) : '',
        },
      }),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error('Razorpay Orders API error:', rzpRes.status, errText);
      let safeGatewayCode = 'RAZORPAY_API_ERROR';
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr?.error?.code) {
          safeGatewayCode = String(parsedErr.error.code);
        }
      } catch {
        // ignore parse error
      }

      return jsonResponse(
        {
          success: false,
          error: 'Failed to create payment order with gateway.',
          code: safeGatewayCode,
        },
        502
      );
    }

    const rzpData = await rzpRes.json();
    const razorpayOrderId = rzpData?.id;

    if (
      !razorpayOrderId ||
      typeof razorpayOrderId !== 'string' ||
      !/^order_[a-zA-Z0-9]{10,}$/.test(razorpayOrderId)
    ) {
      console.error('Invalid order response structure from Razorpay API:', rzpData);
      return jsonResponse(
        {
          success: false,
          error: 'Payment gateway returned an invalid order identifier.',
          code: 'MALFORMED_ORDER_RESPONSE',
        },
        502
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    // Omit `id` so PostgreSQL gen_random_uuid() generates valid UUID PK
    const { error: dbError } = await supabase.from('razorpay_orders').upsert(
      {
        order_id: razorpayOrderId,
        purpose: cleanPurpose,
        amount: normalizedAmount,
        amount_paise: amountPaise,
        currency: 'INR',
        status: 'created',
        donor_name: cleanDonorName,
        email: cleanEmail || null,
        contact: cleanMobile,
        receipt_number: receiptCode,
        notes: {
          ...sanitizedNotes,
          address: cleanAddress,
          referenceId: referenceId ? String(referenceId).slice(0, 80) : null,
          createdVia: 'supabase_edge_function',
          rzpCreatedAt: rzpData.created_at,
        },
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'order_id' }
    );

    if (dbError) {
      console.error('Database error recording razorpay_orders:', dbError.code, dbError.message);
      return jsonResponse(
        {
          success: false,
          error: 'Unable to initialize payment order record.',
          code: 'DATABASE_ERROR',
        },
        500
      );
    }

    return jsonResponse(
      {
        success: true,
        orderId: razorpayOrderId,
        amount: normalizedAmount,
        amountPaise,
        currency: 'INR',
        keyId: rawKeyId,
        purpose: cleanPurpose,
      },
      200
    );
  } catch (error) {
    console.error('Unhandled exception in create-razorpay-order:', error);
    return jsonResponse(
      {
        success: false,
        error: 'Internal server error processing payment order.',
        code: 'INTERNAL_ERROR',
      },
      500
    );
  }
});
