-- ==============================================================================
-- LUV KUSH SEVA TRUST – PHASE 2: IDEMPOTENT RECEIPT EMAIL TRACKING
-- Safe, Additive & Idempotent Migration (Zero Drops, Zero Data Deletion)
-- Prevents duplicate receipt emails when browser verification and webhook
-- process the same Razorpay payment concurrently.
-- ==============================================================================

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS receipt_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receipt_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_email_id TEXT;

ALTER TABLE public.id_card_orders
  ADD COLUMN IF NOT EXISTS receipt_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receipt_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_email_id TEXT;

CREATE INDEX IF NOT EXISTS idx_donations_receipt_email_pending
  ON public.donations (razorpay_payment_id)
  WHERE receipt_email_sent = FALSE;
