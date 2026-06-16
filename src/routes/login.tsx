import { BriskLogo } from "@/components/BriskLogo";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plane, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrand } from "@/hooks/use-brand";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Entrar" },
      { name: "description", content: "Acesse o CRM da Brisk Viagens." },
    ],
  }),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(4, "Mínimo de 4 caracteres").max(72),
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome completo").max(100),
    email: z.string().trim().email("E-mail inválido").max(255),
    password: z.string().min(4, "Mínimo de 4 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

function LoginPage() {
  const navigate = useNavigate();
  const { login: layout, brand } = useBrand();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // login
  const [lEmail, setLEmail] = useState("");
  const [lPassword, setLPassword] = useState("");
  const [lErrors, setLErrors] = useState<Record<string, string>>({});

  // signup
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [sErrors, setSErrors] = useState<Record<string, string>>({});

  // forgot
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = loginSchema.safeParse({ email: lEmail, password: lPassword });
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setLErrors(errs);
      return;
    }
    setLErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: r.data.email, password: r.data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "E-mail ou senha incorretos" : error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = signupSchema.safeParse({ fullName: sName, email: sEmail, password: sPassword, confirm: sConfirm });
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setSErrors(errs);
      return;
    }
    setSErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: r.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("registered") ? "E-mail já cadastrado" : error.message);
      return;
    }
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/" });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de recuperação para seu e-mail.");
    setForgotOpen(false);
    setForgotEmail("");
  };

  const bgStyle = { background: layout?.fundo_valor || "var(--gradient-brand)" };
  const cardStyle = { background: layout?.cor_card || "var(--card)" };
  const btnStyle = layout
    ? { background: layout.cor_botao, color: layout.cor_botao_texto }
    : {};
  const linkColor = layout?.cor_links || "var(--secondary)";
  const textColor = layout?.cor_textos || "var(--primary-foreground)";
  const logoAlign = (layout?.logo_alinhamento || "left") as "left" | "center" | "right";

  return (
    <div className="min-h-screen flex items-stretch bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={bgStyle}>
        <div className="relative z-10" style={{ textAlign: logoAlign }}>
          {layout?.logo_url ? (
            <img src={layout.logo_url} alt="" style={{ width: layout.logo_largura, height: layout.logo_altura, objectFit: "contain", display: "inline-block" }} />
          ) : brand?.logo_url ? (
            <img src={brand.logo_url} alt="" className="h-14 w-auto inline-block" />
          ) : (
            <BriskLogo variant="white" className="h-14 w-auto inline-block" />
          )}
        </div>
        <div className="relative z-10 space-y-4" style={{ color: textColor }}>
          <h1 className="text-4xl font-bold leading-tight">
            {layout?.titulo || "Gestão completa para sua agência de viagens."}
          </h1>
          <p className="opacity-80 max-w-md">
            {layout?.subtitulo || "Cotações, clientes, voos e financeiro em um só lugar."}
          </p>
        </div>
        <div className="relative z-10 text-xs opacity-60" style={{ color: textColor }}>
          © {new Date().getFullYear()} {brand?.empresa_nome || "Brisk Viagens"}
        </div>
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10" style={cardStyle}>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            {brand?.logo_url ? (
              <img src={brand.logo_url} alt="" className="h-10 w-auto" />
            ) : (
              <BriskLogo variant="color" className="h-10 w-auto" />
            )}
          </div>

          {forgotOpen ? (
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Recuperar senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enviaremos um link para redefinir sua senha.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="forgot-email" type="email" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-9" placeholder="seu@email.com" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Enviar link
              </Button>
              <button type="button" onClick={() => setForgotOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
                Voltar ao login
              </button>
            </form>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">
                  {tab === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {tab === "login"
                    ? "Acesse o CRM da Brisk Viagens."
                    : "Em poucos segundos você está dentro."}
                </p>
              </div>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="l-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="l-email" type="email" value={lEmail}
                        onChange={(e) => setLEmail(e.target.value)}
                        className="pl-9" placeholder="seu@email.com" autoComplete="email" />
                    </div>
                    {lErrors.email && <p className="text-xs text-destructive">{lErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="l-password">Senha</Label>
                      <button type="button" onClick={() => setForgotOpen(true)}
                        className="text-xs text-secondary hover:underline">
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="l-password" type="password" value={lPassword}
                        onChange={(e) => setLPassword(e.target.value)}
                        className="pl-9" placeholder="••••••••" autoComplete="current-password" />
                    </div>
                    {lErrors.password && <p className="text-xs text-destructive">{lErrors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Entrar
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Não tem conta?{" "}
                    <button type="button" onClick={() => setTab("signup")} className="text-secondary hover:underline font-medium">
                      Criar conta
                    </button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="s-name">Nome completo</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="s-name" value={sName} onChange={(e) => setSName(e.target.value)}
                        className="pl-9" placeholder="Seu nome" autoComplete="name" />
                    </div>
                    {sErrors.fullName && <p className="text-xs text-destructive">{sErrors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="s-email" type="email" value={sEmail}
                        onChange={(e) => setSEmail(e.target.value)}
                        className="pl-9" placeholder="seu@email.com" autoComplete="email" />
                    </div>
                    {sErrors.email && <p className="text-xs text-destructive">{sErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="s-password" type="password" value={sPassword}
                        onChange={(e) => setSPassword(e.target.value)}
                        className="pl-9" placeholder="Mínimo 4 caracteres" autoComplete="new-password" />
                    </div>
                    {sErrors.password && <p className="text-xs text-destructive">{sErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-confirm">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="s-confirm" type="password" value={sConfirm}
                        onChange={(e) => setSConfirm(e.target.value)}
                        className="pl-9" placeholder="Repita a senha" autoComplete="new-password" />
                    </div>
                    {sErrors.confirm && <p className="text-xs text-destructive">{sErrors.confirm}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Criar conta
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Já tem conta?{" "}
                    <button type="button" onClick={() => setTab("login")} className="text-secondary hover:underline font-medium">
                      Entrar
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
