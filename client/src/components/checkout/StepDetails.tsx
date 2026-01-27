import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCheckout } from '@/state/checkout';
import { useUserAuth } from '@/lib/user-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from 'wouter';
import { User, LogIn } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  deliveryMethod: z.enum(['whatsapp', 'email', 'live_chat']).default('whatsapp'),
  notes: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

function InlineAuth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const { login, register } = useUserAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'login' | 'register'>('login');

  // Login State
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPass, setLoginPass] = React.useState('');

  // Register State
  const [regName, setRegName] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regPass, setRegPass] = React.useState('');
  const [regPhone, setRegPhone] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPass);
      // Auth context will update user, but we can also trigger callback directly if we want instant feedback
      // Wait a tick for context to update or just fetch user data?
      // Since `login` updates context state, the parent `StepDetails` useEffect should fire.
      toast({ title: "Welcome back!", description: "Successfully signed in." });
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ name: regName, email: regEmail, password: regPass, phone: regPhone });
      toast({ title: "Welcome!", description: "Account created successfully." });
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
        <TabsTrigger value="login">Sign In</TabsTrigger>
        <TabsTrigger value="register">Create Account</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="inline-email">Email</Label>
            <Input
              id="inline-email"
              type="email"
              placeholder="name@example.com"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inline-pass">Password</Label>
            <Input
              id="inline-pass"
              type="password"
              placeholder="Enter your password"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register" className="space-y-4">
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="inline-reg-name">Full Name</Label>
            <Input
              id="inline-reg-name"
              placeholder="Your Name"
              value={regName}
              onChange={e => setRegName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inline-reg-email">Email</Label>
            <Input
              id="inline-reg-email"
              type="email"
              placeholder="name@example.com"
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inline-reg-pass">Password</Label>
            <Input
              id="inline-reg-pass"
              type="password"
              placeholder="Create password"
              value={regPass}
              onChange={e => setRegPass(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inline-reg-phone">Phone (Optional)</Label>
            <Input
              id="inline-reg-phone"
              type="tel"
              placeholder="+20..."
              value={regPhone}
              onChange={e => setRegPhone(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

export function StepDetails() {
  const { contact, setContact, setStep } = useCheckout();
  const { user, isAuthenticated } = useUserAuth();
  const [isGuest, setIsGuest] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      ...contact,
      countryCode: contact.countryCode || '+20'
    },
    mode: 'onChange',
  });

  const onSubmit = (data: DetailsForm) => {
    setContact(data);
    setStep('payment');
  };

  // If user is authenticated, pre-fill form with user data
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setValue('fullName', user.name || contact.fullName || '');
      setValue('email', user.email || contact.email || '');
      setValue('phone', user.phone || contact.phone || '');
      setValue('notes', contact.notes || '');
      // If user has saved country code, use it, else default
    }
  }, [isAuthenticated, user, setValue, contact]);

  // Merged "Fast Checkout" flow: 
  // If not authenticated, show form immediately but offer login option.
  // No separate "Guest vs Register" step.

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contact Details</h2>

      {!isAuthenticated && (
        <Card className="mb-6 bg-muted/50 border-gold-primary/20">
          <CardContent className="p-0">
            <div className="p-4 bg-black/40 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gold-primary/10 text-gold-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Account</p>
                  <p className="text-xs text-muted-foreground">Sign in for a better experience or continue as guest</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <InlineAuth onAuthSuccess={(user) => {
                setValue('fullName', user.name || '');
                setValue('email', user.email || '');
                setValue('phone', user.phone || '');
              }} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enter Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Controller
                  name="countryCode"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="+20" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+20">🇪🇬 +20</SelectItem>
                        <SelectItem value="+966">🇸🇦 +966</SelectItem>
                        <SelectItem value="+971">🇦🇪 +971</SelectItem>
                        <SelectItem value="+965">🇰🇼 +965</SelectItem>
                        <SelectItem value="+974">🇶🇦 +974</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input
                  id="phone"
                  className="flex-1"
                  {...register('phone')}
                  placeholder="1xxxxxxxxx"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label>Preferred Code Delivery Method</Label>
              <Controller
                name="deliveryMethod"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div
                      onClick={() => field.onChange('whatsapp')}
                      className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${field.value === 'whatsapp' ? 'border-cyber-blue bg-cyber-blue/10 text-cyber-blue' : 'border-border hover:border-cyber-blue/50'}`}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-8 h-8" />
                      <span className="text-sm font-medium">WhatsApp</span>
                    </div>

                    <div
                      onClick={() => field.onChange('email')}
                      className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${field.value === 'email' ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' : 'border-border hover:border-neon-purple/50'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      </div>
                      <span className="text-sm font-medium">Email</span>
                    </div>

                    <div
                      onClick={() => field.onChange('live_chat')}
                      className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${field.value === 'live_chat' ? 'border-electric-green bg-electric-green/10 text-electric-green' : 'border-border hover:border-electric-green/50'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      </div>
                      <span className="text-sm font-medium">Live Chat</span>
                    </div>
                  </div>
                )}
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={!isValid} className="w-full">
              Continue to Payment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}