import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getParam(name: string) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name) || "";
}

export default function QrConfirmPage() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sid = getParam("sid");
    const token = getParam("token");
    const confirm = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/qr/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sid, token }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Error");
        }
        setOk(true);
      } catch (e: any) {
        setError(e?.message || "Failed");
      }
    };
    if (sid && token) confirm();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-darker-bg via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gold-primary/30">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-gold-primary">Confirm Login</CardTitle>
          <CardDescription>Approve desktop login by scanning</CardDescription>
        </CardHeader>
        <CardContent>
          {ok ? (
            <div className="space-y-4">
              <p className="text-sm">Approved. You can return to your desktop.</p>
              <Button onClick={() => window.location.href = "/"} className="w-full bg-gold-primary text-background">Go Home</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {error ? <p className="text-sm text-red-400">{error}</p> : <p className="text-sm">Processing...</p>}
              <Button onClick={() => window.location.href = "/"} className="w-full">Home</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

