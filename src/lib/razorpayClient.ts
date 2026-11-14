import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { CreateOrderParams, VerifyPaymentParams, PaymentPurpose } from '../types/payment';
import { TRUST_EMBLEM_LOGO } from '../assets';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Validates whether an orderId is a genuine server-generated Razorpay order ID.
 * Real Razorpay Order IDs follow the pattern `order_` followed by 14 or more alphanumeric characters.
 */
export function isValidRazorpayOrderId(orderId?: string | null): boolean {
  if (!orderId || typeof orderId !== 'string') return false;
  if (orderId.includes('mock') || orderId.includes('client') || orderId.includes('fake')) {
    return false;
  }
  return /^order_[a-zA-Z0-9]{14,}$/.test(orderId.trim());
}

/**
 * Dynamically loads the official Razorpay Checkout v1 script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

let activeCheckoutLock = false;

/**
 * Normalizes a phone number into clean digits and E.164 format (+91XXXXXXXXXX for Indian numbers)
 * so Razorpay does not misdetect a country code (e.g. +45) or block UPI QR generation.
 */
export function normalizePhoneForRazorpay(raw?: string): { digits: string; e164: string } {
  const trimmed = (raw || '').trim();
  const hadPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) {
    return { digits: '', e164: '' };
  }

  // Standard 10-digit Indian mobile number
  if (digitsOnly.length === 10) {
    return { digits: digitsOnly, e164: `+91${digitsOnly}` };
  }

  // Leading zero + 10-digit Indian mobile number (e.g. 09876543210)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    const ten = digitsOnly.slice(1);
    return { digits: ten, e164: `+91${ten}` };
  }

  // Country code 91 + 10-digit Indian mobile number
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    const ten = digitsOnly.slice(2);
    return { digits: ten, e164: `+${digitsOnly}` };
  }

  if (hadPlus) {
    return { digits: digitsOnly, e164: `+${digitsOnly}` };
  }

  return { digits: digitsOnly, e164: digitsOnly.length > 10 ? `+${digitsOnly}` : `+91${digitsOnly}` };
}

function resolveCheckoutLogoUrl(): string {
  const fallbackPublicLogo = 'https://www.luvkushsevatrust.in/trust_logo_round.png';
  if (!TRUST_EMBLEM_LOGO) return fallbackPublicLogo;
  if (TRUST_EMBLEM_LOGO.startsWith('https://') || TRUST_EMBLEM_LOGO.startsWith('data:')) {
    return TRUST_EMBLEM_LOGO;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    try {
      return new URL(TRUST_EMBLEM_LOGO, window.location.origin).href;
    } catch {
      return fallbackPublicLogo;
    }
  }
  return fallbackPublicLogo;
}

/**
 * Creates a genuine Razorpay Order via server proxy or Supabase Edge Function.
 * Never generates mock or fake order IDs.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<{ orderId: string; amount: number; amountPaise: number; keyId: string }> {
  let lastErrorMsg = '';

  // 1. Primary path: Call the backend server API route (/api/create-razorpay-order)
  try {
    const localRes = await fetch('/api/create-razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (localRes.ok) {
      const data = await localRes.json();
      if (data?.success && isValidRazorpayOrderId(data.orderId)) {
        const resolvedKey = data.keyId || (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';
        if (!resolvedKey) {
          throw new Error('Razorpay public key ID is not configured.');
        }
        return {
          orderId: data.orderId,
          amount: data.amount,
          amountPaise: data.amountPaise,
          keyId: resolvedKey,
        };
      }
      if (data?.error) {
        lastErrorMsg = data.error;
      }
    } else {
      const errData = await localRes.json().catch(() => null);
      if (errData?.error) {
        lastErrorMsg = errData.error;
      }
      // Do not silently fall back on explicit client validation or Razorpay gateway errors from a live server
      if (localRes.status === 400 || (localRes.status === 502 && errData?.code)) {
        throw new Error(lastErrorMsg || 'Invalid payment order request.');
      }
    }
  } catch (localErr: any) {
    if (lastErrorMsg) {
      throw new Error(lastErrorMsg);
    }
    console.warn('Local /api/create-razorpay-order endpoint not accessible, trying Supabase Edge Function:', localErr?.message);
  }

  // 2. Secondary path: Call Supabase Edge Function with required auth headers
  try {
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-razorpay-order`;
    const edgeRes = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(params),
    });

    const edgeData = await edgeRes.json().catch(() => null);

    if (edgeRes.ok && edgeData?.success && isValidRazorpayOrderId(edgeData.orderId)) {
      const resolvedKey = edgeData.keyId || (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';
      if (!resolvedKey) {
        throw new Error('Razorpay public key ID is not configured.');
      }
      return {
        orderId: edgeData.orderId,
        amount: edgeData.amount,
        amountPaise: edgeData.amountPaise,
        keyId: resolvedKey,
      };
    }

    if (edgeData?.error) {
      lastErrorMsg = edgeData.error;
    } else if (edgeRes.status === 404) {
      lastErrorMsg =
        'Supabase Edge Function "create-razorpay-order" is not deployed yet. Please run `supabase functions deploy create-razorpay-order` or use the server proxy.';
    }
  } catch (edgeErr: any) {
    console.error('Supabase Edge Function fetch error:', edgeErr);
    if (!lastErrorMsg) {
      lastErrorMsg =
        'Payment server connection failed. Please ensure your internet is active and payment functions are deployed.';
    }
  }

  throw new Error(
    lastErrorMsg ||
      'Unable to create payment order on server. Please check your payment gateway credentials and network connection.'
  );
}

/**
 * Verifies payment server-side via local API or Supabase Edge Function
 */
export async function verifyRazorpayPayment(
  params: VerifyPaymentParams
): Promise<{
  success: boolean;
  verified: boolean;
  receiptNumber: string;
  membershipNumber?: string | null;
  emailSent?: boolean;
  paymentId: string;
  orderId: string;
}> {
  let localFailureMsg = '';

  // 1. Try local server endpoint
  try {
    const localRes = await fetch('/api/verify-razorpay-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (localRes.ok) {
      const data = await localRes.json();
      if (data?.success && data?.verified && data?.receiptNumber) {
        return {
          success: true,
          verified: true,
          receiptNumber: data.receiptNumber,
          membershipNumber: data.membershipNumber || null,
          emailSent: Boolean(data.emailSent),
          paymentId: data.paymentId || params.razorpayPaymentId,
          orderId: data.orderId || params.razorpayOrderId,
        };
      }
      if (data?.error) {
        localFailureMsg = data.error;
      }
    } else if (localRes.status !== 404 && localRes.status !== 405) {
      const errData = await localRes.json().catch(() => null);
      localFailureMsg = errData?.error || `Verification rejected with status ${localRes.status}.`;
      throw new Error(localFailureMsg);
    }
  } catch (localErr: any) {
    if (localFailureMsg) {
      throw new Error(localFailureMsg);
    }
    console.warn('Local verification endpoint skipped:', localErr);
  }

  // 2. Try Supabase Edge Function
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/verify-razorpay-payment`;
  const res = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success || !data?.verified || !data?.receiptNumber) {
    const errorMsg =
      data?.error ||
      `Server payment verification failed with status ${res.status}.`;
    console.error('Server signature verification failed:', errorMsg);
    throw new Error(errorMsg);
  }

  return {
    success: true,
    verified: true,
    receiptNumber: data.receiptNumber,
    membershipNumber: data.membershipNumber || null,
    emailSent: Boolean(data.emailSent),
    paymentId: data.paymentId || params.razorpayPaymentId,
    orderId: data.orderId || params.razorpayOrderId,
  };
}

/**
 * Launches the standard Razorpay Checkout modal with Dynamic UPI QR (desktop) and UPI Intent (mobile).
 */
export async function openRazorpayCheckout(options: {
  amount: number; // in Rupees
  purpose: PaymentPurpose;
  donorName: string;
  contact?: string;
  mobile?: string;
  email?: string;
  address?: string;
  panCard?: string;
  causeOrService?: string;
  referenceId?: string;
  applicantDetails?: Record<string, any>;
  notes?: Record<string, string>;
  onSuccess: (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
    paymentId: string;
    receiptNumber: string;
    membershipNumber?: string | null;
    emailSent?: boolean;
  }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}): Promise<void> {
  if (activeCheckoutLock) {
    return;
  }
  activeCheckoutLock = true;

  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      const err = new Error(
        'Razorpay Payment Gateway load failed. Please check internet connection or disable ad-blockers.'
      );
      if (options.onFailure) {
        options.onFailure(err);
      }
      return;
    }

    const { digits: userMobile, e164: formattedContact } = normalizePhoneForRazorpay(
      options.contact || options.mobile
    );
    const trimmedEmail = (options.email || '').trim();
    // Razorpay's payments/create/ajax UPI QR generation rejects blank emails with 400 BAD_REQUEST_ERROR.
    const checkoutEmail = trimmedEmail || 'luvkushsevatrust@gmail.com';

    // 1. Create real order server-side before opening checkout
    let order: { orderId: string; amount: number; amountPaise: number; keyId: string };
    try {
      order = await createRazorpayOrder({
        amount: options.amount,
        purpose: options.purpose,
        donorName: options.donorName,
        mobile: userMobile,
        email: trimmedEmail,
        address: options.address,
        referenceId: options.referenceId,
        applicantDetails: options.applicantDetails,
        notes: {
          cause: options.causeOrService || 'Charitable Donation',
          purpose: options.purpose,
          address: options.address || '',
          ...(options.notes || {}),
        },
      });
    } catch (orderErr: any) {
      if (options.onFailure) {
        options.onFailure(orderErr);
      }
      return;
    }

    const isSmartId = options.purpose === 'smart_id_card' || options.purpose === 'smart_id_card_fee';
    const isMembership = options.purpose === 'membership' || options.purpose === 'trust_membership';
    let callbackHandled = false;

    const checkoutDescription = isSmartId
      ? 'Special Service Smart ID Card Registration Fee (₹200)'
      : isMembership
      ? 'Luv Kush Seva Trust Life Membership Fee (₹5,000)'
      : `Charitable Donation for Humanity & Welfare (₹${options.amount})`;

    // 2. Configure Razorpay Standard Checkout modal:
    //    - E.164 +91 contact & non-blank email ensure Dynamic UPI QR & Intent requests validate cleanly.
    //    - Hide deprecated UPI Collect flow while keeping Dynamic QR (desktop), UPI Intent (mobile),
    //      Cards, Netbanking, and Wallet intact without duplicate custom blocks.
    const checkoutConfig: any = {
      key: order.keyId,
      amount: order.amountPaise,
      currency: 'INR',
      name: 'Luv Kush Seva Trust',
      description: checkoutDescription,
      image: resolveCheckoutLogoUrl(),
      order_id: order.orderId,
      prefill: {
        name: options.donorName,
        contact: formattedContact,
        email: checkoutEmail,
      },
      notes: {
        organization: 'Luv Kush Seva Trust',
        regNo: 'BR/2026/1161821',
        purpose: options.purpose,
        donorName: options.donorName,
        contact: userMobile,
        ...(options.notes || {}),
      },
      theme: {
        color: isSmartId || isMembership ? '#1e3a8a' : '#c2410c',
        backdrop_color: 'rgba(15, 23, 42, 0.75)',
      },
      modal: {
        confirm_close: true,
        animation: true,
        ondismiss: () => {
          activeCheckoutLock = false;
          if (!callbackHandled && options.onDismiss) {
            options.onDismiss();
          }
        },
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      config: {
        display: {
          hide: [
            {
              method: 'upi',
              flows: ['collect'],
            },
          ],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      handler: async (response: any) => {
        callbackHandled = true;
        activeCheckoutLock = false;
        try {
          // 3. Verify signature strictly server-side
          const rzpOrderId = response.razorpay_order_id || order.orderId;
          const rzpPaymentId = response.razorpay_payment_id;
          const rzpSig = response.razorpay_signature;

          if (!rzpPaymentId || !rzpSig) {
            throw new Error('Razorpay did not return paymentId or signature for verification.');
          }

          const verification = await verifyRazorpayPayment({
            razorpayOrderId: rzpOrderId,
            razorpayPaymentId: rzpPaymentId,
            razorpaySignature: rzpSig,
            purpose: options.purpose,
            donorName: options.donorName,
            mobile: userMobile,
            email: trimmedEmail,
            address: options.address,
            amount: options.amount,
            causeOrService: options.causeOrService,
            referenceId: options.referenceId,
          });

          options.onSuccess({
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPaymentId,
            razorpay_signature: rzpSig,
            orderId: rzpOrderId,
            paymentId: rzpPaymentId,
            receiptNumber: verification.receiptNumber,
            membershipNumber: verification.membershipNumber,
            emailSent: verification.emailSent,
          });
        } catch (verErr: any) {
          console.error('Payment verification error:', verErr);
          if (options.onFailure) {
            options.onFailure(verErr);
          }
        }
      },
    };

    const rzpInstance = new window.Razorpay(checkoutConfig);

    rzpInstance.on('payment.failed', (failedResponse: any) => {
      activeCheckoutLock = false;
      console.warn('Razorpay payment failed:', failedResponse.error);
      const errObj = failedResponse.error || { description: 'भुगतान असफल रहा।' };
      if (options.onFailure) {
        options.onFailure(errObj);
      }
    });

    rzpInstance.open();
  } catch (unexpectedErr: any) {
    activeCheckoutLock = false;
    if (options.onFailure) {
      options.onFailure(unexpectedErr);
    }
  }
}

