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
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from 'wouter';
import { User, LogIn, ArrowRight } from 'lucide-react';
import { useTranslation } from "@/lib/translation";

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  notes: z.string().optional(),
  password: z.string().optional(),
  createAccount: z.boolean().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

interface StepDetailsProps {
  onNext?: () => void;
  onBack?: () => void;
  canGoNext?: boolean;
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { contact, setContact } = useCheckout();
  const { user, isAuthenticated, login } = useUserAuth();
  const { t } = useTranslation();
  const [authTab, setAuthTab] = React.useState<'guest' | 'login'>('guest');

  // Login State
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Form Hook
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      ...contact,
      countryCode: contact.countryCode || '+20',
      createAccount: false,
    },
  });

  const onSubmit = (data: DetailsForm) => {
    setContact({ 
      ...contact, 
      ...data, 
      deliveryMethod: 'email' 
    });
    onNext?.();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
      setAuthTab('guest'); // Switch back to form view
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
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
    }
  }, [isAuthenticated, user, setValue, contact]);

  const createAccount = watch('createAccount');

  if (!isAuthenticated && authTab === 'login') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Sign In</h2>
          <Button variant="ghost" onClick={() => setAuthTab('guest')}>
            Continue as Guest
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  Sign in to access your saved details and complete your order faster.
                </p>
              </div>
              
              {loginError && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {loginError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="login-password">Password</Label>
                  <Link href="/forgot-password">
                    <span className="text-xs text-primary hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setAuthTab('guest')}
              >
                Continue as Guest / Sign Up
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("details_title") || "Your Details"}</h2>
        {!isAuthenticated && (
          <Button variant="ghost" onClick={() => setAuthTab('login')} size="sm">
            <User className="mr-2 h-4 w-4" />
            Already have an account?
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form id="details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">{t("full_name") || "Full Name"}</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder={t("enter_full_name") || "Enter your full name"}
                />
                {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">{t("phone_number") || "Phone Number"}</Label>
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

            {!isAuthenticated && (
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="createAccount"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    {...register('createAccount')}
                  />
                  <Label htmlFor="createAccount" className="font-normal cursor-pointer">
                    Create an account for faster checkout next time
                  </Label>
                </div>
                
                {createAccount && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="Choose a password"
                    />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                  </div>
                )}
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
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
