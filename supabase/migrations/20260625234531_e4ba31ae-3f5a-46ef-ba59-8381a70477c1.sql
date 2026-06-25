
-- 1. brand_settings: remove anon SELECT, mantém leitura apenas para autenticados
DROP POLICY IF EXISTS brand_settings_select_all ON public.brand_settings;
CREATE POLICY brand_settings_select_authenticated
  ON public.brand_settings FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.brand_settings FROM anon;

-- 2. calendario_eventos: escopo por dono
DROP POLICY IF EXISTS "Authenticated users can view calendario_eventos" ON public.calendario_eventos;
DROP POLICY IF EXISTS "Authenticated users can insert calendario_eventos" ON public.calendario_eventos;
DROP POLICY IF EXISTS "Authenticated users can update calendario_eventos" ON public.calendario_eventos;
DROP POLICY IF EXISTS "Authenticated users can delete calendario_eventos" ON public.calendario_eventos;

CREATE POLICY calendario_eventos_select_own ON public.calendario_eventos
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY calendario_eventos_insert_own ON public.calendario_eventos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY calendario_eventos_update_own ON public.calendario_eventos
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY calendario_eventos_delete_own ON public.calendario_eventos
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- 3. experiencias: escopo por dono
DROP POLICY IF EXISTS auth_select_experiencias ON public.experiencias;
DROP POLICY IF EXISTS auth_insert_experiencias ON public.experiencias;
DROP POLICY IF EXISTS auth_update_experiencias ON public.experiencias;
DROP POLICY IF EXISTS auth_delete_experiencias ON public.experiencias;

CREATE POLICY experiencias_select_own ON public.experiencias
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY experiencias_insert_own ON public.experiencias
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY experiencias_update_own ON public.experiencias
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY experiencias_delete_own ON public.experiencias
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- 4. hospedagens: escopo por dono
DROP POLICY IF EXISTS auth_select_hospedagens ON public.hospedagens;
DROP POLICY IF EXISTS auth_insert_hospedagens ON public.hospedagens;
DROP POLICY IF EXISTS auth_update_hospedagens ON public.hospedagens;
DROP POLICY IF EXISTS auth_delete_hospedagens ON public.hospedagens;

CREATE POLICY hospedagens_select_own ON public.hospedagens
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY hospedagens_insert_own ON public.hospedagens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY hospedagens_update_own ON public.hospedagens
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY hospedagens_delete_own ON public.hospedagens
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- 5. user_roles: bloqueia escalonamento via política RESTRICTIVE
-- A política permissiva "Admins can manage roles" continua valendo para admins.
-- Adicionamos uma política RESTRICTIVE que exige privilégio admin para qualquer
-- INSERT/UPDATE/DELETE, impedindo que um usuário comum se atribua papéis.
CREATE POLICY user_roles_only_admins_can_write ON public.user_roles
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Permite que a política RESTRICTIVE não bloqueie a leitura do próprio papel:
-- reescrevemos como restritiva apenas para escrita.
DROP POLICY IF EXISTS user_roles_only_admins_can_write ON public.user_roles;

CREATE POLICY user_roles_block_non_admin_insert ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY user_roles_block_non_admin_update ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY user_roles_block_non_admin_delete ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
