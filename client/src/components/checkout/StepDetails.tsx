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
import { User, LogIn, ArrowRight, UserPlus } from 'lucide-react';
import { useTranslation } from "@/lib/translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  notes: z.string().optional(),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type DetailsForm = z.infer<typeof detailsSchema>;
type SignupForm = z.infer<typeof signupSchema>;

interface StepDetailsProps {
  onNext?: () => void;
  onBack?: () => void;
  canGoNext?: boolean;
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { contact, setContact } = useCheckout();
  const { user, isAuthenticated, login, register: registerUser } = useUserAuth();
  const { t } = useTranslation();
  
  // Login State
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Signup State
  const [signupError, setSignupError] = React.useState('');
  const [isSigningUp, setIsSigningUp] = React.useState(false);

  // Details Form (for authenticated users)
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    control: controlDetails,
    setValue: setValueDetails,
    formState: { errors: errorsDetails },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      ...contact,
      countryCode: contact.countryCode || '+20',
    },
  });

  // Signup Form
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    control: controlSignup,
    formState: { errors: errorsSignup },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      countryCode: '+20',
    },
  });

  const onDetailsSubmit = (data: DetailsForm) => {
    // Ensure we capture the country code if not in data (though it should be)
    setContact({ 
      ...contact, 
      ...data, 
      deliveryMethod: 'email' 
    });
    
    // Explicitly call onNext
    if (onNext) {
        onNext();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
      // Auth context updates, component re-renders, shows authenticated view
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onSignupSubmit = async (data: SignupForm) => {
    setSignupError('');
    setIsSigningUp(true);
    try {
      const fullPhone = `${data.countryCode}${data.phone}`;
      await registerUser({
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone: fullPhone
      });
      
      // Update contact info in checkout state
      setContact({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        deliveryMethod: 'email'
      });

      // Move to next step immediately
      onNext?.();
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setSignupError(msg);
      // If user exists, we could auto-switch to login tab, but showing the error is safer for now.
      if (msg.includes('already registered') || msg.includes('409')) {
         setSignupError("This email is already registered. Please sign in instead.");
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  // If user is authenticated, pre-fill details form
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Ensure we have values, fallback to contact state
      const name = user.name || contact.fullName || '';
      const email = user.email || contact.email || '';
      
      if (name) setValueDetails('fullName', name);
      if (email) setValueDetails('email', email);
      
      // Handle phone
      const userPhone = user.phone || contact.phone || '';
      if (userPhone) {
        // Simple heuristic to split country code if possible, or just put it all in phone
        // If it starts with +, try to split.
        if (userPhone.startsWith('+')) {
           // naive split, assume +20 for now or whatever is matched
           // But our select only has a few options. 
           // Better to just set the phone field and let user fix if needed.
           // Or just put it in phone field.
           setValueDetails('phone', userPhone.replace(/^\+\d+\s?/, '')); // strip prefix if possible
        } else {
           setValueDetails('phone', userPhone);
        }
      }
    }
  }, [isAuthenticated, user, setValueDetails, contact]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="signup" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Sign In</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold">Create an Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign up to track your order and checkout faster.
                    </p>
                  </div>

                  {signupError && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                      {signupError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      {...registerSignup('fullName')}
                      placeholder="John Doe"
                    />
                    {errorsSignup.fullName && <p className="text-sm text-destructive">{errorsSignup.fullName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      {...registerSignup('email')}
                      placeholder="name@example.com"
                    />
                    {errorsSignup.email && <p className="text-sm text-destructive">{errorsSignup.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Controller
                        name="countryCode"
                        control={controlSignup}
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
                        id="signup-phone"
                        className="flex-1"
                        {...registerSignup('phone')}
                        placeholder="1xxxxxxxxx"
                      />
                    </div>
                    {errorsSignup.phone && <p className="text-sm text-destructive">{errorsSignup.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...registerSignup('password')}
                      placeholder="Choose a password"
                    />
                    {errorsSignup.password && <p className="text-sm text-destructive">{errorsSignup.password.message}</p>}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSigningUp}>
                    {isSigningUp ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span> Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" /> Sign Up & Continue
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold">Welcome Back</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in to access your saved details.
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
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("details_title") || "Your Details"}</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form id="details-form" onSubmit={handleSubmitDetails(onDetailsSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">{t("full_name") || "Full Name"}</Label>
                <Input
                  id="fullName"
                  {...registerDetails('fullName')}
                  placeholder={t("enter_full_name") || "Enter your full name"}
                />
                {errorsDetails.fullName && <p className="text-sm text-destructive mt-1">{errorsDetails.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerDetails('email')}
                  placeholder="name@example.com"
                />
                {errorsDetails.email && <p className="text-sm text-destructive mt-1">{errorsDetails.email.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">{t("phone_number") || "Phone Number"}</Label>
              <div className="flex gap-2">
                <Controller
                  name="countryCode"
                  control={controlDetails}
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
                  {...registerDetails('phone')}
                  placeholder="1xxxxxxxxx"
                />
              </div>
              {errorsDetails.phone && <p className="text-sm text-destructive mt-1">{errorsDetails.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...registerDetails('notes')}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Continue to Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {Object.keys(errorsDetails).length > 0 && (
                <div className="text-sm text-destructive mt-2 bg-destructive/10 p-2 rounded text-center">
                    Please fix the errors above to continue.
                </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
