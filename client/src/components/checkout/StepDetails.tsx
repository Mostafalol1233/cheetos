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
import { User, LogIn, MessageCircle } from 'lucide-react';
import { useTranslation } from "@/lib/translation";

import { useToast } from "@/hooks/use-toast";

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+20'),
  phone: z.string().min(9, 'Phone number is too short'),
  notes: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

export function StepDetails() {
  const { contact, setContact, cart } = useCheckout();
  const { user, isAuthenticated } = useUserAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      ...contact,
      countryCode: contact.countryCode || '+20',
    },
  });

  const onSubmit = (data: DetailsForm) => {
    setContact({ ...contact, ...data });
    
    // Construct WhatsApp message
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const message = `*New Order Request*

*Customer:* ${data.fullName}
*Phone:* ${data.countryCode}${data.phone}
*Email:* ${data.email}

*Order:*
${cart.map(item => `- ${item.name} (x${item.quantity}) - ${item.price * item.quantity} EGP`).join('\n')}

*Total:* ${total} EGP

*Notes:* ${data.notes || 'None'}
`;
    
    const whatsappNumber = "201011696196";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    toast({
      title: t("redirecting_whatsapp"),
      description: t("details_desc"),
    });

    window.open(url, '_blank');
  };

  // If user is authenticated, pre-fill form
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setValue('fullName', user.name || contact.fullName || '');
      setValue('email', user.email || contact.email || '');
      setValue('phone', user.phone || contact.phone || '');
    }
  }, [isAuthenticated, user, setValue, contact]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("details_title")}</h2>
      <p className="text-muted-foreground">{t("details_desc")}</p>

      <Card>
        <CardContent className="pt-6">
          <form id="details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" size="lg">
              <MessageCircle className="mr-2 h-5 w-5" />
              {t("checkout_whatsapp_btn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}