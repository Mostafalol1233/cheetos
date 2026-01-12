import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCheckout } from '@/state/checkout';
import { useUserAuth } from '@/lib/user-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { User, LogIn } from 'lucide-react';

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  notes: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

export function StepDetails() {
  const { contact, setContact } = useCheckout();
  const { user, isAuthenticated } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: contact,
    mode: 'onChange',
  });

  const onSubmit = (data: DetailsForm) => {
    setContact(data);
  };

  // If user is authenticated, pre-fill form with user data
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setContact({
        fullName: user.name || contact.fullName || '',
        email: user.email || contact.email || '',
        phone: user.phone || contact.phone || '',
        notes: contact.notes || '',
      });
    }
  }, [isAuthenticated, user, setContact, contact]);

  if (!isAuthenticated) {
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
                // Continue as guest - form will show below
                setContact({ fullName: '', email: '', phone: '', notes: '' });
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
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">
                  {errors.phone.message}
                </p>
              )}
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