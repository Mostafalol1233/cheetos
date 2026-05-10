import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/queryClient";

interface Announcement {
  id: number;
  title: string;
  message: string;
  html_content: string | null;
  bg_color: string;
  text_color: string;
  icon: string;
  is_active: boolean;
  dismissible: boolean;
  created_at: number;
}

const PRESET_COLORS = [
  { label: "Magenta", bg: "#c2185b", text: "#ffffff" },
  { label: "Purple", bg: "#7c3aed", text: "#ffffff" },
  { label: "Gold", bg: "#b8860b", text: "#ffffff" },
  { label: "Blue", bg: "#1d4ed8", text: "#ffffff" },
  { label: "Green", bg: "#15803d", text: "#ffffff" },
  { label: "Orange", bg: "#c2410c", text: "#ffffff" },
  { label: "Red", bg: "#dc2626", text: "#ffffff" },
  { label: "Teal", bg: "#0f766e", text: "#ffffff" },
  { label: "Dark", bg: "#111827", text: "#ffd700" },
  { label: "White", bg: "#f8fafc", text: "#111827" },
];

const PRESET_ICONS = ["📢", "🎉", "🔥", "⚡", "🎁", "💎", "🚀", "⚠️", "✅", "🏆", "💥", "🌟", "🎮", "🛒", "💸"];

const EMPTY_FORM = {
  title: "",
  message: "",
  html_content: "",
  bg_color: "#c2185b",
  text_color: "#ffffff",
  icon: "📢",
  is_active: true,
  dismissible: true,
};

export function AnnouncementsPanel() {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [useHtml, setUseHtml] = useState(false);
  const [preview, setPreview] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, { headers });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: "POST", headers,
        body: JSON.stringify({ ...data, html_content: useHtml ? data.html_content : null }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); qc.invalidateQueries({ queryKey: ["announcement-active"] }); resetForm(); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof EMPTY_FORM }) => {
      const res = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ ...data, html_content: useHtml ? data.html_content : null }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); qc.invalidateQueries({ queryKey: ["announcement-active"] }); resetForm(); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_BASE_URL}/api/announcements/${id}`, { method: "DELETE", headers });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); qc.invalidateQueries({ queryKey: ["announcement-active"] }); },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, ann }: { id: number; ann: Announcement }) => {
      const res = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ ...ann, is_active: !ann.is_active }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); qc.invalidateQueries({ queryKey: ["announcement-active"] }); },
  });

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setShowForm(false);
    setUseHtml(false);
    setPreview(false);
  };

  const startEdit = (ann: Announcement) => {
    setForm({
      title: ann.title || "",
      message: ann.message,
      html_content: ann.html_content || "",
      bg_color: ann.bg_color,
      text_color: ann.text_color,
      icon: ann.icon,
      is_active: ann.is_active,
      dismissible: ann.dismissible,
    });
    setUseHtml(!!ann.html_content);
    setEditing(ann.id);
    setShowForm(true);
    setPreview(false);
  };

  const handleSubmit = () => {
    if (!form.message.trim()) return;
    if (editing !== null) updateMut.mutate({ id: editing, data: form });
    else createMut.mutate(form);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-pink-500" />
            إعلانات الموقع
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            أضف إعلانات تظهر لجميع زوار الموقع في شريط أعلى الصفحة
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4" />
            إعلان جديد
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-pink-500/30 bg-card">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">
                {editing !== null ? "تعديل الإعلان" : "إعلان جديد"}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>

            {/* Preview bar */}
            {preview && (
              <div
                className="w-full rounded-lg px-4 py-3 flex items-center gap-3 relative overflow-hidden"
                style={{ backgroundColor: form.bg_color, color: form.text_color }}
              >
                <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)" }} />
                <span className="text-xl">{form.icon}</span>
                <div className="flex-1 min-w-0">
                  {form.title && <span className="font-black text-sm uppercase tracking-wide ml-2">{form.title}</span>}
                  {form.html_content && useHtml ? (
                    <span className="text-sm font-medium ml-2" dangerouslySetInnerHTML={{ __html: form.html_content }} />
                  ) : (
                    <span className="text-sm font-medium ml-2">{form.message}</span>
                  )}
                </div>
                <div className="rounded-full p-1 opacity-70" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                  <X className="w-3.5 h-3.5" style={{ color: form.text_color }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Icon picker */}
              <div className="space-y-2">
                <Label>أيقونة الإعلان</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-all ${form.icon === ic ? "border-pink-500 bg-pink-500/10 scale-110" : "border-border hover:border-pink-500/40"}`}
                    >
                      {ic}
                    </button>
                  ))}
                  <Input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    className="w-16 text-center"
                    maxLength={4}
                    placeholder="أو اكتب"
                  />
                </div>
              </div>

              {/* Color presets */}
              <div className="space-y-2">
                <Label>لون الخلفية</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.bg}
                      title={c.label}
                      onClick={() => setForm(f => ({ ...f, bg_color: c.bg, text_color: c.text }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.bg_color === c.bg ? "border-white scale-125 shadow-lg" : "border-transparent hover:scale-110"}`}
                      style={{ backgroundColor: c.bg }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <div>
                    <Label className="text-xs text-muted-foreground">خلفية مخصصة</Label>
                    <input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="block w-10 h-8 rounded cursor-pointer border border-border bg-transparent" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">لون النص</Label>
                    <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="block w-10 h-8 rounded cursor-pointer border border-border bg-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>العنوان (اختياري)</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="مثال: عرض محدود الوقت!"
                dir="auto"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{useHtml ? "محتوى HTML" : "نص الإعلان"} *</Label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">HTML</span>
                  <Switch checked={useHtml} onCheckedChange={setUseHtml} />
                </div>
              </div>
              {useHtml ? (
                <Textarea
                  value={form.html_content}
                  onChange={e => setForm(f => ({ ...f, html_content: e.target.value }))}
                  placeholder='مثال: متاح كود شحن كروس فاير 🔥 <a href="/game/crossfire">اشتري الآن</a>'
                  className="font-mono text-sm"
                  rows={4}
                  dir="auto"
                />
              ) : (
                <Textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="مثال: متاح كود شحن كروس فاير — مسابقات ٥٠ الف!"
                  rows={3}
                  dir="auto"
                />
              )}
              {useHtml && (
                <p className="text-xs text-muted-foreground">يدعم HTML كامل: روابط، تنسيق، صور صغيرة...</p>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} id="is-active" />
                <Label htmlFor="is-active">نشر الإعلان الآن</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.dismissible} onCheckedChange={v => setForm(f => ({ ...f, dismissible: v }))} id="dismissible" />
                <Label htmlFor="dismissible">قابل للإخفاء من المستخدم</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={!form.message.trim() || createMut.isPending || updateMut.isPending}
                className="bg-pink-600 hover:bg-pink-700 text-white gap-2"
              >
                <Megaphone className="w-4 h-4" />
                {editing !== null ? "حفظ التعديلات" : "نشر الإعلان"}
              </Button>
              <Button variant="outline" onClick={() => setPreview(p => !p)} className="gap-2">
                {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {preview ? "إخفاء المعاينة" : "معاينة"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-25" />
            <p className="font-medium">لا توجد إعلانات بعد</p>
            <p className="text-sm mt-1">اضغط "إعلان جديد" لإنشاء أول إعلان للموقع</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card key={ann.id} className={`border-border/40 transition-all ${ann.is_active ? "border-l-4" : "opacity-60"}`} style={ann.is_active ? { borderLeftColor: ann.bg_color } : {}}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Preview swatch */}
                  <div
                    className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner"
                    style={{ backgroundColor: ann.bg_color }}
                  >
                    {ann.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.title && <span className="font-bold text-foreground">{ann.title}</span>}
                      <Badge variant={ann.is_active ? "default" : "secondary"} className={ann.is_active ? "bg-green-600 text-white text-xs" : "text-xs"}>
                        {ann.is_active ? "✓ نشط" : "متوقف"}
                      </Badge>
                      {ann.html_content && <Badge variant="outline" className="text-xs">HTML</Badge>}
                      <span className="text-xs text-muted-foreground">{formatDate(ann.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ann.html_content
                        ? ann.html_content.replace(/<[^>]+>/g, "")
                        : ann.message}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={ann.is_active ? "إيقاف" : "تفعيل"}
                      onClick={() => toggleMut.mutate({ id: ann.id, ann })}
                      className={ann.is_active ? "text-green-500 hover:text-green-400" : "text-muted-foreground hover:text-green-500"}
                    >
                      {ann.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(ann)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("حذف هذا الإعلان؟")) deleteMut.mutate(ann.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mini preview strip */}
                <div
                  className="mt-3 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 overflow-hidden relative"
                  style={{ backgroundColor: ann.bg_color, color: ann.text_color }}
                >
                  <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)" }} />
                  <span>{ann.icon}</span>
                  {ann.title && <span className="font-black uppercase tracking-wide">{ann.title}</span>}
                  {ann.html_content
                    ? <span dangerouslySetInnerHTML={{ __html: ann.html_content }} />
                    : <span>{ann.message}</span>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
