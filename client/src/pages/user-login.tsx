import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUserAuth } from "@/lib/user-auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Mail, Lock, Phone, User, ArrowLeft } from "lucide-react";

export default function UserLoginPage() {
  const { login, register, loginWithPhone } = useUserAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect') || '/';

  // Email/Password login
  const [emailLogin, setEmailLogin] = useState({ email: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  // Phone login
  const [phoneLogin, setPhoneLogin] = useState({ name: '', phone: '' });
  const [phoneLoading, setPhoneLoading] = useState(false);

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

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      await loginWithPhone(phoneLogin.name, phoneLogin.phone);
      toast({ title: "Welcome!", description: "Login successful" });
      setLocation(redirectUrl);
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setPhoneLoading(false);
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
          <Link href="/" className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
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

        <Tabs defaultValue="login" className="w-full">
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
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card-bg px-2 text-gray-400">Or</span>
                  </div>
                </div>

                {/* Phone Login */}
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-name" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-gold-primary" />
                      Name
                    </Label>
                    <Input
                      id="phone-name"
                      type="text"
                      value={phoneLogin.name}
                      onChange={(e) => setPhoneLogin(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your name"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gold-primary" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneLogin.phone}
                      onChange={(e) => setPhoneLogin(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={phoneLoading}
                    variant="outline"
                    className="w-full border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10"
                  >
                    {phoneLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-gold-primary border-t-transparent rounded-full mr-2"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Quick Sign In
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-gold-primary" />
                  Create Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-gold-primary" />
                      Full Name
                    </Label>
                    <Input
                      id="reg-name"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gold-primary" />
                      Email
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone" className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gold-primary" />
                      Phone Number
                    </Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gold-primary" />
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a password"
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black font-semibold py-3"
                  >
                    {registerLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
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