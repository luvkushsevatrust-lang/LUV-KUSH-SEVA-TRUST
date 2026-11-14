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

    const {
      amount,
      purpose,
      donorName,
      mobile,
      email,
      address,
      notes,
      referenceId,
      applicantDetails,
    } = body;

    const rawAmount = Number(amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return jsonResponse(
        {
          success: false,
          error: 'Valid payment amount is required (minimum ₹1.00).',
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
          error: 'Valid payment amount is required (minimum ₹1.00).',
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
    const isMembership = purpose === 'membership' || purpose === 'trust_membership';

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

    if (isMembership && amountPaise !== 500000) {
      return jsonResponse(
        {
          success: false,
          error: 'Trust membership fee must be exactly ₹5,000.00.',
          code: 'INVALID_MEMBERSHIP_FEE',
        },
        400
      );
    }

    const cleanPurpose = isSmartId
      ? 'smart_id_card'
      : isMembership
      ? 'membership'
      : 'donation';

    const cleanDonorName = String(donorName || 'Supporter').trim().slice(0, 120) || 'Supporter';
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(0, 15) || '0000000000';
    const cleanEmail = String(email || '').trim().slice(0, 120);
    const cleanAddress = String(address || '').trim().slice(0, 300);

    if (isMembership) {
      if (!cleanDonorName || cleanDonorName === 'Supporter' || cleanDonorName.length < 2) {
        return jsonResponse(
          { success: false, error: 'Applicant full name is required for membership.', code: 'INVALID_APPLICANT' },
          400
        );
      }
      if (cleanMobile.length < 10 || cleanMobile === '0000000000') {
        return jsonResponse(
          { success: false, error: 'Valid 10-digit mobile number is required for membership.', code: 'INVALID_MOBILE' },
          400
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return jsonResponse(
          { success: false, error: 'Valid email address is required for membership receipt delivery.', code: 'INVALID_EMAIL' },
          400
        );
      }
      if (!cleanAddress || cleanAddress.length < 5) {
        return jsonResponse(
          { success: false, error: 'Complete postal address is required for membership.', code: 'INVALID_ADDRESS' },
          400
        );
      }
    }

    const receiptCode = `LKST_${isSmartId ? 'ID' : isMembership ? 'MEM' : 'DON'}_${Date.now()}`;

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
      console.error('Razorpay Orders API error:', errText.length, rzpRes.status);
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

    let membershipId: string | null = null;
    if (isMembership) {
      const details = applicantDetails && typeof applicantDetails === 'object' ? applicantDetails : {};
      const safePhotoUrl =
        typeof details.photoUrl === 'string' && details.photoUrl.length <= 450000
          ? details.photoUrl
          : null;

      const { data: memRow, error: memErr } = await supabase
        .from('memberships')
        .upsert(
          {
            full_name: cleanDonorName,
            father_or_husband_name: String(details.fatherOrHusbandName || '').trim().slice(0, 120) || null,
            dob: String(details.dob || '').trim().slice(0, 20) || null,
            gender: String(details.gender || '').trim().slice(0, 20) || null,
            mobile: cleanMobile,
            email: cleanEmail,
            address: cleanAddress,
            district: String(details.district || '').trim().slice(0, 80) || null,
            state: String(details.state || 'Bihar').trim().slice(0, 80) || 'Bihar',
            pin_code: String(details.pinCode || '').replace(/\D/g, '').slice(0, 10) || null,
            aadhaar_number: String(details.aadhaarNumber || '').replace(/\D/g, '').slice(0, 12) || null,
            pan_card: String(details.panCard || '').trim().toUpperCase().slice(0, 12) || null,
            occupation: String(details.occupation || '').trim().slice(0, 120) || null,
            qualification: String(details.qualification || '').trim().slice(0, 120) || null,
            photo_url: safePhotoUrl,
            membership_type: String(details.membershipType || 'Life Member').trim().slice(0, 60) || 'Life Member',
            fee_amount: 5000.0,
            payment_status: 'Pending',
            status: 'Pending Payment',
            razorpay_order_id: razorpayOrderId,
            audit_status: 'Pending Audit',
            raw_data: {
              ...details,
              fullName: cleanDonorName,
              mobile: cleanMobile,
              email: cleanEmail,
              address: cleanAddress,
              photoUrl: safePhotoUrl || undefined,
            },
            created_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: 'razorpay_order_id' }
        )
        .select('id')
        .single();

      if (memErr) {
        console.error('Database error recording pending membership:', memErr.code, memErr.message);
        return jsonResponse(
          {
            success: false,
            error: 'Unable to save membership application record.',
            code: 'MEMBERSHIP_INIT_ERROR',
          },
          500
        );
      }
      membershipId = memRow?.id || null;
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
        membershipId,
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
