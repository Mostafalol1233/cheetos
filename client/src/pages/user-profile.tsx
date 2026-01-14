import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUserAuth } from "@/lib/user-auth-context";
import { API_BASE_URL } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChatWidget } from "@/components/chat-widget";
import {
  User,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  ShoppingBag,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  Eye,
  Download
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  total_amount?: number;
  created_at: string;
  items: Array<{
    id: string;
    name?: string;
    title?: string;
    quantity: number;
    price: number;
  }>;
}

export default function UserProfilePage() {
  const { user, logout, isAuthenticated } = useUserAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    fetchOrders();
  }, [isAuthenticated, setLocation]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : (data.orders || []));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const id = setInterval(() => { fetchOrders(); }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    setLocation("/");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'processing':
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-black/50 border-b border-gold-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Store
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
                My Account
              </h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-gold-primary to-neon-pink w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{user?.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-4 h-4 text-gold-primary" />
                    <span className="text-sm">
                      Member since {user?.created_at ? formatDate(user.created_at) : 'Recently'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <ShoppingBag className="w-4 h-4 text-gold-primary" />
                    <span className="text-sm">{orders.length} orders</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="orders" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black">
                  <Package className="w-4 h-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="messages" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Order History</h2>
                  <Button
                    onClick={fetchOrders}
                    variant="outline"
                    className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10"
                  >
                    Refresh
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-gold-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                    <CardContent className="p-8 text-center">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
                      <p className="text-gray-400 mb-4">Start shopping to see your order history here</p>
                      <Link href="/">
                        <Button className="bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black">
                          Browse Games
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg text-white">Order #{order.id.slice(-8)}</CardTitle>
                              <p className="text-gray-400 text-sm">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={`mb-2 ${getStatusColor(order.status)}`}>
                                {order.status}
                              </Badge>
                              <p className="text-xl font-bold text-gold-primary">{(order.total_amount ?? order.total ?? 0).toFixed(2)} EGP</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{item.title || item.name || item.id}</p>
                                    <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                                <p className="text-gold-primary font-semibold">{(item.price * item.quantity).toFixed(2)} EGP</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10">
                              <Download className="w-4 h-4 mr-2" />
                              Receipt
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Messages & Support</h2>
                  <Button
                    onClick={() => setIsChatOpen(true)}
                    className="bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Chat
                  </Button>
                </div>

                <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Chat Support</h3>
                    <p className="text-gray-400 mb-4">
                      Need help with an order? Have questions about our games? Chat with our support team.
                    </p>
                    <Button
                      onClick={() => setIsChatOpen(true)}
                      className="bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black"
                    >
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Account Settings</h2>

                <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-gold-primary" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Name</Label>
                        <p className="text-white font-medium">{user?.name}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Email</Label>
                        <p className="text-white font-medium">{user?.email}</p>
                      </div>
                      {user?.phone && (
                        <div>
                          <Label className="text-gray-400">Phone</Label>
                          <p className="text-white font-medium">{user.phone}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-400">Member Since</Label>
                        <p className="text-white font-medium">
                          {user?.created_at ? formatDate(user.created_at) : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10">
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card-bg/80 to-card-bg/60 border-gold-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gold-primary" />
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 mb-4">Manage your saved payment methods</p>
                    <Button variant="outline" className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10">
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
}
