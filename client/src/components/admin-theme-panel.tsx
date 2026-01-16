import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings-context";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HeaderImageEditor } from "./header-image-editor";

export function AdminThemePanel() {
  const { settings, refresh } = useSettings();
  const [primaryColor, setPrimaryColor] = useState("#0066FF");
  const [accentColor, setAccentColor] = useState("#FFCC00");
  const [logoUrl, setLogoUrl] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [footerText, setFooterText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setPrimaryColor(settings.primaryColor || "#0066FF");
    setAccentColor(settings.accentColor || "#FFCC00");
    setLogoUrl(settings.logoUrl || "");
    setHeaderImageUrl(settings.headerImageUrl || "");
    setWhatsappNumber(settings.whatsappNumber || "");
    setFacebookUrl(settings.facebookUrl || "");
    setFooterText(settings.footerText || "");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/settings", {
        primaryColor,
        accentColor,
        logoUrl: logoUrl || null,
        headerImageUrl: headerImageUrl || null,
        whatsappNumber: whatsappNumber || null,
        facebookUrl: facebookUrl || null,
        footerText: footerText || null
      });
      await refresh();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme & Branding</CardTitle>
        <CardDescription>Customize store colors, branding and WhatsApp number.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded border border-border"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Header Image</Label>
          <HeaderImageEditor 
            currentImageUrl={headerImageUrl} 
            onSave={(newUrl) => setHeaderImageUrl(newUrl)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
          <Input
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+20100..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebookUrl">Facebook Messenger URL</Label>
          <Input
            id="facebookUrl"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://m.me/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footerText">Footer Text</Label>
          <Input
            id="footerText"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="Trusted by thousands of gamers..."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

