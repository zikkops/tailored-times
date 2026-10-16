-- Tailored Times: paying with Whish (16 Oct 2026)
--
-- The second way to pay, beside cash on delivery. When someone chooses Whish
-- we ask for a payment link, send them to it, and keep what comes back on the
-- order: where they were sent, how it ended, and when we last asked Whish.
--
-- payment_state is ours, not theirs:
--   'on_delivery' - cash on delivery, nothing to collect online (the default)
--   'pending'     - sent to Whish, no settled answer yet
--   'paid'        - Whish told us, when we asked, that it was paid
--   'failed'      - the attempt ended badly, or the link could not be made
--   'refunded'    - given back
--
-- Only an answer from Whish's own status endpoint ever writes 'paid': their
-- callback carries no signature, so it is treated as a nudge to go and ask.

alter table public.orders
  add column payment_state    text not null default 'on_delivery',
  add column whish_collect_url text,       -- the link the customer was sent to
  add column whish_checked_at  timestamptz, -- last time we asked Whish
  add column whish_error       text;        -- last failure, cleared when it is paid

alter table public.orders
  add constraint orders_payment_state_check
  check (payment_state in ('on_delivery', 'pending', 'paid', 'failed', 'refunded'));

-- The admin lists orders waiting on a payment.
create index orders_payment_state_idx on public.orders (payment_state);
