-- ==============================================================================
-- LUV KUSH SEVA TRUST - PHASE 3: MEMBERSHIP (₹5,000) & ADMIN AUDIT SYSTEM
-- Project ID: yjbowhkgwatrwmuyvkja
-- Safe, non-destructive, idempotent migration. Preserves all existing tables/data.
-- ==============================================================================

-- 1. Allow 'membership' purpose inside razorpay_orders
DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  FOR v_constraint IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'razorpay_orders'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%purpose%'
  LOOP
    EXECUTE format('ALTER TABLE public.razorpay_orders DROP CONSTRAINT IF EXISTS %I', v_constraint.conname);
  END LOOP;

  ALTER TABLE public.razorpay_orders
    ADD CONSTRAINT razorpay_orders_purpose_check
    CHECK (purpose IN ('donation', 'smart_id_card', 'membership'));
END $$;

-- 2. Sequences & IST-Year Number Generators for Memberships
CREATE SEQUENCE IF NOT EXISTS public.membership_number_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.membership_receipt_seq START WITH 1001 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_unique_membership_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq BIGINT;
  v_year TEXT;
BEGIN
  v_seq := nextval('public.membership_number_seq');
  v_year := EXTRACT(YEAR FROM TIMEZONE('Asia/Kolkata', NOW()))::TEXT;
  RETURN 'LKST-MEM-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_membership_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq BIGINT;
  v_year TEXT;
BEGIN
  v_seq := nextval('public.membership_receipt_seq');
  v_year := EXTRACT(YEAR FROM TIMEZONE('Asia/Kolkata', NOW()))::TEXT;
  RETURN 'LKST-MEM-REC-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$;

-- 3. Memberships Table (सदस्यता आवेदन, ₹5,000 भुगतान एवं ऑडिट)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_number TEXT UNIQUE,
  receipt_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  father_or_husband_name TEXT,
  dob TEXT,
  gender TEXT,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT,
  state TEXT DEFAULT 'Bihar',
  pin_code TEXT,
  aadhaar_number TEXT,
  pan_card TEXT,
  occupation TEXT,
  qualification TEXT,
  photo_url TEXT,
  membership_type TEXT NOT NULL DEFAULT 'Life Member',
  fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 5000.00 CHECK (fee_amount = 5000.00),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
  status TEXT NOT NULL DEFAULT 'Pending Payment' CHECK (status IN ('Pending Payment', 'Confirmed', 'Suspended', 'Cancelled')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  payment_mode TEXT,
  paid_at TIMESTAMPTZ,
  receipt_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_email_sent_at TIMESTAMPTZ,
  receipt_email_id TEXT,
  audit_status TEXT NOT NULL DEFAULT 'Pending Audit' CHECK (audit_status IN ('Pending Audit', 'Audited & Verified', 'Flagged')),
  audit_notes TEXT,
  audited_by TEXT,
  audited_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Immutable Membership Audit Trail Table
CREATE TABLE IF NOT EXISTS public.membership_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  membership_number TEXT,
  action TEXT NOT NULL,
  previous_audit_status TEXT,
  new_audit_status TEXT,
  audit_notes TEXT,
  audited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for Fast Admin Lookup, Payment Settlement & Email Reconciliation
CREATE INDEX IF NOT EXISTS idx_memberships_payment_status ON public.memberships(payment_status);
CREATE INDEX IF NOT EXISTS idx_memberships_audit_status ON public.memberships(audit_status);
CREATE INDEX IF NOT EXISTS idx_memberships_mobile ON public.memberships(mobile);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON public.memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_created_at ON public.memberships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_receipt_email_pending
  ON public.memberships(receipt_email_sent)
  WHERE receipt_email_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_membership_audit_logs_membership
  ON public.membership_audit_logs(membership_id, created_at DESC);

-- 6. Strict Row-Level Security (No anon access; Admin JWT & service_role only)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.memberships FROM anon;
REVOKE ALL ON public.membership_audit_logs FROM anon;
GRANT SELECT, UPDATE ON public.memberships TO authenticated;
GRANT SELECT, INSERT ON public.membership_audit_logs TO authenticated;

DROP POLICY IF EXISTS "Service role full access memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins view and audit memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins view memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins update memberships audit" ON public.memberships;

CREATE POLICY "Service role full access memberships"
  ON public.memberships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins view memberships"
  ON public.memberships
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins update memberships audit"
  ON public.memberships
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Service role full access membership_audit_logs" ON public.membership_audit_logs;
DROP POLICY IF EXISTS "Admins view membership audit logs" ON public.membership_audit_logs;
DROP POLICY IF EXISTS "Admins insert membership audit logs" ON public.membership_audit_logs;

CREATE POLICY "Service role full access membership_audit_logs"
  ON public.membership_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins view membership audit logs"
  ON public.membership_audit_logs
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins insert membership audit logs"
  ON public.membership_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 7. Privacy-Safe Public Confirmed Membership Verification RPC
CREATE OR REPLACE FUNCTION public.lookup_confirmed_membership(p_query TEXT)
RETURNS TABLE (
  id UUID,
  membership_number TEXT,
  receipt_number TEXT,
  full_name TEXT,
  mobile TEXT,
  district TEXT,
  state TEXT,
  membership_type TEXT,
  fee_amount NUMERIC,
  payment_status TEXT,
  status TEXT,
  payment_mode TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  audit_status TEXT,
  audited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT := TRIM(COALESCE(p_query, ''));
  v_digits TEXT := REGEXP_REPLACE(TRIM(COALESCE(p_query, '')), '\D', '', 'g');
BEGIN
  IF LENGTH(v_clean) < 6 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.membership_number,
    m.receipt_number,
    m.full_name,
    CASE
      WHEN LENGTH(REGEXP_REPLACE(COALESCE(m.mobile, ''), '\D', '', 'g')) >= 4
        THEN REPEAT('X', GREATEST(0, LENGTH(REGEXP_REPLACE(COALESCE(m.mobile, ''), '\D', '', 'g')) - 4))
             || RIGHT(REGEXP_REPLACE(COALESCE(m.mobile, ''), '\D', '', 'g'), 4)
      ELSE 'XXXXXX'
    END AS mobile,
    m.district,
    m.state,
    m.membership_type,
    m.fee_amount,
    m.payment_status,
    m.status,
    m.payment_mode,
    m.razorpay_order_id,
    m.razorpay_payment_id,
    m.paid_at,
    m.audit_status,
    m.audited_at,
    m.created_at
  FROM public.memberships m
  WHERE m.payment_status = 'Paid'
    AND m.status = 'Confirmed'
    AND (
      UPPER(COALESCE(m.membership_number, '')) = UPPER(v_clean)
      OR UPPER(COALESCE(m.receipt_number, '')) = UPPER(v_clean)
      OR m.razorpay_payment_id = v_clean
      OR (
        LENGTH(v_digits) >= 10
        AND RIGHT(REGEXP_REPLACE(COALESCE(m.mobile, ''), '\D', '', 'g'), 10) = RIGHT(v_digits, 10)
      )
    )
  ORDER BY m.paid_at DESC NULLS LAST, m.created_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_confirmed_membership(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_confirmed_membership(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_unique_membership_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_unique_membership_receipt_number() TO service_role;
