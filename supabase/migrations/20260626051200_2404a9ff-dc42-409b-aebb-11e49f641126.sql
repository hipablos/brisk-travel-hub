
-- Restrict brand_settings SELECT to admins only
DROP POLICY IF EXISTS brand_settings_select_authenticated ON public.brand_settings;
CREATE POLICY brand_settings_select_admin ON public.brand_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten telegram_config policy role from public to authenticated
DROP POLICY IF EXISTS "Users manage own telegram config" ON public.telegram_config;
CREATE POLICY "Users manage own telegram config" ON public.telegram_config
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
