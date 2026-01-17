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

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  deliveryMethod: z.enum(['whatsapp', 'email', 'live_chat']).default('whatsapp'),
  notes: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

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

  if (!isAuthenticated && !isGuest) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Contact Details</h2>
        <Card>
          <CardHeader>
            <CardTitle>Sign In to Continue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Sign in to your account to continue with checkout, or continue as a guest.
            </p>
            <div className="flex gap-3">
              <Link href="/user-login">
                <Button className="flex-1 bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/user-register">
                <Button variant="outline" className="flex-1 border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10">
                  <User className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue as guest</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
              onClick={() => {
                setIsGuest(true);
              }}
            >
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contact Details</h2>
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