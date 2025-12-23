import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function QrLoginPage() {
  const [session, setSession] = useState<{ id: string; token: string; expiresAt: number } | null>(null);
  const [status, setStatus] = useState("pending");
  const [qrSrc, setQrSrc] = useState("");
  const pollRef = useRef<number | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const start = async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/qr/start`, { method: "POST" });
      const data = await res.json();
      setSession(data);
      const url = `${window.location.origin}/qr/confirm?sid=${encodeURIComponent(data.id)}&token=${encodeURIComponent(data.token)}`;
      const src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
      setQrSrc(src);
    };
    start();
  }, []);

  useEffect(() => {
    if (!session || isAuthenticated) return;
    const poll = async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/qr/status/${session.id}`);
      const data = await res.json();
      setStatus(data.status);
      if (data.status === "approved") {
        const c = await fetch(`${API_BASE_URL}/api/auth/qr/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: session.id }),
        });
        const j = await c.json();
        localStorage.setItem("adminToken", j.token);
        localStorage.setItem("userEmail", j.user.email);
        window.location.href = "/admin";
      }
    };
    pollRef.current = window.setInterval(poll, 1500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [session, isAuthenticated]);

  const openLink = () => {
    if (!session) return;
    const url = `${window.location.origin}/qr/confirm?sid=${encodeURIComponent(session.id)}&token=${encodeURIComponent(session.token)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-darker-bg via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gold-primary/30">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-gold-primary">QR Login</CardTitle>
          <CardDescription>Scan the QR with your mobile to login</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {qrSrc && (
              <img src={qrSrc} alt="QR" className="rounded-lg border border-gold-primary/30" />
            )}
            <p className="text-sm text-muted-foreground">Status: {status}</p>
            <Button onClick={openLink} className="w-full bg-gold-primary text-background">Open link on this device</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

