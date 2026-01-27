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
import { Loader2, Globe, MessageCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  deliveryMethod: z.enum(['whatsapp', 'email']).default('whatsapp'),
  notes: z.string().optional(),
  isNewUser: z.boolean().default(false), // Internal field to track UI state
});

type DetailsForm = z.infer<typeof detailsSchema>;

export function StepDetails() {
  const { contact, setContact, setStep } = useCheckout();
  const { user, isAuthenticated, login } = useUserAuth();
  const { toast } = useToast();
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('register');
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPass, setLoginPass] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      ...contact,
      countryCode: contact.countryCode || '+20',
      deliveryMethod: 'whatsapp', // Default to WhatsApp as per requirement "asked website or whatsapp"
      isNewUser: false
    },
    mode: 'onChange',
  });

  const deliveryMethod = watch('deliveryMethod');
  const isNewUser = watch('isNewUser');

  const onSubmit = (data: DetailsForm) => {
    // If "Website" delivery and "New User", password is required
    if (data.deliveryMethod === 'email' && authMode === 'register' && !isAuthenticated) {
      if (!data.password) {
        toast({ title: "Password Required", description: "Please create a password for your account.", variant: "destructive" });
        return;
      }
    }

    setContact(data);
    setStep('payment');
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(loginEmail, loginPass);
      toast({ title: "Welcome back!", description: "Successfully signed in." });
      
      // Auto-advance after login
      const { user } = useUserAuth.getState();
      if (user) {
        setContact({
          ...contact,
          fullName: user.name || contact.fullName,
          email: user.email || contact.email,
          phone: user.phone || contact.phone,
        });
        setStep('payment');
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If user is authenticated, pre-fill form
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setValue('fullName', user.name || contact.fullName || '');
      setValue('email', user.email || contact.email || '');
      setValue('phone', user.phone || contact.phone || '');
      // Ensure specific fields are set
    }
  }, [isAuthenticated, user, setValue, contact]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Details & Delivery</h2>

      <Card>
        <CardHeader>
          <CardTitle>1. Choose Delivery Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="deliveryMethod"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => field.onChange('whatsapp')}
                  className={`cursor-pointer border rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all ${field.value === 'whatsapp' ? 'border-green-500 bg-green-500/10 text-green-500 ring-1 ring-green-500' : 'border-border hover:border-gray-500'}`}
                >
                  <MessageCircle className="w-10 h-10" />
                  <span className="font-bold text-lg">WhatsApp</span>
                  <span className="text-xs text-center text-muted-foreground">Receive code via chat</span>
                </div>

                <div
                  onClick={() => field.onChange('email')}
                  className={`cursor-pointer border rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all ${field.value === 'email' ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border hover:border-gray-500'}`}
                >
                  <Globe className="w-10 h-10" />
                  <span className="font-bold text-lg">Website / Email</span>
                  <span className="text-xs text-center text-muted-foreground">View in profile & email</span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Website Delivery: Authentication Gate */}
      {deliveryMethod === 'email' && !isAuthenticated && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">I have an account</TabsTrigger>
                <TabsTrigger value="register">I am new</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleQuickLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoggingIn} className="w-full">
                    {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sign In & Continue
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <div className="text-sm text-muted-foreground mb-4">
                  Please fill in your details below to create an account and continue.
                </div>
                {/* Form continues below in the main block */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Main Contact Form - Shown if:
          1. Authenticated
          2. Delivery is WhatsApp (Guest OK)
          3. Delivery is Website AND Mode is "Register"
      */}
      {(isAuthenticated || deliveryMethod === 'whatsapp' || (deliveryMethod === 'email' && authMode === 'register')) && (
        <Card>
          <CardHeader>
            <CardTitle>2. Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
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
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
              </div>

              {/* Password Field - Only for New Users choosing Website Delivery */}
              {!isAuthenticated && deliveryMethod === 'email' && authMode === 'register' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <Label htmlFor="password" className="text-yellow-500">Create Password (Required)</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="Create a strong password"
                    className="mt-2 border-yellow-500/30 focus:border-yellow-500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">You will use this to log in and view your order code.</p>
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                </div>
              )}

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Any special instructions..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Continue to Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}