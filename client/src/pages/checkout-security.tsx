import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type TxItem = { id: string; game_id: string; quantity: number; price: number };
type Tx = { id: string; payment_method: string; total: number; status: string; created_at: string };

export default function CheckoutSecurityPage() {
  const [match, params] = useRoute("/checkout/security/:id");
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Tx | null>(null);
  const [items, setItems] = useState<TxItem[]>([]);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const transactionId = params?.id as string | undefined;

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!transactionId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!ignore) {
          setTransaction(data.transaction);
          setItems(data.items);
        }
      } catch (err) {
        toast({ title: "Failed to load", description: String(err), variant: "destructive" });
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [transactionId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transactionId) return;
    if (!confirmed) {
      toast({ title: "Confirmation required", description: "Please confirm you sent the payment." });
      return;
    }
    if (!receipt) {
      toast({ title: "Receipt required", description: "Please upload a payment receipt." });
      return;
    }
    if (receipt.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("transactionId", transactionId);
      form.append("message", message);
      form.append("receipt", receipt);
      const res = await fetch(`${API_BASE_URL}/api/transactions/confirm`, { method: "POST", body: form });
      if (res.status === 401) {
        toast({ title: "Session expired", description: "Please restart checkout.", variant: "destructive" });
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Confirmation submitted", description: "We will notify you when the seller responds." });
      setMessage("");
      setReceipt(null);
      setConfirmed(false);
    } catch (err) {
      toast({ title: "Submission failed", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-gold-primary">← Back to Home</Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Secure Payment Confirmation</h1>
        <p className="text-gray-400 mb-6">Submit your payment message and receipt to confirm your order.</p>

        {loading ? (
          <p className="text-gray-300">Loading order...</p>
        ) : transaction ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Order Ref</span><span className="font-mono">{transaction.id}</span></div>
                  <div className="flex justify-between"><span>Status</span><span className="capitalize">{transaction.status}</span></div>
                  <div className="flex justify-between"><span>Payment Method</span><span>{transaction.payment_method}</span></div>
                  <div className="flex justify-between"><span>Total</span><span>{transaction.total} EGP</span></div>
                </div>
                <div className="mt-4 border-t pt-3">
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="space-y-1">
                    {items.map((it) => (
                      <div key={it.id} className="flex justify-between text-sm">
                        <span>x{it.quantity}</span>
                        <span>{(it.price * it.quantity).toFixed(2)} EGP</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 bg-muted/20 rounded-lg p-3">
                  {transaction.payment_method === 'Orange Cash' && (
                    <div>
                      <p className="font-medium">Transfer number</p>
                      <p>01001387284</p>
                    </div>
                  )}
                  {transaction.payment_method === 'Vodafone Cash' && (
                    <div>
                      <p className="font-medium">Transfer number</p>
                      <p>01001387284</p>
                    </div>
                  )}
                  {transaction.payment_method === 'Etisalat Cash' && (
                    <div>
                      <p className="font-medium">Transfer number</p>
                      <p>01001387284</p>
                    </div>
                  )}
                  {transaction.payment_method === 'WE Pay' && (
                    <div>
                      <p className="font-medium">Transfer numbers</p>
                      <p>01001387284 or 01029070780</p>
                    </div>
                  )}
                  {transaction.payment_method === 'InstaPay' && (
                    <div>
                      <p className="font-medium">Account</p>
                      <p>DiaaEldeenn</p>
                    </div>
                  )}
                  {transaction.payment_method === 'PayPal' && (
                    <div>
                      <p className="font-medium">PayPal Account</p>
                      <p>support@diaaeldeen.com</p>
                    </div>
                  )}
                  {transaction.payment_method === 'Bank Transfer' && (
                    <div>
                      <p className="font-medium">Bank</p>
                      <p>CIB Bank - Account Number: 0123456789</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="msg">Payment Message *</Label>
                    <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write details (time, sender, etc.)" rows={4} required />
                  </div>
                  <div>
                    <Label htmlFor="receipt">Payment Receipt *</Label>
                    <input id="receipt" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">Allowed: JPG, PNG, PDF — Max 5MB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(Boolean(v))} />
                    <Label htmlFor="confirm">I confirm I sent the payment</Label>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-gold-primary hover:bg-gold-secondary text-black">
                    {submitting ? 'Submitting...' : 'Submit Confirmation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-red-400">Order not found</p>
        )}
      </div>
    </div>
  );
}

