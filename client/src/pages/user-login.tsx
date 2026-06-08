import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useUserAuth } from "@/lib/user-auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";

const GOOGLE_CLIENT_ID = "240771472584-ulq4ea98n3tn37u1r5uur0enig1vhril.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: any;
  }
}

let googleInitialized = false;
let googleCallback: ((credential: string) => void) | null = null;

function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    googleCallback = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const init = () => {
      if (!window.google || !btnRef.current) return;
      if (!googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res: any) => {
            if (res?.credential && googleCallback) googleCallback(res.credential);
          },
        });
        googleInitialized = true;
      }
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: btnRef.current.offsetWidth || 380,
        text: "continue_with",
      });
      setReady(true);
    };

    if (window.google) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); init(); }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="w-full">
      <div ref={btnRef} className="w-full" style={{ minHeight: 44 }} />
      {!ready && (
        <div className="w-full h-11 rounded-full bg-gray-800 animate-pulse" />
      )}
    </div>
  );
}

export default function UserLoginPage() {
  const { login, register, isAuthenticated, loginWithGoogle } = useUserAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect') || '/profile';
  const defaultTab = searchParams.get('tab') || 'login';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLocation(redirectUrl);
    }
  }, [isAuthenticated, setLocation, redirectUrl]);

  // Email/Password login
  const [emailLogin, setEmailLogin] = useState({ email: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [showGeneratedPasswordNotice, setShowGeneratedPasswordNotice] = useState(false);
  const [generatedPasswordData, setGeneratedPasswordData] = useState<{ email: string; password: string } | null>(null);

  // Check for generated credentials in localStorage (from guest checkout) - RUN FIRST
  useEffect(() => {
    // 1) Prefer complete auto_login_data (has token/user for auto-login)
    const generatedCreds = localStorage.getItem('auto_login_data');
    if (generatedCreds) {
      try {
        const { email, password } = JSON.parse(generatedCreds);
        setEmailLogin({ email, password });
        setShowGeneratedPasswordNotice(true);
        setGeneratedPasswordData({ email, password });
        return;
      } catch (err) {
        console.error('Failed to parse auto_login_data:', err);
      }
    }

    // 2) Fallback to new_user_creds (guest checkout credentials)
    const fallbackCreds = localStorage.getItem('new_user_creds');
    if (fallbackCreds) {
      try {
        const { email, password } = JSON.parse(fallbackCreds);
        if (email && password) {
          setEmailLogin({ email, password });
          setShowGeneratedPasswordNotice(true);
          setGeneratedPasswordData({ email, password });
          return;
        }
      } catch (err) {
        console.error('Failed to parse new_user_creds:', err);
      }
    }

    // 3) As a last resort, prefill from query params if provided
    const qpEmail = new URLSearchParams(window.location.search).get('email') || '';
    const qpPassword = new URLSearchParams(window.location.search).get('password') || '';
    if (qpEmail || qpPassword) {
      setEmailLogin({ email: qpEmail, password: qpPassword });
      if (qpEmail && qpPassword) {
        setShowGeneratedPasswordNotice(true);
        setGeneratedPasswordData({ email: qpEmail, password: qpPassword });
      }
    }
  }, []);

  // Check for auto-login from guest checkout (auto-generated account) - RUN AFTER PRE-FILL
  useEffect(() => {
    const timer = setTimeout(async () => {
      const autoLoginData = localStorage.getItem('auto_login_data');
      if (autoLoginData && generatedPasswordData) {
        try {
          const { email, password } = JSON.parse(autoLoginData);
          if (email && password) {
            // Use the proper login function to update auth context state
            await login(email, password);
            localStorage.removeItem('auto_login_data');
            // Redirect after successful login
            setTimeout(() => {
              setLocation(redirectUrl || '/profile');
            }, 500);
          }
        } catch (err) {
          // Auto-login failed silently — user can manually click "Quick Login"
          console.error('Auto-login failed:', err);
        }
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [generatedPasswordData, redirectUrl, login, setLocation]);



  // Registration
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await login(emailLogin.email, emailLogin.password);
      toast({ title: "Welcome back!", description: "Login successful" });
      setLocation(redirectUrl);
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setEmailLoading(false);
    }
  };



  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      await register(registerData);
      toast({ title: "Welcome!", description: "Account created successfully" });
      setLocation(redirectUrl);
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors bg-transparent border-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-gold-primary to-neon-pink w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
            Welcome to Diaa Store
          </h1>
          <p className="text-gray-400 mt-2">Sign in to your account or create a new one</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="login" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black">
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            {/* Generated Credentials Notification */}
            {showGeneratedPasswordNotice && generatedPasswordData && (
              <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="text-green-400 mt-1">✓</div>
                      <div>
                        <p className="text-green-100 font-semibold">Account Created!</p>
                        <p className="text-green-200 text-sm">Your login credentials are shown below and filled in the form.</p>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded p-3 space-y-2 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-300 block text-xs uppercase">Email</span>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-white font-mono break-all">{generatedPasswordData.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPasswordData.email);
                              toast({ title: "Copied!", description: "Email copied to clipboard" });
                            }}
                            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded whitespace-nowrap"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-300 block text-xs uppercase">Password</span>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-white font-mono">{generatedPasswordData.password}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPasswordData.password);
                              toast({ title: "Copied!", description: "Password copied to clipboard" });
                            }}
                            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded whitespace-nowrap"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-green-200/80 text-xs">💡 Save these credentials to login from other devices. Just click the "Quick Login" button below!</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-gold-primary" />
                  Sign In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email/Password Login */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gold-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailLogin.email}
                      onChange={(e) => setEmailLogin(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gold-primary" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={emailLogin.password}
                      onChange={(e) => setEmailLogin(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={emailLoading}
                    className="w-full bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black font-semibold py-3"
                  >
                    {emailLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                        Signing In...
                      </>
                    ) : showGeneratedPasswordNotice ? (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Quick Login
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                {/* Google Sign-In */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card-bg px-3 text-gray-500">or continue with</span>
                  </div>
                </div>
                <GoogleSignInButton
                  onCredential={async (credential) => {
                    try {
                      await loginWithGoogle(credential);
                      toast({ title: "Welcome!", description: "Signed in with Google successfully" });
                      setLocation(redirectUrl);
                    } catch (err) {
                      toast({
                        title: "Google sign-in failed",
                        description: err instanceof Error ? err.message : "Please try again",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-gold-primary" />
                  Create Account
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">Only email &amp; password required — takes 10 seconds</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-white flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-gold-primary" />
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-white flex items-center gap-2 text-sm">
                      <Lock className="w-3.5 h-3.5 text-gold-primary" />
                      Password <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary h-10"
                    />
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Optional info (can add later in profile)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="reg-name" className="text-gray-400 text-xs flex items-center gap-1">
                          <User className="w-3 h-3" /> Name
                        </Label>
                        <Input
                          id="reg-name"
                          type="text"
                          value={registerData.name}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
                          className="bg-gray-800/30 border-gray-700 text-white placeholder-gray-500 focus:border-gold-primary h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reg-phone" className="text-gray-400 text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Phone
                        </Label>
                        <Input
                          id="reg-phone"
                          type="tel"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="01xxxxxxxxx"
                          className="bg-gray-800/30 border-gray-700 text-white placeholder-gray-500 focus:border-gold-primary h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black font-semibold py-3 mt-1"
                  >
                    {registerLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account Free
                      </>
                    )}
                  </Button>
                </form>

                {/* Google Sign-Up */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card-bg px-3 text-gray-500">or sign up with</span>
                  </div>
                </div>
                <GoogleSignInButton
                  onCredential={async (credential) => {
                    try {
                      await loginWithGoogle(credential);
                      toast({ title: "Account created!", description: "Welcome! Signed up with Google." });
                      setLocation(redirectUrl);
                    } catch (err) {
                      toast({
                        title: "Google sign-up failed",
                        description: err instanceof Error ? err.message : "Please try again",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-gold-primary hover:text-gold-secondary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-gold-primary hover:text-gold-secondary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}