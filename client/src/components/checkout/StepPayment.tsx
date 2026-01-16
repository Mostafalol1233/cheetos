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

export function StepPayment() {
  const { paymentMethod, paymentData, setPaymentData, setStep } = useCheckout();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use existing header upload or create a new one?
      // Using header-images/upload for now as it returns a URL and is authenticated admin only... wait.
      // Users need to upload receipts. They are not admins.
      // I need a public upload endpoint or user-authenticated one.
      // For now, let's assume I need to create a route for receipt uploads.
      
      // Temporary: Simulate upload or use a placeholder if route doesn't exist
      // But I should create the route.
      
      const res = await fetch('/api/uploads/receipt', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setPaymentData({ receiptUrl: data.url });
      toast({ title: "Receipt uploaded" });
    } catch (error) {
      console.error(error);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Payment Method</h2>
      <Card>
        <CardHeader>
          <CardTitle>Choose How to Pay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PaymentMethods />
          
          {paymentMethod === 'other' && (
            <div className="space-y-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-semibold">Payment Details</h3>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Player ID / Account ID</Label>
                        <Input 
                            placeholder="Enter your Player ID" 
                            value={paymentData.playerId || ''}
                            onChange={e => setPaymentData({ playerId: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Upload Receipt (Optional)</Label>
                        <div className="flex items-center gap-4">
                            <Input 
                                type="file" 
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                                className="cursor-pointer"
                                disabled={isUploading}
                            />
                            {isUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                        </div>
                        {paymentData.receiptUrl && (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Receipt attached
                            </p>
                        )}
                    </div>
                </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              disabled={!paymentMethod || (paymentMethod === 'other' && !paymentData.playerId) || isUploading}
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