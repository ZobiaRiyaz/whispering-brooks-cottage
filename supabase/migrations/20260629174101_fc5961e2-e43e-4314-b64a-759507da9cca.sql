
-- Auto-hold dates on inquiry submission and update admin hold lifecycle.

CREATE OR REPLACE FUNCTION public.hold_dates_for_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.blocked_dates (start_date, end_date, reason, inquiry_id)
  VALUES (NEW.check_in, NEW.check_out, 'Pending: ' || NEW.name, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inquiries_hold_dates ON public.inquiries;
CREATE TRIGGER inquiries_hold_dates
AFTER INSERT ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION public.hold_dates_for_inquiry();

-- Make realtime work for blocked_dates (REPLICA IDENTITY FULL so updates carry old row).
ALTER TABLE public.blocked_dates REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_dates;
