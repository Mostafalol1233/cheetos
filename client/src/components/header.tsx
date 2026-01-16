import { Link } from "wouter";
import { Sun, Moon, Gamepad2, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher";
import { useTheme } from "@/components/theme-provider";
import { useUserAuth } from "@/lib/user-auth-context";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import { useSettings } from "@/lib/settings-context";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUserAuth();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings } = useSettings();
  const headerBgUrl = settings?.headerImageUrl;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-500 flex flex-col items-center ${
        isScrolled 
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm" 
          : "bg-transparent"
      }`}
    >
      {/* Header Image Section */}
      {headerBgUrl && (
        <div className={`w-full transition-all duration-500 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-[50vh] opacity-100'}`}>
           <img 
             src={headerBgUrl} 
             alt="Header Banner" 
             className="w-full h-auto min-h-[150px] max-h-[50vh] object-cover object-center"
           />
        </div>
      )}

      <div className="container mx-auto px-4 w-full py-4 flex items-center justify-between">
          {/* Simple Logo */}
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent cursor-pointer">
              Diaa Store
            </span>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {t('home')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t('categories')}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link href="/games" className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                            <Gamepad2 className="h-6 w-6" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              All Games
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Browse our full collection of games and top-ups.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link href="/category/mobile-games">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Mobile Games</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              PUBG, Free Fire, etc.
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/category/pc-games">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">PC Games</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Steam, Valorant, etc.
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/support">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {t('support')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageCurrencySwitcher />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{user?.name}</span>
                    </Button>
                  </Link>
                  <Button onClick={logout} variant="ghost" size="icon">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
          </div>
      </div>
    </header>
  );
}
