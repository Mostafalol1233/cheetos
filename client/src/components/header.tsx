import { Link } from "wouter";
import { Sun, Moon, Gamepad2, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher";
import { useTheme } from "@/components/theme-provider";
import { useUserAuth } from "@/lib/user-auth-context";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
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
  const headerBgUrl = "https://files.catbox.moe/yqqgi9.webp";

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
    <>
      <header 
        className={`fixed w-full top-0 z-50 transition-all duration-500 flex flex-col items-center ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-md border-b shadow-sm py-2" 
            : "bg-gradient-to-b from-black/80 to-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4 w-full flex items-center justify-between">
            {/* Simple Logo */}
            <Link href="/">
              <span className="text-3xl font-black tracking-tighter bg-gradient-to-r from-gold-primary via-white to-neon-pink bg-clip-text text-transparent cursor-pointer drop-shadow-lg font-gaming">
                Diaa Store
              </span>
            </Link>

            {/* Navigation Menu - Fixed Position & Always Visible */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
              <NavigationMenu>
                <NavigationMenuList className="gap-6">
                  <NavigationMenuItem>
                    <Link href="/">
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-gold-primary/20 hover:text-gold-primary focus:bg-gold-primary/20 focus:text-gold-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 text-foreground">
                        {t('home')}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-gold-primary/20 hover:text-gold-primary focus:bg-gold-primary/20 focus:text-gold-primary text-foreground">{t('categories')}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-popover/95 backdrop-blur-xl border border-gold-primary/20">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link href="/games" className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:ring-2 hover:ring-gold-primary/50 transition-all">
                              <Gamepad2 className="h-6 w-6 text-gold-primary" />
                              <div className="mb-2 mt-4 text-lg font-medium text-foreground">
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
                            <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gold-primary/10 hover:text-gold-primary focus:bg-accent focus:text-accent-foreground">
                              <div className="text-sm font-medium leading-none text-foreground">Mobile Games</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                PUBG, Free Fire, etc.
                              </p>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                        <li>
                          <Link href="/category/pc-games">
                            <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gold-primary/10 hover:text-gold-primary focus:bg-accent focus:text-accent-foreground">
                              <div className="text-sm font-medium leading-none text-foreground">PC Games</div>
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
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-gold-primary/20 hover:text-gold-primary focus:bg-gold-primary/20 focus:text-gold-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 text-foreground">
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
                className="rounded-full hover:bg-gold-primary/20 hover:text-gold-primary transition-colors"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <Link href="/profile">
                      <Button variant="ghost" size="sm" className="hover:bg-gold-primary/20 hover:text-gold-primary">
                        <User className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">{user?.name}</span>
                      </Button>
                    </Link>
                    <Button onClick={logout} variant="ghost" size="icon" className="hover:text-red-500">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button variant="default" size="sm" className="bg-gold-primary text-black hover:bg-gold-secondary font-bold">
                      Sign In
                    </Button>
                  </Link>
                )}
            </div>
        </div>
      </header>

      {/* Hero Image Section - Separate from fixed header to avoid layout issues */}
      <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background z-10"></div>
         <img 
           src={headerBgUrl} 
           alt="Header Banner" 
           className="w-full h-full object-cover object-center"
         />
         <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-20"></div>
      </div>
    </>
  );
}
