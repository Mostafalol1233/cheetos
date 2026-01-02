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
  const [payInfo, setPayInfo] = useState<{ title: string; value: string } | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const transactionId = params?.id as string | undefined;

  useEffect(() => {
    const load = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setTransaction(data.transaction);
        setItems(data.items);

        try {
          if (data?.transaction?.payment_method) {
            const infoRes = await fetch(`${API_BASE_URL}/api/public/payment-details?method=${encodeURIComponent(String(data.transaction.payment_method))}`);
            if (infoRes.ok) {
              const info = await infoRes.json();
              setPayInfo(info && typeof info === 'object' ? info : null);
            }
          }
        } catch {}
      } catch (err) {
        toast({ title: "Failed to load", description: String(err), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
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
      const j = await res.json();
      if (j?.id) setTrackingCode(String(j.id));
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
                {payInfo?.value ? (
                  <div className="mt-4 bg-muted/20 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{payInfo.title || 'Transfer number'}</p>
                      <p>{payInfo.value}</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                {trackingCode ? (
                  <div className="mb-4 rounded-lg border border-gold-primary/30 bg-muted/20 p-3 space-y-2">
                    <div className="text-sm font-medium">Tracking Code</div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-xs break-all flex-1">{trackingCode}</div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(trackingCode);
                            toast({ title: "Copied", description: "Tracking code copied" });
                          } catch {
                            toast({ title: "Copy failed", description: "Please copy it manually" });
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/track-order`} className="text-gold-primary text-sm">Go to Track Order</Link>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const r = await fetch(`${API_BASE_URL}/api/public/confirmations/${encodeURIComponent(trackingCode)}/resend`, { method: 'POST' });
                            if (!r.ok) throw new Error(await r.text());
                            toast({ title: "Request sent", description: "We notified the admin to resend via WhatsApp." });
                          } catch (e) {
                            toast({ title: "Failed", description: String(e), variant: "destructive" });
                          }
                        }}
                      >
                        Request resend via WhatsApp
                      </Button>
                    </div>
                  </div>
                ) : null}
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

