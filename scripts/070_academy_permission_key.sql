-- Phase 6 (Academy absorption, sub-phase 1: Users & Roles): add a
-- platform_permissions key so the command center's nav/page gating for the
-- Academy section is controlled consistently with every other platform.
-- Actual data operations against academy_* tables continue to rely on
-- Academy's own RLS (academy_is_admin()/academy_is_staff()), which the
-- current super_admin account already satisfies (confirmed live: it holds
-- super_admin/academy_admin/instructor rows in academy_user_roles from
-- earlier work) -- this key only gates the command center's own UI/nav.

BEGIN;

INSERT INTO public.platform_permissions (key, category, description, system_only) VALUES
  ('academy.manage', 'academy', 'Manage NCAA Academy: users/roles, courses, exams, licenses, CPD, compliance', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_role_permissions (role, permission_key)
VALUES ('super_admin', 'academy.manage')
ON CONFLICT DO NOTHING;

COMMIT;
