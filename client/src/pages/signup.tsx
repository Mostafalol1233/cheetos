import { useState } from "react";
import { useTranslation } from "@/lib/translation";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function SignupPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [stage, setStage] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [csrf, setCsrf] = useState("");

  const getCookie = (name: string) => {
    const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : '';
  };

  const fetchCsrf = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/csrf`);
      const j = await r.json();
      setCsrf(j.token || getCookie('csrf_token') || "");
    } catch {}
  };

  if (!csrf) fetchCsrf();

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf || getCookie('csrf_token') || "" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      toast({ title: t("success"), description: t("check_email_for_verification"), duration: 3000 });
      setStage("verify");
    } catch (err: any) {
      toast({ title: t("error"), description: err?.message || "Signup failed", duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf || getCookie('csrf_token') || "" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      toast({ title: t("success"), description: t("email_verified"), duration: 2000 });
      window.location.href = "/login";
    } catch (err: any) {
      toast({ title: t("error"), description: err?.message || "Verification failed", duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-foreground">{t("signup")}</h1>
          {stage === "register" ? (
            <form onSubmit={register} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t("name")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("email")}</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("password")}</label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-neon-pink hover:bg-neon-pink/90">
                {loading ? t("loading") : t("signup")}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t("verification_token")}</label>
                <Input value={token} onChange={(e) => setToken(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-neon-pink hover:bg-neon-pink/90">
                {loading ? t("loading") : t("verify")}
              </Button>
            </form>
          )}
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">{t("have_account")}</span>{" "}
            <Link href="/login" className="text-gold-primary hover:underline">{t("login")}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
