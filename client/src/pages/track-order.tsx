import { Link } from "wouter";
import { ArrowLeft, Package, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function TrackOrderPage() {
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTrackOrder = async () => {
    if (!orderId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId.trim())}`);
      if (!response.ok) {
        throw new Error("Order not found");
      }
      const data = await response.json();
      setOrderStatus(data);
    } catch (error) {
      toast({
        title: "Order Not Found",
        description: "Please check your order ID and try again",
        variant: "destructive"
      });
      setOrderStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Package className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
      case "pending":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "cancelled":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t("track_order_title")}</h1>
            <LanguageSwitcher />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {t("enter_order_id")}
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("order_id")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., txn_1234567890 or pc_1234567890"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                  className="flex-1"
                />
                <Button onClick={handleTrackOrder} disabled={loading}>
                  {loading ? t("tracking") : t("track_order")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {orderStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(orderStatus.transaction?.status)}
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("order_id")}</p>
                  <p className="font-mono text-lg font-bold">{orderStatus.transaction?.id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("status")}</p>
                  <span className={`inline-block px-3 py-1 rounded-full font-semibold ${getStatusColor(orderStatus.transaction?.status)}`}>
                    {orderStatus.transaction?.status?.toUpperCase() || "UNKNOWN"}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("payment_method")}</p>
                  <p className="font-semibold">{orderStatus.transaction?.payment_method || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("total_amount")}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {orderStatus.transaction?.total || 0} EGP
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("order_date")}</p>
                  <p>{new Date(orderStatus.transaction?.created_at || Date.now()).toLocaleString()}</p>
                </div>

                {orderStatus.items && orderStatus.items.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t("items")}</p>
                    <div className="space-y-2">
                      {orderStatus.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span>Item {index + 1}</span>
                          <span className="font-semibold">
                            {item.quantity} x {item.price} EGP = {(item.quantity * item.price).toFixed(2)} EGP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {orderStatus.transaction?.status === "pending" && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Your order is being processed. We'll notify you once it's completed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

