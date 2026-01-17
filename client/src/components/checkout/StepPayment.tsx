import React from 'react';
import { useCheckout } from '@/state/checkout';
import { PaymentMethods } from './PaymentMethods';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { ReceiptUpload } from './receipt-upload';

export function StepPayment() {
  const { paymentMethod, paymentData, setPaymentData, setStep } = useCheckout();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/uploads/receipt', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setPaymentData({ receiptUrl: data.url });
      toast({ title: "Receipt uploaded successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const isManualPayment = ['vodafone_cash', 'instapay', 'orange_cash', 'etisalat_cash', 'we_pay', 'other'].includes(paymentMethod || '');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Payment Method</h2>
      <Card>
        <CardHeader>
          <CardTitle>Choose How to Pay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PaymentMethods />
          
          {isManualPayment && (
            <div className="space-y-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-semibold">Payment Details</h3>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Player ID / Account ID (if applicable)</Label>
                        <Input 
                            placeholder="Enter your Player ID" 
                            value={paymentData.playerId || ''}
                            onChange={e => setPaymentData({ playerId: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Upload Receipt (Required for Wallet Payments)</Label>
                        <ReceiptUpload 
                            onUpload={handleFileUpload}
                            onRemove={() => setPaymentData({ receiptUrl: null })}
                        />
                         {isUploading && <span className="text-sm text-muted-foreground block mt-2">Uploading...</span>}
                    </div>
                </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              disabled={!paymentMethod || (isManualPayment && !paymentData.receiptUrl) || isUploading}
              className="w-full"
              onClick={() => {
                setStep('review');
              }}
            >
              Review Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}