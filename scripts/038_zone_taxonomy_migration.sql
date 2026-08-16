-- Reconcile profiles.zone with the real Nigerian geopolitical zones already
-- used by the `zones` table (North Central, North East, North West, South
-- East, South South, South West), replacing the app's old simplified
-- North/South/East/West/Central/FCT scheme, which never matched zones.name
-- and made every arbiter-per-zone count on /dashboard/zones read 0.
--
-- Old enum labels are left in place rather than dropped (`zone_type` also
-- backs `profiles_public`, a view outside this app's direct control, and
-- ALTER TYPE ... DROP VALUE doesn't exist in Postgres) — they simply go
-- unused going forward. Only 5 profiles exist in production at the time of
-- this migration, so this is effectively a zero-risk change.
--
-- Part 1: ADD VALUE cannot be used in the same transaction as the backfill
-- below (Postgres forbids using a brand-new enum label before it's
-- committed), so these run unwrapped as their own auto-committed statements.

ALTER TYPE public.zone_type ADD VALUE IF NOT EXISTS 'North Central';
ALTER TYPE public.zone_type ADD VALUE IF NOT EXISTS 'North East';
ALTER TYPE public.zone_type ADD VALUE IF NOT EXISTS 'North West';
ALTER TYPE public.zone_type ADD VALUE IF NOT EXISTS 'South East';
ALTER TYPE public.zone_type ADD VALUE IF NOT EXISTS 'South South';
ALTER TYPE public.zone_type ADD VALUE IF NOT EXISTS 'South West';
