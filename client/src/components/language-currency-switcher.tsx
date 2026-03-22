import { useTranslation } from "@/lib/translation";
import { useLocalization } from "@/lib/localization";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function LanguageCurrencySwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const { currency, setCurrency } = useLocalization();

  const currencies = [
    { code: "EGP" as const, name: "Egyptian Pound", flag: "🇪🇬" },
  ];

  const languages = [
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "ar" as const, label: "عربي", flag: "🇪🇬" },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];
  const currentCurr = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full px-3 py-1.5 h-8 text-sm font-medium border border-border/60 bg-background/80 hover:bg-accent/50 transition-all"
          >
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span>{currentLang.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("language") || "Language"}</DropdownMenuLabel>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`gap-2 ${language === lang.code ? "bg-accent" : ""}`}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full px-3 py-1.5 h-8 text-sm font-medium border border-border/60 bg-background/80 hover:bg-accent/50 transition-all"
          >
            <span className="text-base leading-none">{currentCurr.flag}</span>
            <span>{currentCurr.code}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("currency") || "Currency"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {currencies.map((curr) => (
            <DropdownMenuItem
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`gap-2 ${currency === curr.code ? "bg-accent" : ""}`}
            >
              <span className="text-base">{curr.flag}</span>
              {curr.name} ({curr.code})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
