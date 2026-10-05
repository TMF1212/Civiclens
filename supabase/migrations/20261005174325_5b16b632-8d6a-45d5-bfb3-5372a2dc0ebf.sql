CREATE TABLE public.election_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id text NOT NULL,
  file_name text NOT NULL,
  kind text NOT NULL,
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  valid_count integer NOT NULL DEFAULT 0 CHECK (valid_count >= 0),
  status text NOT NULL,
  records jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(records) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.election_imports TO anon, authenticated;
GRANT ALL ON public.election_imports TO service_role;
ALTER TABLE public.election_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view and add shared imports" ON public.election_imports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add shared imports" ON public.election_imports FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.election_reviews (
  election_id text NOT NULL,
  record_id text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('Unreviewed', 'Under Review', 'Verified Match', 'Confirmed Data Difference', 'Insufficient Evidence')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (election_id, record_id)
);
GRANT SELECT, INSERT, UPDATE ON public.election_reviews TO anon, authenticated;
GRANT ALL ON public.election_reviews TO service_role;
ALTER TABLE public.election_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shared reviews" ON public.election_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add shared reviews" ON public.election_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update shared reviews" ON public.election_reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.election_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id text NOT NULL,
  action text NOT NULL,
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.election_audit TO anon, authenticated;
GRANT ALL ON public.election_audit TO service_role;
ALTER TABLE public.election_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shared audit entries" ON public.election_audit FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add shared audit entries" ON public.election_audit FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_election_shared_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER election_imports_updated_at BEFORE UPDATE ON public.election_imports FOR EACH ROW EXECUTE FUNCTION public.set_election_shared_updated_at();
CREATE TRIGGER election_reviews_updated_at BEFORE UPDATE ON public.election_reviews FOR EACH ROW EXECUTE FUNCTION public.set_election_shared_updated_at();
CREATE TRIGGER election_audit_updated_at BEFORE UPDATE ON public.election_audit FOR EACH ROW EXECUTE FUNCTION public.set_election_shared_updated_at();