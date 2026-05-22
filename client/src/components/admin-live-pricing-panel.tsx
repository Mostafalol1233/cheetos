import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  TrendingUp, RefreshCw, Zap, RotateCcw, DollarSign,
  ChevronDown, ChevronUp, Minus, Plus, Info, AlertTriangle
} from "lucide-react";

interface LivePricingSettings {
  enabled: boolean;
  usdEgpRate: number;
  globalDiscountEgp: number;
  globalChargeEgp: number;
  lastRateUpdate: string | null;
  lastApplied: string | null;
}

interface PkgRow {
  id: number;
  gameId: string;
  gameName: string;
  name: string;
  priceEgp: number;
  discountPrice: number | null;
  priceUsd: number | null;
  originalPriceEgp: number | null;
  calculatedEgp: number | null;
  bonus: string | null;
  gameCharge: number;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ar-EG', { hour12: false });
}

export function AdminLivePricingPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [discountInput, setDiscountInput] = useState('');
  const [chargeInput, setChargeInput] = useState('');
  const [editingUsd, setEditingUsd] = useState<Record<number, string>>({});
  const [editingGameCharge, setEditingGameCharge] = useState<Record<string, string>>({});
  const [filterHasUsd, setFilterHasUsd] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());

  const { data: settings, isLoading: settingsLoading } = useQuery<LivePricingSettings>({
    queryKey: ['/api/admin/live-pricing/settings'],
    queryFn: () => apiRequest('GET', '/api/admin/live-pricing/settings').then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: pkgData, isLoading: pkgLoading } = useQuery<{ packages: PkgRow[]; settings: any }>({
    queryKey: ['/api/admin/live-pricing/packages'],
    queryFn: () => apiRequest('GET', '/api/admin/live-pricing/packages').then(r => r.json()),
  });

  useEffect(() => {
    if (settings) {
      setDiscountInput(String(settings.globalDiscountEgp ?? 0));
      setChargeInput(String(settings.globalChargeEgp ?? 0));
    }
  }, [settings]);

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['/api/admin/live-pricing/settings'] });
    qc.invalidateQueries({ queryKey: ['/api/admin/live-pricing/packages'] });
  }, [qc]);

  const fetchRateMut = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/live-pricing/fetch-rate').then(r => r.json()),
    onSuccess: (data) => {
      invalidateAll();
      toast({
        title: data.bigChange ? '⚠️ تغيير كبير في السعر' : '✅ تم جلب سعر الصرف',
        description: data.message,
        variant: data.bigChange ? 'destructive' : 'default',
      });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const updateSettingsMut = useMutation({
    mutationFn: (body: any) => apiRequest('PUT', '/api/admin/live-pricing/settings', body).then(r => r.json()),
    onSuccess: () => { invalidateAll(); toast({ title: 'تم الحفظ' }); },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const applyMut = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/live-pricing/apply').then(r => r.json()),
    onSuccess: (data) => {
      invalidateAll();
      qc.invalidateQueries({ queryKey: ['/api/games'] });
      toast({ title: '✅ تم تطبيق الأسعار', description: data.message });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const resetMut = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/live-pricing/reset').then(r => r.json()),
    onSuccess: (data) => {
      invalidateAll();
      qc.invalidateQueries({ queryKey: ['/api/games'] });
      toast({ title: '🔄 إعادة تعيين', description: data.message });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const updatePkgUsdMut = useMutation({
    mutationFn: ({ id, priceUsd }: { id: number; priceUsd: number | null }) =>
      apiRequest('PUT', `/api/admin/live-pricing/package/${id}`, { priceUsd }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/live-pricing/packages'] }),
    onError: (e: any) => toast({ title: 'خطأ في الحفظ', description: e.message, variant: 'destructive' }),
  });

  const updateGameChargeMut = useMutation({
    mutationFn: ({ gameId, chargeEgp }: { gameId: string; chargeEgp: number }) =>
      apiRequest('PUT', `/api/admin/live-pricing/game/${gameId}/charge`, { chargeEgp }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/live-pricing/packages'] }),
    onError: (e: any) => toast({ title: 'خطأ في الحفظ', description: e.message, variant: 'destructive' }),
  });

  const handleSaveGlobals = () => {
    const disc = parseFloat(discountInput) || 0;
    const charge = parseFloat(chargeInput) || 0;
    updateSettingsMut.mutate({ globalDiscountEgp: disc, globalChargeEgp: charge });
  };

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      resetMut.mutate();
    } else {
      updateSettingsMut.mutate({ enabled: true });
    }
  };

  const handleUsdBlur = (pkgId: number) => {
    const raw = editingUsd[pkgId];
    if (raw === undefined) return;
    const val = raw === '' ? null : parseFloat(raw);
    updatePkgUsdMut.mutate({ id: pkgId, priceUsd: val });
  };

  const handleGameChargeBlur = (gameId: string, currentCharge: number) => {
    const raw = editingGameCharge[gameId];
    if (raw === undefined) return;
    const val = raw === '' ? 0 : parseFloat(raw) || 0;
    if (val === currentCharge) return;
    updateGameChargeMut.mutate({ gameId, chargeEgp: val });
  };

  const packages = pkgData?.packages ?? [];
  const filtered = packages.filter(p => {
    if (filterHasUsd && !p.priceUsd) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.gameName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, PkgRow[]>>((acc, p) => {
    const key = p.gameName || p.gameId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Build a gameId→gameCharge map from packages for the game header row
  const gameChargeMap = packages.reduce<Record<string, { gameId: string; charge: number }>>((acc, p) => {
    if (!acc[p.gameName || p.gameId]) acc[p.gameName || p.gameId] = { gameId: p.gameId, charge: p.gameCharge };
    return acc;
  }, {});

  const toggleGame = (name: string) => {
    setExpandedGames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const countWithUsd = packages.filter(p => p.priceUsd).length;
  const countTotal = packages.length;
  const rate = settings?.usdEgpRate ?? 0;
  const discount = settings?.globalDiscountEgp ?? 0;
  const globalCharge = settings?.globalChargeEgp ?? 0;
  const isEnabled = settings?.enabled ?? false;

  if (settingsLoading) {
    return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-green-400" />
            الأسعار التلقائية (لايف)
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            ربط أسعار الباقات بسعر الدولار مقابل الجنيه المصري تلقائياً
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="live-toggle" className={`text-sm font-semibold ${isEnabled ? 'text-green-400' : 'text-gray-400'}`}>
            {isEnabled ? '🟢 مفعّل' : '⚫ معطّل'}
          </Label>
          <Switch
            id="live-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={resetMut.isPending || updateSettingsMut.isPending}
          />
        </div>
      </div>

      {/* Status Banner */}
      {isEnabled && (
        <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-3 flex items-center gap-3 text-sm text-green-300">
          <Zap className="w-4 h-4 shrink-0" />
          الأسعار التلقائية مفعّلة — أي تطبيق جديد سيحدث أسعار العملاء مباشرة
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">سعر الصرف الحالي</div>
            <div className="text-2xl font-bold text-yellow-400">
              {rate > 0 ? `${rate}` : '—'}
            </div>
            <div className="text-xs text-gray-500">1 USD = ? EGP</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">الخصم العالمي</div>
            <div className="text-2xl font-bold text-blue-400">{discount} EGP</div>
            <div className="text-xs text-gray-500">يُطرح من كل باقة</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">الزيادة العالمية</div>
            <div className="text-2xl font-bold text-orange-400">{globalCharge} EGP</div>
            <div className="text-xs text-gray-500">يُضاف لكل باقة</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">آخر تطبيق</div>
            <div className="text-sm font-semibold text-white leading-tight">
              {settings?.lastApplied ? formatDate(settings.lastApplied) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls — 3 columns */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Exchange Rate Card */}
        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              سعر الصرف USD / EGP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-black/30 rounded p-3 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {rate > 0 ? `${rate} EGP` : 'لم يُجلب بعد'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                آخر تحديث: {formatDate(settings?.lastRateUpdate ?? null)}
              </div>
            </div>
            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              onClick={() => fetchRateMut.mutate()}
              disabled={fetchRateMut.isPending}
            >
              {fetchRateMut.isPending ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> جاري الجلب...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> جلب السعر الحالي</>
              )}
            </Button>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              يُنصح بالجلب يومياً. إذا تغيّر السعر أكثر من 5% سيظهر تنبيه فوري.
            </p>
          </CardContent>
        </Card>

        {/* Global Discount + Charge Card */}
        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Minus className="w-4 h-4 text-blue-400" />
              <Plus className="w-4 h-4 text-orange-400" />
              الخصم والزيادة العالمية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-blue-300 mb-1 flex items-center gap-1">
                <Minus className="w-3 h-3" /> خصم عالمي (يُطرح من كل باقة)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white text-center font-bold"
                  placeholder="0"
                />
                <span className="flex items-center text-gray-300 font-semibold text-sm px-1">EGP</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-orange-300 mb-1 flex items-center gap-1">
                <Plus className="w-3 h-3" /> زيادة عالمية (تُضاف لكل باقة)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={chargeInput}
                  onChange={e => setChargeInput(e.target.value)}
                  className="bg-gray-900 border-orange-700 text-white text-center font-bold"
                  placeholder="0"
                />
                <span className="flex items-center text-gray-300 font-semibold text-sm px-1">EGP</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10"
              onClick={handleSaveGlobals}
              disabled={updateSettingsMut.isPending}
            >
              حفظ الخصم والزيادة
            </Button>
          </CardContent>
        </Card>

        {/* Apply / Reset Card */}
        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              تطبيق الأسعار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-black/20 rounded p-3 text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">معادلة السعر:</p>
              <p className="font-mono text-green-300 text-center mt-1">
                (USD × سعر الصرف) − خصم + زيادة عامة + زيادة اللعبة
              </p>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={() => applyMut.mutate()}
              disabled={applyMut.isPending || rate <= 0}
            >
              {applyMut.isPending ? (
                <><Zap className="w-4 h-4 mr-2 animate-pulse" /> جاري التطبيق...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> تطبيق الأسعار على جميع الباقات</>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                if (confirm('هل تريد إعادة تعيين جميع الأسعار للقيم الأصلية؟')) resetMut.mutate();
              }}
              disabled={resetMut.isPending}
            >
              {resetMut.isPending ? (
                <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> جاري الاسترجاع...</>
              ) : (
                <><RotateCcw className="w-4 h-4 mr-2" /> إعادة تعيين للأسعار الأصلية</>
              )}
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Packages Table */}
      <Card className="bg-gray-800/60 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base text-white">
              جدول الباقات ({filtered.length})
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="بحث..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white h-8 w-40 text-sm"
              />
              <Button
                size="sm"
                variant={filterHasUsd ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => setFilterHasUsd(v => !v)}
              >
                {filterHasUsd ? 'كل الباقات' : 'لديها USD فقط'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setExpandedGames(new Set(Object.keys(grouped)))}
              >
                فتح الكل
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pkgLoading ? (
            <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="p-8 text-center text-gray-400">لا توجد باقات</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {Object.entries(grouped).map(([gameName, pkgs]) => {
                const isOpen = expandedGames.has(gameName);
                const hasUsdCount = pkgs.filter(p => p.priceUsd).length;
                const gameInfo = gameChargeMap[gameName];
                const gameId = gameInfo?.gameId ?? pkgs[0]?.gameId;
                const currentGameCharge = gameInfo?.charge ?? 0;
                const gameChargeDisplay = editingGameCharge[gameId] !== undefined
                  ? editingGameCharge[gameId]
                  : String(currentGameCharge || '');

                return (
                  <div key={gameName}>
                    {/* Game row header */}
                    <div className="flex items-center px-4 py-3 hover:bg-gray-700/30 transition-colors gap-3">
                      <button
                        onClick={() => toggleGame(gameName)}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        <span className="font-semibold text-white text-sm truncate">{gameName}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {pkgs.length} باقة
                        </Badge>
                        {hasUsdCount > 0 && (
                          <Badge className="text-xs bg-green-700/40 text-green-300 border-green-600 shrink-0">
                            {hasUsdCount} بـ USD
                          </Badge>
                        )}
                      </button>

                      {/* Per-game charge input */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <Plus className="w-3 h-3 text-orange-400" />
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          title="زيادة خاصة بهذه اللعبة (EGP)"
                          value={gameChargeDisplay}
                          onChange={e => setEditingGameCharge(prev => ({ ...prev, [gameId]: e.target.value }))}
                          onBlur={() => handleGameChargeBlur(gameId, currentGameCharge)}
                          className="h-7 w-20 text-xs text-center bg-gray-900 border-orange-700/50 text-orange-300 focus:border-orange-500"
                        />
                        <span className="text-xs text-gray-500">EGP</span>
                      </div>
                    </div>

                    {/* Package rows */}
                    {isOpen && (
                      <div className="bg-gray-900/30">
                        {/* Column headers */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-500 border-b border-gray-700/50">
                          <div className="col-span-4">اسم الباقة</div>
                          <div className="col-span-2 text-center">سعر الدولار</div>
                          <div className="col-span-2 text-center">السعر المحسوب</div>
                          <div className="col-span-2 text-center">السعر الحالي</div>
                          <div className="col-span-2 text-center">الأصلي</div>
                        </div>
                        {pkgs.map(pkg => {
                          const usdVal = editingUsd[pkg.id] !== undefined ? editingUsd[pkg.id] : String(pkg.priceUsd ?? '');
                          const usdNum = parseFloat(usdVal) || 0;
                          const gameChargeForPreview = editingGameCharge[pkg.gameId] !== undefined
                            ? parseFloat(editingGameCharge[pkg.gameId]) || 0
                            : pkg.gameCharge;
                          const previewCalc = usdNum > 0 && rate > 0
                            ? Math.max(1, usdNum * rate - discount + globalCharge + gameChargeForPreview).toFixed(2)
                            : null;

                          return (
                            <div key={pkg.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center hover:bg-gray-800/30 border-b border-gray-800/30 last:border-0">
                              <div className="col-span-4">
                                <div className="text-sm text-white">{pkg.name}</div>
                                {pkg.bonus && <div className="text-xs text-yellow-400">{pkg.bonus}</div>}
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="USD"
                                  value={usdVal}
                                  onChange={e => setEditingUsd(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                                  onBlur={() => handleUsdBlur(pkg.id)}
                                  className="h-7 text-xs text-center bg-gray-900 border-gray-600 text-yellow-300"
                                />
                              </div>
                              <div className="col-span-2 text-center">
                                {previewCalc ? (
                                  <span className="text-green-400 font-semibold text-sm">{previewCalc}</span>
                                ) : pkg.calculatedEgp ? (
                                  <span className="text-green-400 font-semibold text-sm">{pkg.calculatedEgp}</span>
                                ) : (
                                  <span className="text-gray-600 text-xs">—</span>
                                )}
                              </div>
                              <div className="col-span-2 text-center">
                                <span className="text-white text-sm font-semibold">{pkg.priceEgp}</span>
                                <span className="text-gray-500 text-xs ml-1">EGP</span>
                              </div>
                              <div className="col-span-2 text-center">
                                {pkg.originalPriceEgp ? (
                                  <span className="text-gray-400 text-xs">{pkg.originalPriceEgp} EGP</span>
                                ) : (
                                  <span className="text-gray-600 text-xs">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      {countWithUsd === 0 && (
        <Card className="bg-orange-900/20 border-orange-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
            <p className="text-orange-200 text-sm">
              لم تحدد سعر الدولار لأي باقة بعد. افتح الألعاب أدناه وأدخل سعر الدولار لكل باقة، ثم اضغط "تطبيق الأسعار".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
