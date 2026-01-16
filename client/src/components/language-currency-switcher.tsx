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
import { Languages, DollarSign } from "lucide-react";

export function LanguageCurrencySwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const { currency, setCurrency, country } = useLocalization();

  const currencies = [
    { code: "EGP" as const, name: "Egyptian Pound", symbol: "جنيه" },
    { code: "USD" as const, name: "US Dollar", symbol: "$" },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Languages className="w-4 h-4" />
            <span className="uppercase">{language}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("language") || "Language"}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setLanguage("en")}
            className={language === "en" ? "bg-accent" : ""}
          >
            English
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage("ar")}
            className={language === "ar" ? "bg-accent" : ""}
          >
            العربية
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span>{currency}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("currency") || "Currency"}</DropdownMenuLabel>
          {country && (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Detected: {country}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {currencies.map((curr) => (
            <DropdownMenuItem
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={currency === curr.code ? "bg-accent" : ""}
            >
              <span className="mr-2">{curr.symbol}</span>
              {curr.name} ({curr.code})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}