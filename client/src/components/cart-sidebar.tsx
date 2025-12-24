import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartSidebar({ isOpen, onClose, onCheckout }: CartSidebarProps) {
  const { cart, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-card-bg transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{t('shopping_cart')}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t('cart_empty')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-darker-bg p-4 rounded-xl"
                  >
                    <div className="flex items-center flex-1">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm">{item.name}</h3>
                        <p className="text-gray-400 text-xs">
                          {item.price} {t('egp')} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-600 hover:bg-gray-500 border-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-white w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-600 hover:bg-gray-500 border-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-600 pt-4 mt-4 sticky bottom-0 bg-card-bg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-semibold">{t('total')}:</span>
              <span className="text-gold-primary font-bold text-xl">
                {getTotalPrice()} {t('egp')}
              </span>
            </div>
            <Button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-darker-bg py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {t('checkout_whatsapp')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
