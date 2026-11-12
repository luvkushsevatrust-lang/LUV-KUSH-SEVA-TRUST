export type PaymentPurpose = 'donation' | 'smart_id_card' | 'charitable_donation' | 'smart_id_card_fee';

export type RazorpayOrderStatus = 'created' | 'attempted' | 'paid' | 'failed' | 'tampered';

export type RazorpayPaymentStatus = 'captured' | 'authorized' | 'failed' | 'refunded';

export interface RazorpayOrder {
  id: string; // Internal order code, e.g. LKST-ORD-2026-XXXX
  orderId: string; // Razorpay Order ID, e.g. order_XXXXXXXX
  amount: number; // in Rupees
  amountPaise: number; // in Paise
  currency: string; // 'INR'
  purpose: PaymentPurpose;
  donorOrApplicantName: string;
  email?: string;
  mobile: string;
  referenceId?: string; // Receipt number or Application ID
  status: RazorpayOrderStatus;
  receiptCode: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface RazorpayPaymentRecord {
  id: string;
  paymentId: string; // Razorpay Payment ID, e.g. pay_XXXXXXXX
  orderId: string;
  signature: string;
  amount: number;
  currency: string;
  status: RazorpayPaymentStatus;
  method?: string; // 'upi' | 'card' | 'netbanking' | 'wallet'
  vpa?: string;
  bank?: string;
  fee?: number;
  tax?: number;
  verifiedVia: 'server_hmac' | 'webhook';
  errorCode?: string;
  errorDescription?: string;
  createdAt: string;
}

export interface RazorpayWebhookEvent {
  id: string;
  eventId: string;
  eventType: string; // 'payment.captured' | 'payment.failed' | 'order.paid'
  orderId?: string;
  paymentId?: string;
  payload: Record<string, any>;
  signature: string;
  processed: boolean;
  processingError?: string;
  attempts: number;
  processedAt?: string;
  createdAt: string;
}

export type SmartIdTier = 'special_service_200' | 'general_associate_free';

export type SmartIdPaymentStatus = 'paid' | 'free_exempt' | 'pending';

export interface IdCardOrder {
  id: string; // LKST-IDORD-2026-XXXX
  orderId?: string; // Razorpay order id or local code
  paymentId?: string; // Razorpay payment id
  registrationId?: string; // Linked application/student/volunteer ID
  applicantId?: string;
  registrationType?: 'service_application' | 'student' | 'volunteer';
  tier: SmartIdTier;
  fullName?: string;
  mobile?: string;
  email?: string;
  serviceCategory?: string;
  amountFee?: number; // 200.00 or 0.00
  feeAmount?: number; // 200.00 or 0.00
  paymentStatus?: SmartIdPaymentStatus;
  isPaid?: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  adminApprovalStatus?: 'Pending' | 'Approved' | 'Rejected';
  adminApproved?: boolean;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  cardIssued?: boolean;
  idCardIssued?: boolean; // Locked to false until Admin approves
  idCardId?: string;
  idCardNumber?: string;
  approvalRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderParams {
  amount: number; // in Rupees
  purpose: PaymentPurpose;
  donorName: string;
  mobile: string;
  email?: string;
  notes?: Record<string, string>;
  referenceId?: string;
}

export interface VerifyPaymentParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  purpose: PaymentPurpose;
  donorName: string;
  mobile: string;
  email?: string;
  amount: number;
  causeOrService?: string;
  referenceId?: string;
}
