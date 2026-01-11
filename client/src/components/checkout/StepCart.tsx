import React from 'react';
import { Link } from 'wouter';
import { useCheckout } from '@/state/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus } from 'lucide-react';

export function StepCart() {
  const { cart, updateItemQty, removeItem, subtotal, total } = useCheckout();

  if (cart.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link to="/" className="text-gold-primary hover:underline mt-2 inline-block">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gold-primary">Review Your Cart</h2>
      <div className="space-y-4">
        {cart.map((item) => (
          <Card key={item.id} className="border-gold-primary/30 bg-gradient-to-r from-card/70 to-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded border border-gold-primary/30"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gold-primary">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.price.toFixed(2)} EGP each
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold-primary/30 hover:bg-gold-primary/10"
                    onClick={() => updateItemQty(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItemQty(item.id, parseInt(e.target.value) || 1)
                    }
                    className="w-16 text-center border-gold-primary/30"
                    min={1}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold-primary/30 hover:bg-gold-primary/10"
                    onClick={() => updateItemQty(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gold-primary">
                    {(item.price * item.quantity).toFixed(2)} EGP
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="hover:bg-red-600"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-gold-primary/30 bg-gradient-to-r from-card/70 to-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gold-primary">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{subtotal().toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between font-bold text-gold-primary">
              <span>Total:</span>
              <span>{total().toFixed(2)} EGP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}