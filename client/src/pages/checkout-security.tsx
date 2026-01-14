import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/lib/user-auth-context";
import { Copy, Shield, CheckCircle, Clock, AlertTriangle, FileText, Upload } from "lucide-react";

type TxItem = { id: string; game_id: string; quantity: number; price: number };
type Tx = { id: string; payment_method: string; total: number; status: string; created_at: string; name?: string; email?: string; phone?: string };

export default function CheckoutSecurityPage() {
  const [match, params] = useRoute("/checkout/security/:id");
  const { toast } = useToast();
  const { login } = useUserAuth();
  const [, setLocation] = useLocation();
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
      
      // Auto-login the user
      if (transaction?.email && transaction?.phone) {
        try {
          // Use phone number as password (backend sets this during checkout)
          const password = transaction.phone;
          await login(transaction.email, password);
          toast({ 
            title: "Confirmation submitted & logged in", 
            description: `Your login credentials: Email: ${transaction.email}, Password: ${password}. Check your orders page for status updates.` 
          });
          // Redirect to orders page after a short delay
          setTimeout(() => setLocation('/profile'), 2000);
        } catch (loginError) {
          toast({ title: "Confirmation submitted", description: "We will notify you when the seller responds. You can check your order status in the orders page." });
        }
      } else {
        toast({ title: "Confirmation submitted", description: "We will notify you when the seller responds." });
      }
      
      setMessage("");
      setReceipt(null);
      setConfirmed(false);
    } catch (err) {
      toast({ title: "Submission failed", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-gold-primary to-neon-pink p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent mb-2">
            Secure Payment Verification
          </h1>
          <p className="text-gray-400 text-lg">Complete your payment confirmation securely</p>
        </div>

        {/* Back Link */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors">
            ← Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Loading your order...</p>
            </div>
          </div>
        ) : transaction ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gold-primary" />
                      Order Details
                    </CardTitle>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Order ID</span>
                      <div className="font-mono text-white bg-gray-800/50 px-2 py-1 rounded mt-1">
                        {transaction.id}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Payment Method</span>
                      <div className="text-white font-medium mt-1">{transaction.payment_method}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Amount</span>
                      <div className="text-gold-primary font-bold text-lg mt-1">{transaction.total} EGP</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Date</span>
                      <div className="text-white mt-1">{new Date(transaction.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-700/50 pt-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={`/images/${it.game_id}.webp` || '/images/placeholder.webp'}
                              alt={it.game_id}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder.webp'; }}
                            />
                            <div>
                              <span className="text-white font-medium">{it.game_id}</span>
                              <div className="text-sm text-gray-400">Qty: {it.quantity}</div>
                            </div>
                          </div>
                          <span className="text-gold-primary font-semibold">{(it.price * it.quantity).toFixed(2)} EGP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  {payInfo?.value && (
                    <div className="border-t border-gray-700/50 pt-4">
                      <div className="bg-gradient-to-r from-gold-primary/10 to-neon-pink/10 border border-gold-primary/20 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-gold-primary" />
                          Payment Instructions
                        </h4>
                        <div className="space-y-2">
                          <p className="text-gray-300 text-sm">{payInfo.title || 'Transfer number'}</p>
                          <div className="flex items-center gap-2 p-2 bg-black/30 rounded border">
                            <span className="flex-1 font-mono text-white select-all text-sm">{payInfo.value}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(payInfo.value);
                                toast({ title: "Copied!", description: "Payment number copied to clipboard" });
                              }}
                              className="border-gold-primary/30 hover:bg-gold-primary/20"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Confirmation Form */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-gold-primary" />
                    Payment Confirmation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trackingCode ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <h3 className="text-lg font-semibold text-green-400">Confirmation Submitted!</h3>
                        </div>
                        <p className="text-gray-300 mb-3">Your payment confirmation has been received. We'll process your order shortly.</p>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-gray-400">Tracking Code</div>
                          <div className="flex items-center gap-2 p-2 bg-black/30 rounded border">
                            <div className="font-mono text-white text-xs break-all flex-1">{trackingCode}</div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(trackingCode);
                                  toast({ title: "Copied", description: "Tracking code copied" });
                                } catch {
                                  toast({ title: "Copy failed", description: "Please copy it manually" });
                                }
                              }}
                              className="border-green-500/30 hover:bg-green-500/20"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Login Credentials */}
                        <div className="space-y-3 mt-4 pt-4 border-t border-gray-600">
                          <div className="text-sm text-gray-400">Your Account Credentials</div>
                          <div className="space-y-2">
                            <div className="text-xs text-gray-400">Email</div>
                            <div className="flex items-center gap-2 p-2 bg-black/30 rounded border">
                              <div className="font-mono text-white text-xs break-all flex-1">
                                {transaction?.email || 'customer@example.com'}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(transaction?.email || 'customer@example.com');
                                    toast({ title: "Copied", description: "Email copied" });
                                  } catch {
                                    toast({ title: "Copy failed", description: "Please copy it manually" });
                                  }
                                }}
                                className="border-blue-500/30 hover:bg-blue-500/20"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs text-gray-400">Password</div>
                            <div className="flex items-center gap-2 p-2 bg-black/30 rounded border">
                              <div className="font-mono text-white text-xs break-all flex-1">
                                {transaction?.phone ? transaction.phone.replace(/[^0-9]/g, '').slice(-6) + 'Abc!' : '123456Abc!'}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const password = transaction?.phone ? transaction.phone.replace(/[^0-9]/g, '').slice(-6) + 'Abc!' : '123456Abc!';
                                  try {
                                    await navigator.clipboard.writeText(password);
                                    toast({ title: "Copied", description: "Password copied" });
                                  } catch {
                                    toast({ title: "Copy failed", description: "Please copy it manually" });
                                  }
                                }}
                                className="border-blue-500/30 hover:bg-blue-500/20"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Use these credentials to log in to your account and track your orders.
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap mt-4">
                          <Link href={`/track-order`} className="text-gold-primary hover:text-gold-secondary transition-colors text-sm underline">
                            Track Your Order
                          </Link>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              try {
                                const r = await fetch(`${API_BASE_URL}/api/public/confirmations/${encodeURIComponent(trackingCode)}/resend`, { method: 'POST' });
                                if (!r.ok) throw new Error(await r.text());
                                toast({ title: "Request sent", description: "We notified the admin to resend via WhatsApp." });
                              } catch (e) {
                                toast({ title: "Failed", description: String(e), variant: "destructive" });
                              }
                            }}
                            className="bg-green-600/20 hover:bg-green-600/30 border-green-500/30"
                          >
                            Request WhatsApp Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="msg" className="text-white font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gold-primary" />
                          Payment Details *
                        </Label>
                        <Textarea
                          id="msg"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Please provide payment details (time sent, sender name, transaction reference, etc.)"
                          rows={4}
                          required
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gold-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="receipt" className="text-white font-medium flex items-center gap-2">
                          <Upload className="w-4 h-4 text-gold-primary" />
                          Payment Receipt *
                        </Label>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gold-primary/50 transition-colors">
                          <input
                            id="receipt"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label htmlFor="receipt" className="cursor-pointer">
                            {receipt ? (
                              <div className="text-center">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-white font-medium">{receipt.name}</p>
                                <p className="text-gray-400 text-sm">Click to change file</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-white font-medium">Click to upload receipt</p>
                                <p className="text-gray-400 text-sm">JPG, PNG, PDF up to 5MB</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <Checkbox
                          id="confirm"
                          checked={confirmed}
                          onCheckedChange={(v) => setConfirmed(Boolean(v))}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <Label htmlFor="confirm" className="text-white font-medium cursor-pointer">
                            I confirm I have sent the payment
                          </Label>
                          <p className="text-gray-400 text-sm mt-1">
                            By checking this box, you confirm that you have completed the payment using the details above.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting || !confirmed || !receipt}
                        className="w-full bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-darker-bg py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 mr-2" />
                            Submit Confirmation
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-400 mb-2">Order Not Found</h2>
              <p className="text-gray-400">The order you're looking for doesn't exist or has expired.</p>
              <Link href="/" className="inline-block mt-4 text-gold-primary hover:text-gold-secondary">
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

