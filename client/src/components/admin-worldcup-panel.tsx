import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, API_BASE_URL } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  round: string;
}

interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  home_score_pred: number;
  away_score_pred: number;
  is_correct: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_status: string;
  match_date: string;
  round: string;
}

interface Settings {
  title: string;
  subtitle: string;
  video_url: string;
  prize_description: string;
  is_active: boolean;
}

const apiPath = (path: string) => `${API_BASE_URL}${path}`;
const adminHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function formatMatchDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("ar-EG");
  } catch { return dateStr; }
}

function openWhatsApp(phone: string, userName: string) {
  const cleaned = phone?.replace(/\D/g, "");
  if (!cleaned) return;
  const withCode = cleaned.startsWith("0") ? "2" + cleaned : cleaned;
  const msg = encodeURIComponent(`مبروك ${userName}! 🎉\n\nنتهنأك بفوزك في مسابقة توقع نتائج كأس العالم 2026 في متجر ضياء.\n\nسيتم إرسال كودك مباشرة إليك هنا. شكراً على مشاركتك!`);
  window.open(`https://wa.me/${withCode}?text=${msg}`, "_blank");
}

function SettingsPanel() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/worldcup/settings"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/worldcup/settings"), { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [form, setForm] = useState<Partial<Settings>>({});

  const mutation = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await fetch(apiPath("/api/worldcup/admin/settings"), {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/settings"] });
      toast({ title: "تم الحفظ", description: "تم تحديث الإعدادات بنجاح" });
      setForm({});
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiPath("/api/worldcup/admin/sync"), {
        method: "POST",
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches/admin"] });
      toast({ title: "تمت المزامنة", description: data.message });
    },
    onError: (err: any) => toast({ title: "خطأ في المزامنة", description: err.message, variant: "destructive" }),
  });

  const refreshScoresMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiPath("/api/worldcup/admin/refresh-scores"), {
        method: "POST",
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches/admin"] });
      toast({ title: "تم التحديث", description: data.message });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="text-white/40 text-sm">جارٍ التحميل...</div>;

  const merged = { ...settings, ...form } as Settings;

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-yellow-500/20">
        <CardHeader><CardTitle className="text-sm text-white/80">إعدادات صفحة كأس العالم</CardTitle></CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>العنوان الرئيسي</Label>
              <Input value={merged.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-background border-white/10 text-white" />
            </div>
            <div className="space-y-1">
              <Label>العنوان الفرعي</Label>
              <Input value={merged.subtitle || ""} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="bg-background border-white/10 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>رابط الفيديو (YouTube)</Label>
            <Input value={merged.video_url || ""} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..." className="bg-background border-white/10 text-white" dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>نص الجائزة / البطاقة المقدَّمة</Label>
            <p className="text-[11px] text-white/40 mb-1">مثال: اربح كود كروس فاير — أو بطاقة فري فاير — أو شحن PUBG. هذا النص يظهر كإعلان في أعلى صفحة كأس العالم.</p>
            <Textarea
              value={merged.prize_description || ""}
              onChange={e => setForm(f => ({ ...f, prize_description: e.target.value }))}
              className="bg-background border-white/10 text-white min-h-[80px] resize-none"
              placeholder="مثال: توقع صحيح = كود كروس فاير مجاناً 🎮"
              dir="auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label>تفعيل الصفحة</Label>
            <Select
              value={String(merged.is_active ?? true)}
              onValueChange={v => setForm(f => ({ ...f, is_active: v === "true" }))}
            >
              <SelectTrigger className="w-32 bg-background border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">مفعّل</SelectItem>
                <SelectItem value="false">معطّل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || Object.keys(form).length === 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              {mutation.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
            </Button>
            <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
              {syncMutation.isPending ? "جارٍ المزامنة..." : "⚡ مزامنة كاملة من API"}
            </Button>
            <Button variant="outline" onClick={() => refreshScoresMutation.mutate()} disabled={refreshScoresMutation.isPending}
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
              {refreshScoresMutation.isPending ? "جارٍ التحديث..." : "🔄 تحديث النتائج الحية"}
            </Button>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-lg p-3 space-y-1" dir="rtl">
            <p className="text-xs text-white/50 font-semibold">ملاحظات API:</p>
            <p className="text-xs text-white/30">• أضف <code className="text-yellow-400/80">FOOTBALL_API_KEY</code> في متغيرات البيئة (api-football.com v3)</p>
            <p className="text-xs text-white/30">• "مزامنة كاملة" تستهلك طلباً واحداً — استخدمها لجلب كل مباريات البطولة</p>
            <p className="text-xs text-white/30">• "تحديث النتائج الحية" يحدّث المباريات غير المنتهية فقط — استخدمه أثناء المباريات</p>
            <p className="text-xs text-white/30">• حدك اليومي 100 طلب — لا تحديث تلقائي حفاظاً على رصيدك</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MatchesPanel() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [newMatch, setNewMatch] = useState({ home_team: "", away_team: "", home_flag: "", away_flag: "", match_date: "", round: "" });
  const [scoreForm, setScoreForm] = useState<{ home_score: string; away_score: string; status: string }>({ home_score: "", away_score: "", status: "finished" });

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/worldcup/matches/admin"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/worldcup/admin/matches"), { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newMatch) => {
      const res = await fetch(apiPath("/api/worldcup/admin/matches"), {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches"] });
      toast({ title: "تمت الإضافة" });
      setShowAddDialog(false);
      setNewMatch({ home_team: "", away_team: "", home_flag: "", away_flag: "", match_date: "", round: "" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(apiPath(`/api/worldcup/admin/matches/${id}`), {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches"] });
      toast({ title: "تم التحديث" });
      setEditMatch(null);
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiPath(`/api/worldcup/admin/matches/${id}`), {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/matches"] });
      toast({ title: "تم الحذف" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const openEdit = (match: Match) => {
    setEditMatch(match);
    setScoreForm({
      home_score: match.home_score !== null ? String(match.home_score) : "",
      away_score: match.away_score !== null ? String(match.away_score) : "",
      status: match.status,
    });
  };

  const statusLabel: Record<string, string> = {
    upcoming: "قادمة",
    live: "مباشر",
    finished: "منتهية",
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-white">المباريات ({matches.length})</h3>
        <Button onClick={() => setShowAddDialog(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-semibold" data-testid="btn-add-match">
          إضافة مباراة
        </Button>
      </div>

      {isLoading ? (
        <div className="text-white/40 text-sm">جارٍ التحميل...</div>
      ) : matches.length === 0 ? (
        <div className="text-white/30 text-sm text-center py-10">لا توجد مباريات بعد</div>
      ) : (
        <div className="space-y-2">
          {matches.map(match => (
            <div key={match.id} className="bg-card/50 border border-white/8 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">
                  {match.home_flag} {match.home_team} vs {match.away_team} {match.away_flag}
                </div>
                <div className="text-white/30 text-xs mt-0.5 flex gap-3">
                  <span>{formatMatchDate(match.match_date)}</span>
                  {match.round && <span>{match.round}</span>}
                  <span className={`font-medium ${match.status === "live" ? "text-red-400" : match.status === "finished" ? "text-white/30" : "text-yellow-400/70"}`}>
                    {statusLabel[match.status] || match.status}
                  </span>
                  {match.status === "finished" && match.home_score !== null && (
                    <span className="text-[#c9a84c]/60">{match.home_score} – {match.away_score}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(match)}
                  className="border-white/15 text-white hover:bg-white/5 text-xs h-8">
                  تعديل
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(match.id)}
                  disabled={deleteMutation.isPending}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8">
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#111] border-white/10 text-white" dir="rtl">
          <DialogHeader><DialogTitle>إضافة مباراة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الفريق الأول</Label>
                <Input value={newMatch.home_team} onChange={e => setNewMatch(f => ({ ...f, home_team: e.target.value }))}
                  className="bg-background border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <Label>الفريق الثاني</Label>
                <Input value={newMatch.away_team} onChange={e => setNewMatch(f => ({ ...f, away_team: e.target.value }))}
                  className="bg-background border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>علم الفريق الأول (emoji)</Label>
                <Input value={newMatch.home_flag} onChange={e => setNewMatch(f => ({ ...f, home_flag: e.target.value }))}
                  placeholder="🇧🇷" className="bg-background border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <Label>علم الفريق الثاني (emoji)</Label>
                <Input value={newMatch.away_flag} onChange={e => setNewMatch(f => ({ ...f, away_flag: e.target.value }))}
                  placeholder="🇦🇷" className="bg-background border-white/10 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>تاريخ ووقت المباراة</Label>
              <Input type="datetime-local" value={newMatch.match_date} onChange={e => setNewMatch(f => ({ ...f, match_date: e.target.value }))}
                className="bg-background border-white/10 text-white" />
            </div>
            <div className="space-y-1">
              <Label>الدور / المجموعة</Label>
              <Input value={newMatch.round} onChange={e => setNewMatch(f => ({ ...f, round: e.target.value }))}
                placeholder="دور المجموعات · المجموعة أ" className="bg-background border-white/10 text-white" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-white/15 text-white">إلغاء</Button>
            <Button onClick={() => addMutation.mutate(newMatch)} disabled={addMutation.isPending || !newMatch.home_team || !newMatch.away_team}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              {addMutation.isPending ? "جارٍ الإضافة..." : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editMatch && (
        <Dialog open={!!editMatch} onOpenChange={() => setEditMatch(null)}>
          <DialogContent className="bg-[#111] border-white/10 text-white" dir="rtl">
            <DialogHeader><DialogTitle>تعديل المباراة — {editMatch.home_team} vs {editMatch.away_team}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>الحالة</Label>
                <Select value={scoreForm.status} onValueChange={v => setScoreForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-background border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">قادمة</SelectItem>
                    <SelectItem value="live">مباشر</SelectItem>
                    <SelectItem value="finished">منتهية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scoreForm.status === "finished" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>نتيجة {editMatch.home_team}</Label>
                    <Input type="number" min="0" max="20" value={scoreForm.home_score}
                      onChange={e => setScoreForm(f => ({ ...f, home_score: e.target.value }))}
                      className="bg-background border-white/10 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label>نتيجة {editMatch.away_team}</Label>
                    <Input type="number" min="0" max="20" value={scoreForm.away_score}
                      onChange={e => setScoreForm(f => ({ ...f, away_score: e.target.value }))}
                      className="bg-background border-white/10 text-white" />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditMatch(null)} className="border-white/15 text-white">إلغاء</Button>
              <Button
                onClick={() => updateMutation.mutate({
                  id: editMatch.id,
                  data: {
                    status: scoreForm.status,
                    home_score: scoreForm.home_score !== "" ? parseInt(scoreForm.home_score) : null,
                    away_score: scoreForm.away_score !== "" ? parseInt(scoreForm.away_score) : null,
                  }
                })}
                disabled={updateMutation.isPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PredictionsPanel() {
  const { toast } = useToast();
  const [filterMatch, setFilterMatch] = useState<string>("all");
  const [filterCorrect, setFilterCorrect] = useState<string>("all");

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/worldcup/matches/admin"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/worldcup/admin/matches"), { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: predictions = [], isLoading } = useQuery<Prediction[]>({
    queryKey: ["/api/worldcup/admin/predictions", filterMatch],
    queryFn: async () => {
      const url = filterMatch !== "all"
        ? apiPath(`/api/worldcup/admin/predictions?match_id=${filterMatch}`)
        : apiPath("/api/worldcup/admin/predictions");
      const res = await fetch(url, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const filtered = predictions.filter(p => {
    if (filterCorrect === "correct") return p.is_correct;
    if (filterCorrect === "incorrect") return !p.is_correct;
    return true;
  });

  const correctCount = predictions.filter(p => p.is_correct).length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterMatch} onValueChange={setFilterMatch}>
            <SelectTrigger className="w-48 bg-background border-white/10 text-white text-sm">
              <SelectValue placeholder="كل المباريات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المباريات</SelectItem>
              {matches.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.home_team} vs {m.away_team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCorrect} onValueChange={setFilterCorrect}>
            <SelectTrigger className="w-36 bg-background border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التوقعات</SelectItem>
              <SelectItem value="correct">الصحيحة فقط</SelectItem>
              <SelectItem value="incorrect">الخاطئة فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-white/40">
          {filtered.length} توقع · {correctCount} صحيح
        </div>
      </div>

      {isLoading ? (
        <div className="text-white/40 text-sm py-8 text-center">جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/30 text-sm text-center py-10">لا توجد توقعات</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pred => (
            <div
              key={pred.id}
              className={`border rounded-lg p-4 flex items-center justify-between gap-4 ${
                pred.is_correct ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card/50 border-white/8"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium text-sm">{pred.user_name}</span>
                  {pred.is_correct && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">اصاب</span>
                  )}
                </div>
                <div className="text-white/30 text-xs mt-0.5">{pred.user_email}</div>
                <div className="text-white/50 text-xs mt-1">
                  <span className="text-white/60 font-medium">{pred.home_team} vs {pred.away_team}</span>
                  {" · "}
                  <span>توقع: {pred.home_score_pred} – {pred.away_score_pred}</span>
                  {pred.match_status === "finished" && pred.home_score !== null && (
                    <span className="text-white/30"> · النتيجة الفعلية: {pred.home_score} – {pred.away_score}</span>
                  )}
                </div>
                <div className="text-white/20 text-xs mt-0.5">{formatMatchDate(pred.created_at)}</div>
              </div>
              {pred.user_phone && (
                <Button
                  size="sm"
                  onClick={() => openWhatsApp(pred.user_phone, pred.user_name)}
                  className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"
                  data-testid={`btn-whatsapp-${pred.id}`}
                >
                  واتساب
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorldCupAdminPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">كأس العالم 2026 — لوحة التحكم</h2>
        <a
          href="/world-cup"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-yellow-400/70 hover:text-yellow-400 underline underline-offset-2"
        >
          عرض الصفحة
        </a>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="bg-transparent gap-1 h-auto p-0 mb-6 flex justify-start border-b border-white/10 pb-0 rounded-none w-full">
          <TabsTrigger value="predictions" className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-400 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 border-b-2 border-transparent rounded-none px-4 py-2 text-sm text-white/50 hover:text-white/70">
            التوقعات
          </TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-400 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 border-b-2 border-transparent rounded-none px-4 py-2 text-sm text-white/50 hover:text-white/70">
            المباريات
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-400 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 border-b-2 border-transparent rounded-none px-4 py-2 text-sm text-white/50 hover:text-white/70">
            الإعدادات
          </TabsTrigger>
        </TabsList>
        <TabsContent value="predictions"><PredictionsPanel /></TabsContent>
        <TabsContent value="matches"><MatchesPanel /></TabsContent>
        <TabsContent value="settings"><SettingsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
