-- NCAA Command Center, Phase 0: unified permission + audit foundation.
--
-- Generalizes the proven catalog -> role-defaults -> per-user-overrides ->
-- has_permission()/effective_permissions() pattern already built (and mostly
-- unused) in ncaalearn's academy_permissions/academy_role_permissions/
-- academy_user_permissions/academy_has_permission -- NOT a new invention.
-- Deliberately does not touch any academy_* table: 22 ncaalearn routes and 7
-- of its own *.functions.ts files depend on those exact names today.
--
-- Real roles from day one (not just superadmin): super_admin (President +
-- VP, full access), finance (payments/reports only), general_secretary
-- (broader operational access), zonal_rep (zone-scoped, real row-level
-- restriction, not a UI filter).

BEGIN;

-- ── Catalog ──────────────────────────────────────────────────────────────
CREATE TABLE public.platform_permissions (
  key text PRIMARY KEY,
  category text NOT NULL,
  description text,
  system_only boolean NOT NULL DEFAULT false
);

INSERT INTO public.platform_permissions (key, category, description, system_only) VALUES
  ('arbiters.view', 'arbiters', 'View all arbiter records', false),
  ('arbiters.manage', 'arbiters', 'Edit/delete arbiter records', false),
  ('arbiters.view.zone', 'arbiters', 'View arbiter records within your own zone only', false),
  ('tournaments.view', 'tournaments', 'View tournaments and assignments', false),
  ('tournaments.manage', 'tournaments', 'Create/edit tournaments and assignments', false),
  ('payments.view', 'payments', 'View payments and payment dues', false),
  ('payments.manage', 'payments', 'Assign dues, reconcile payments, manage checkoff', false),
  ('reports.view', 'reports', 'View analytics and reporting dashboards', false),
  ('voting.view', 'voting', 'View elections, candidates, results', false),
  ('voting.manage', 'voting', 'Create/publish/close elections, approve candidates', false),
  ('website.manage', 'website', 'Moderate complaints, manage newsletter subscribers', false),
  ('broadcast.manage', 'broadcast', 'Create/edit/publish broadcasts', false),
  ('rates.manage', 'rates', 'Manage published allowance rates', false),
  ('announcements.manage', 'communications', 'Compose/publish announcements', false),
  ('notifications.send', 'communications', 'Send notifications to any member', false),
  ('notifications.send.zone', 'communications', 'Send notifications to members within your own zone only', false),
  ('inbox.manage', 'communications', 'View/respond to contact-form submissions', false),
  ('incidents.manage', 'arbiters', 'View/manage disciplinary cases', false),
  ('system.sql_console', 'system', 'Access the raw SQL/schema/RLS console (nacpapa)', true),
  ('system.auth_users', 'system', 'Manage Supabase auth users directly', true),
  ('system.settings', 'system', 'Edit platform-wide command center settings', true),
  ('audit.view', 'system', 'View the unified audit log', true)
ON CONFLICT (key) DO NOTHING;

-- ── Role assignment (many-to-many; scope_zone only meaningful for zonal_rep) ─
CREATE TABLE public.platform_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  scope_zone public.zone_type,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_zone)
);

-- Backfill: today's two admin/superadmin profiles both become super_admin
-- (President + VP both get full access, matching the org structure).
INSERT INTO public.platform_user_roles (user_id, role)
SELECT id, 'super_admin' FROM public.profiles WHERE role IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;

-- ── Role -> permission defaults ─────────────────────────────────────────
CREATE TABLE public.platform_role_permissions (
  role text NOT NULL,
  permission_key text NOT NULL REFERENCES public.platform_permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_key)
);

-- super_admin: every permission, including system_only.
INSERT INTO public.platform_role_permissions (role, permission_key)
SELECT 'super_admin', key FROM public.platform_permissions
ON CONFLICT DO NOTHING;

-- finance: payments + reports only.
INSERT INTO public.platform_role_permissions (role, permission_key) VALUES
  ('finance', 'payments.view'),
  ('finance', 'payments.manage'),
  ('finance', 'reports.view')
ON CONFLICT DO NOTHING;

-- general_secretary: broader operational access -- comms, arbiters, tournaments.
INSERT INTO public.platform_role_permissions (role, permission_key) VALUES
  ('general_secretary', 'announcements.manage'),
  ('general_secretary', 'notifications.send'),
  ('general_secretary', 'inbox.manage'),
  ('general_secretary', 'arbiters.view'),
  ('general_secretary', 'arbiters.manage'),
  ('general_secretary', 'tournaments.view'),
  ('general_secretary', 'tournaments.manage')
ON CONFLICT DO NOTHING;

-- zonal_rep: zone-scoped view + notify only, nothing else.
INSERT INTO public.platform_role_permissions (role, permission_key) VALUES
  ('zonal_rep', 'arbiters.view.zone'),
  ('zonal_rep', 'notifications.send.zone')
ON CONFLICT DO NOTHING;

-- ── Per-user overrides (empty today) ────────────────────────────────────
CREATE TABLE public.platform_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.platform_permissions(key) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true,
  reason text,
  expires_at timestamptz,
  granted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);

-- ── Evaluation functions (same precedence as academy_has_permission) ────
CREATE OR REPLACE FUNCTION public.platform_has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override boolean;
  v_is_super boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.platform_user_roles WHERE user_id = _user_id AND role = 'super_admin'
  ) INTO v_is_super;
  IF v_is_super THEN
    RETURN true;
  END IF;

  SELECT granted INTO v_override
  FROM public.platform_user_permissions
  WHERE user_id = _user_id
    AND permission_key = _permission
    AND (expires_at IS NULL OR expires_at > now());
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.platform_user_roles ur
    JOIN public.platform_role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission_key = _permission
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_effective_permissions(_user_id uuid)
RETURNS TABLE(key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.key FROM public.platform_permissions p
  WHERE public.platform_has_permission(_user_id, p.key);
$$;

CREATE OR REPLACE FUNCTION public.platform_is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_user_roles WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.platform_zonal_scope(_user_id uuid)
RETURNS public.zone_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT scope_zone FROM public.platform_user_roles
  WHERE user_id = _user_id AND role = 'zonal_rep' AND scope_zone IS NOT NULL
  LIMIT 1;
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.platform_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions catalog readable by authenticated" ON public.platform_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "role permissions readable by authenticated" ON public.platform_role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "own roles readable, super_admin reads all" ON public.platform_user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR platform_is_super_admin(auth.uid()));
CREATE POLICY "own overrides readable, super_admin reads all" ON public.platform_user_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR platform_is_super_admin(auth.uid()));

CREATE POLICY "super_admin manages roles" ON public.platform_user_roles
  FOR ALL TO authenticated USING (platform_is_super_admin(auth.uid())) WITH CHECK (platform_is_super_admin(auth.uid()));
CREATE POLICY "super_admin manages role permissions" ON public.platform_role_permissions
  FOR ALL TO authenticated USING (platform_is_super_admin(auth.uid())) WITH CHECK (platform_is_super_admin(auth.uid()));
CREATE POLICY "super_admin manages user overrides" ON public.platform_user_permissions
  FOR ALL TO authenticated USING (platform_is_super_admin(auth.uid())) WITH CHECK (platform_is_super_admin(auth.uid()));
CREATE POLICY "super_admin manages permissions catalog" ON public.platform_permissions
  FOR ALL TO authenticated USING (platform_is_super_admin(auth.uid())) WITH CHECK (platform_is_super_admin(auth.uid()));

GRANT SELECT ON public.platform_permissions, public.platform_role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_user_roles, public.platform_user_permissions TO authenticated;

-- ── Unified audit log ────────────────────────────────────────────────────
CREATE TABLE public.platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  platform text NOT NULL CHECK (platform IN ('arbiters','academy','voting','website','broadcast','rates','system')),
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_audit_log_created_at ON public.platform_audit_log(created_at DESC);
CREATE INDEX idx_platform_audit_log_platform ON public.platform_audit_log(platform);
CREATE INDEX idx_platform_audit_log_actor ON public.platform_audit_log(actor_id);

ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin reads audit log" ON public.platform_audit_log
  FOR SELECT TO authenticated USING (platform_is_super_admin(auth.uid()));
CREATE POLICY "authenticated can write audit log" ON public.platform_audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

GRANT SELECT, INSERT ON public.platform_audit_log TO authenticated;

COMMIT;
