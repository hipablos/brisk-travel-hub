import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  component: PerfilPage,
  head: () => ({
    meta: [{ title: "Brisk Viagens — Meu Perfil" }],
  }),
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cargo: string | null;
  idioma: string | null;
  tema: string | null;
  created_at?: string;
};

function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar perfil");
        setProfile(
          data ?? {
            id: user.id,
            full_name: (user.user_metadata?.full_name as string) ?? "",
            email: user.email ?? "",
            avatar_url: null,
            cargo: null,
            idioma: "pt-BR",
            tema: "auto",
          }
        );
        setLoading(false);
      });
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        cargo: profile.cargo,
        idioma: profile.idioma,
        tema: profile.tema,
        avatar_url: profile.avatar_url,
      });
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Perfil atualizado");
      if (profile.tema === "light" || profile.tema === "dark") {
        setTheme(profile.tema);
      }
    }
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      toast.error("Senha deve ter ao menos 6 caracteres");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Confirmação não confere");
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Senha alterada");
      setNewPass("");
      setConfirmPass("");
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 grid place-items-center text-muted-foreground">Carregando...</main>
        </div>
      </div>
    );
  }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—";
  const initial = (profile.full_name || profile.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-gradient-to-br from-secondary to-secondary/60 grid place-items-center text-2xl font-bold text-primary overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Foto de perfil em breve (upload na próxima fase).
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome completo</Label>
                  <Input
                    value={profile.full_name ?? ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={profile.email ?? ""} disabled />
                </div>
                <div>
                  <Label>Cargo / Função</Label>
                  <Input
                    value={profile.cargo ?? ""}
                    onChange={(e) => setProfile({ ...profile, cargo: e.target.value })}
                    placeholder="Ex: Consultor de viagens"
                  />
                </div>
                <div>
                  <Label>Cadastrado em</Label>
                  <Input value={createdAt} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Tema</Label>
                <Select
                  value={profile.tema ?? "auto"}
                  onValueChange={(v) => setProfile({ ...profile, tema: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Idioma</Label>
                <Select
                  value={profile.idioma ?? "pt-BR"}
                  onValueChange={(v) => setProfile({ ...profile, idioma: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  </SelectContent>

                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nova senha</Label>
                  <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                </div>
                <div>
                  <Label>Confirmar nova senha</Label>
                  <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleChangePassword} disabled={savingPass}>
                  {savingPass ? "Alterando..." : "Alterar senha"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
