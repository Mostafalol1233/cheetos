import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Mail, Phone, CheckCircle, Clock, Send } from 'lucide-react';
import { API_BASE_URL } from '@/lib/queryClient';

interface AbandonedCart {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  items: any;
  total_amount: string;
  reminder_sent: boolean;
  recovered: boolean;
  created_at: number;
}

export function AbandonedCartsPanel() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');

  const { data: carts = [], isLoading } = useQuery<AbandonedCart[]>({
    queryKey: ['admin-abandoned-carts'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/abandoned-cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const pending = carts.filter(c => !c.recovered);
  const recovered = carts.filter(c => c.recovered);

  const parseItems = (items: any) => {
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch { return []; }
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abandoned Cart Recovery</h2>
        <p className="text-sm text-muted-foreground">Customers who started checkout but didn't complete it</p>
      </div>

      <div className="flex gap-4 text-sm flex-wrap">
        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">🛒 Pending: {pending.length}</span>
        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full">✓ Recovered: {recovered.length}</span>
        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full">Total: {carts.length}</span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading abandoned carts...</div>
      ) : carts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No abandoned carts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...pending, ...recovered].map((cart) => {
            const items = parseItems(cart.items);
            return (
              <Card key={cart.id} className={`border-border/40 ${cart.recovered ? 'opacity-60' : cart.reminder_sent ? 'border-blue-500/30' : 'border-yellow-500/30'}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{cart.name || 'Anonymous'}</span>
                        <Badge variant={cart.recovered ? 'default' : cart.reminder_sent ? 'secondary' : 'outline'} className="text-xs">
                          {cart.recovered ? '✓ Recovered' : cart.reminder_sent ? '📧 Reminder Sent' : '⏳ Pending'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(cart.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {cart.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <a href={`mailto:${cart.email}`} className="hover:text-foreground transition-colors">{cart.email}</a>
                          </span>
                        )}
                        {cart.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {cart.phone}
                          </span>
                        )}
                      </div>

                      {items.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {items.map((item: any, i: number) => (
                            <span key={i} className="block">
                              • {item.name} — {item.price} EGP {item.quantity > 1 ? `×${item.quantity}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-gold-primary">{parseFloat(cart.total_amount || '0').toFixed(0)} EGP</p>
                      {!cart.recovered && cart.email && (
                        <a
                          href={`https://wa.me/2${cart.phone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(`Hi ${cart.name || 'there'}! You left items in your cart at Diaa Store. Complete your order here: https://diaa.store/checkout`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mt-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
