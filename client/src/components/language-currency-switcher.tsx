import { useTranslation } from "@/lib/translation";
import { useLocalization } from "@/lib/localization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const FLAG_URLS: Record<string, string> = {
  "en": "https://flagcdn.com/w40/us.png",
  "ar": "https://flagcdn.com/w40/eg.png",
  "EGP": "https://flagcdn.com/w40/eg.png",
  "USD": "https://flagcdn.com/w40/us.png",
};

export function LanguageCurrencySwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const { currency, setCurrency } = useLocalization();

  const currencies = [
    { code: "EGP" as const, name: "Egyptian Pound", flag: "EGP" },
  ];

  const languages = [
    { code: "en" as const, label: "English", flag: "en" },
    { code: "ar" as const, label: "عربي", flag: "ar" },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];
  const currentCurr = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-white/10 hover:border-white/25 hover:bg-[#222] transition-all duration-200 text-white text-sm font-medium">
            <img
              src={FLAG_URLS[currentLang.flag]}
              alt={currentLang.label}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20"
            />
            <span className="hidden sm:inline">{currentLang.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          <DropdownMenuLabel>{t("language") || "Language"}</DropdownMenuLabel>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`gap-2 ${language === lang.code ? "bg-accent" : ""}`}
            >
              <img src={FLAG_URLS[lang.flag]} alt={lang.label} className="w-5 h-5 rounded-full object-cover" />
              {lang.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-white/10 hover:border-white/25 hover:bg-[#222] transition-all duration-200 text-white text-sm font-medium">
            <img
              src={FLAG_URLS[currentCurr.code]}
              alt={currentCurr.code}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20"
            />
            <span>{currentCurr.code}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuLabel>{t("currency") || "Currency"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {currencies.map((curr) => (
            <DropdownMenuItem
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`gap-2 ${currency === curr.code ? "bg-accent" : ""}`}
            >
              <img src={FLAG_URLS[curr.code]} alt={curr.name} className="w-5 h-5 rounded-full object-cover" />
              {curr.name} ({curr.code})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
