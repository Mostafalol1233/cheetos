import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/translation";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "wouter";

interface ChatItem {
  id: string;
  sender: string;
  message: string;
  sessionId: string;
  timestamp: number;
}

export default function UserDashboardPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userAccessToken") || "";
      const res = await fetch(`${API_BASE_URL}/api/user/chat-history?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load history");
      setItems(data.messages || []);
      setPage(data.page || p);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const filtered = items.filter((i) =>
    q ? i.message.toLowerCase().includes(q.toLowerCase()) || i.sessionId.toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-darker-bg via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-gold-primary transition-colors mb-4">
            {t("back_to_home")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{t("your_chat_history")}</h1>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder={`${t("search")}...`} value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <Button variant="secondary" onClick={() => load(page)} disabled={loading}>
            {t("refresh")}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <Card key={i.id} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{new Date(i.timestamp).toLocaleString()}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-card text-foreground">{i.sender}</span>
                </div>
                <div className="text-sm text-foreground">{i.message}</div>
                <div className="text-xs text-muted-foreground mt-2">{i.sessionId}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
            {t("prev")}
          </Button>
          <span className="text-sm text-muted-foreground">{t("page")} {page}</span>
          <Button variant="secondary" disabled={loading || items.length < 20} onClick={() => load(page + 1)}>
            {t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
