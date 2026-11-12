import { SUPABASE_URL } from './supabase';
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

/**
 * Creates a real server-side order via Supabase Edge Function.
 * Never returns mock or fake order IDs.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<{ orderId: string; amount: number; amountPaise: number; keyId: string }> {
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-razorpay-order`;

  const res = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    const errorMsg =
      data?.error ||
      data?.message ||
      `Server order creation failed with HTTP status ${res.status}.`;
    console.error('Failed to create Razorpay server order:', errorMsg, data);
    throw new Error(errorMsg);
  }

  if (!isValidRazorpayOrderId(data.orderId)) {
    console.error('Invalid Razorpay Order ID received from server:', data.orderId);
    throw new Error('Received an invalid Razorpay order identifier from payment server.');
  }

  return {
    orderId: data.orderId,
    amount: data.amount,
    amountPaise: data.amountPaise,
    keyId: data.keyId || (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '',
  };
}

/**
 * Verifies payment server-side via Supabase Edge Function
 */
export async function verifyRazorpayPayment(
  params: VerifyPaymentParams
): Promise<{
  success: boolean;
  verified: boolean;
  receiptNumber: string;
  paymentId: string;
  orderId: string;
}> {
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/verify-razorpay-payment`;

  const res = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    const errorMsg =
      data?.error ||
      data?.message ||
      `Server payment verification failed with status ${res.status}.`;
    console.error('Server signature verification failed:', errorMsg);
    throw new Error(errorMsg);
  }

  return {
    success: true,
    verified: Boolean(data.verified),
    receiptNumber: data.receiptNumber || `LKST-REC-2026-${Math.floor(100 + Math.random() * 900)}`,
    paymentId: data.paymentId || params.razorpayPaymentId,
    orderId: data.orderId || params.razorpayOrderId,
  };
}

/**
 * Launches the standard Razorpay Checkout modal with complete Dynamic UPI QR and Intent support.
 */
export async function openRazorpayCheckout(options: {
  amount: number; // in Rupees
  purpose: PaymentPurpose;
  donorName: string;
  contact?: string;
  mobile?: string;
  email?: string;
  panCard?: string;
  causeOrService?: string;
  referenceId?: string;
  notes?: Record<string, string>;
  onSuccess: (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
    paymentId: string;
    receiptNumber: string;
  }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    const err = new Error(
      'Razorpay Payment Gateway load failed. Please check internet connection or disable ad-blockers.'
    );
    if (options.onFailure) {
      options.onFailure(err);
    } else {
      alert(err.message);
    }
    return;
  }

  const userMobile = (options.contact || options.mobile || '').replace(/\D/g, '');

  // 1. Create real order server-side before opening checkout
  let order: { orderId: string; amount: number; amountPaise: number; keyId: string };
  try {
    order = await createRazorpayOrder({
      amount: options.amount,
      purpose: options.purpose,
      donorName: options.donorName,
      mobile: userMobile,
      email: options.email,
      referenceId: options.referenceId,
      notes: {
        cause: options.causeOrService || 'Charitable Donation',
        purpose: options.purpose,
        ...(options.notes || {}),
      },
    });
  } catch (orderErr: any) {
    if (options.onFailure) {
      options.onFailure(orderErr);
    } else {
      alert(`ऑर्डर निर्माण में त्रुटि: ${orderErr.message || 'कृपया व्यवस्थापक से संपर्क करें।'}`);
    }
    return;
  }

  const isSmartId = options.purpose === 'smart_id_card' || options.purpose === 'smart_id_card_fee';

  // 2. Configure Razorpay Standard Checkout modal with explicit Dynamic UPI QR & Intent
  const checkoutConfig: any = {
    key: order.keyId,
    amount: order.amountPaise,
    currency: 'INR',
    name: 'Luv Kush Seva Trust',
    description: isSmartId
      ? 'Special Service Smart ID Card Registration Fee (₹200)'
      : `Charitable Donation for Humanity & Welfare (₹${options.amount})`,
    image: TRUST_EMBLEM_LOGO,
    order_id: order.orderId, // Genuine server-side order ID (required for UPI QR & Intent)
    prefill: {
      name: options.donorName,
      contact: userMobile,
      email: options.email || '',
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
      color: isSmartId ? '#1e3a8a' : '#c2410c', // Blue for ID card, Orange for Donation
      backdrop_color: 'rgba(15, 23, 42, 0.75)',
    },
    modal: {
      confirm_close: true,
      animation: true,
      ondismiss: () => {
        if (options.onDismiss) {
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
        blocks: {
          upi: {
            name: 'Pay via UPI / Dynamic QR Code',
            instruments: [
              {
                method: 'upi',
                flows: ['qr', 'intent'],
              },
            ],
          },
          other: {
            name: 'Cards, NetBanking & Wallets',
            instruments: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
            ],
          },
        },
        sequence: ['block.upi', 'block.other'],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
    handler: async (response: any) => {
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
          email: options.email,
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
        });
      } catch (verErr: any) {
        console.error('Payment verification error:', verErr);
        if (options.onFailure) {
          options.onFailure(verErr);
        } else {
          alert(`भुगतान सत्यापन असफल रहा: ${verErr.message || 'कृपया व्यवस्थापक से संपर्क करें।'}`);
        }
      }
    },
  };

  const rzpInstance = new window.Razorpay(checkoutConfig);

  rzpInstance.on('payment.failed', (failedResponse: any) => {
    console.warn('Razorpay payment failed:', failedResponse.error);
    const errObj = failedResponse.error || { description: 'भुगतान असफल रहा।' };
    if (options.onFailure) {
      options.onFailure(errObj);
    } else {
      alert(`भुगतान असफल रहा: ${errObj.description || 'कृपया पुनः प्रयास करें।'}`);
    }
  });

  rzpInstance.open();
}
