
DROP POLICY "Anyone can submit inquiries" ON public.inquiries;

CREATE POLICY "Anyone can submit valid inquiries" ON public.inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) BETWEEN 1 AND 100
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(email) <= 255
    AND guests BETWEEN 1 AND 20
    AND (message IS NULL OR length(message) <= 2000)
    AND status = 'new'
    AND admin_notes IS NULL
  );
