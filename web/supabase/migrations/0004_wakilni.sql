-- Tailored Times: delivery through Wakilni (15 Oct 2026)
--
-- Orders are handed to Wakilni (the delivery company) when the team moves
-- them to 'delivering' in the admin. The customer picks their area from
-- Wakilni's list at checkout; what Wakilni sends back (its order id and the
-- tracking link) is kept on the order, and so is the last error, so the team
-- can see why a hand-over failed and try again.

alter table public.orders
  add column delivery_area       text,         -- Wakilni area name, e.g. 'Hamra'
  add column wakilni_order_id    bigint,       -- Wakilni's delivery_id
  add column wakilni_tracking_id text,
  add column wakilni_tracking_url text,
  add column wakilni_sent_at     timestamptz,
  add column wakilni_error       text;         -- last failed attempt, cleared on success
