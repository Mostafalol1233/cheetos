import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/queryClient';

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_uses: number | null;
  used_count: number;
  expires_at: number | null;
  is_active: boolean;
  created_at: number;
}

export function PromoCodesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
  });

  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');

  const { data: promoCodes = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/promo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch promo codes');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`${API_BASE_URL}/api/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...data,
          discount_value: parseFloat(data.discount_value),
          min_order_amount: parseFloat(data.min_order_amount) || 0,
          max_uses: data.max_uses ? parseInt(data.max_uses) : null,
          expires_at: data.expires_at ? new Date(data.expires_at).getTime() : null,
        })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast({ title: 'Promo code created!' });
      setShowForm(false);
      setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const res = await fetch(`${API_BASE_URL}/api/promo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active })
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/promo/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast({ title: 'Promo code deleted' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Promo Codes</h2>
          <p className="text-sm text-muted-foreground">Create and manage discount codes for customers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gold-primary text-black hover:bg-gold-primary/80">
          <Plus className="w-4 h-4 mr-2" />
          New Code
        </Button>
      </div>

      {showForm && (
        <Card className="border-gold-primary/30">
          <CardHeader><CardTitle>Create Promo Code</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v as 'percent' | 'fixed' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (EGP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  placeholder={form.discount_type === 'percent' ? '20 (%)' : '50 (EGP)'}
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                />
              </div>
              <div>
                <Label>Min Order (EGP)</Label>
                <Input
                  type="number"
                  placeholder="0 (no minimum)"
                  value={form.min_order_amount}
                  onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.code || !form.discount_value}>
                {createMutation.isPending ? 'Creating...' : 'Create Code'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading promo codes...</div>
      ) : promoCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No promo codes yet. Create your first one above!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {promoCodes.map((promo) => (
            <Card key={promo.id} className={`border-border/40 ${!promo.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <code className="bg-muted px-3 py-1 rounded-lg font-mono text-lg font-bold text-gold-primary">
                    {promo.code}
                  </code>
                  <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {promo.discount_type === 'percent'
                      ? `${promo.discount_value}% off`
                      : `${promo.discount_value} EGP off`}
                  </Badge>
                  {promo.min_order_amount && parseFloat(promo.min_order_amount) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Min: {promo.min_order_amount} EGP
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Used: {promo.used_count}{promo.max_uses ? `/${promo.max_uses}` : ''}</span>
                  {promo.expires_at && (
                    <span>Expires: {(() => { const d = promo.expires_at ? new Date(promo.expires_at) : null; return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB') : '—'; })()}</span>
                  )}
                  <button
                    onClick={() => toggleMutation.mutate({ id: promo.id, is_active: !promo.is_active })}
                    className="text-blue-400 hover:text-blue-300"
                    title={promo.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {promo.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this promo code?')) deleteMutation.mutate(promo.id); }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
