import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminConfirmationPage() {
  const [, params] = useRoute('/admin/confirmation/:id');
  const id = params?.id || '';
  const { toast } = useToast();
  const { data } = useQuery<any>({
    queryKey: ['/api/admin/confirmations', id],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/confirmations/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed to fetch confirmation');
      return res.json();
    }
  });
  const { data: thread } = useQuery<Array<{ id: string; sender: 'user'|'support'; message: string; timestamp: number }>>({
    queryKey: ['/api/admin/chat', data?.sessionId],
    enabled: Boolean(data?.sessionId),
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/${data?.sessionId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed to fetch chat');
      return res.json();
    }
  });
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sendEmailToo, setSendEmailToo] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  useEffect(() => { setText(''); setImageFile(null); }, [id]);
  useEffect(() => {
    const v = (data?.user?.email || '').trim();
    setEmailTo(v);
  }, [data?.user?.email]);
  const sendMutation = useMutation({
    mutationFn: async (mode: 'whatsapp' | 'email') => {
      let mediaUrl: string | undefined = undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const token = localStorage.getItem('adminToken');
        const up = await fetch('/api/admin/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
        if (!up.ok) throw new Error('Failed to upload image');
        const resp = await up.json();
        mediaUrl = resp?.url;
      }
      const token = localStorage.getItem('adminToken');
      let sentWhatsApp = false;
      let sentEmail = false;
      const resolvedEmail = String(emailTo || data?.user?.email || '').trim();

      if (mode === 'whatsapp') {
        const to = data?.user?.phone || '';
        const payload = { to, text, mediaUrl };
        const res = await fetch('/api/admin/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || 'WhatsApp send failed');
        }
        const j = await res.json().catch(() => ({} as any));
        if (j && j.ok === false) throw new Error('WhatsApp send failed');
        sentWhatsApp = true;

        if (sendEmailToo) {
          if (!resolvedEmail) throw new Error('No customer email available');
          const er = await fetch('/api/admin/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ to: resolvedEmail, subject: `GameCart Confirmation: ${data?.transactionId || data?.id || ''}`, text })
          });
          if (!er.ok) {
            const msg = await er.text().catch(() => '');
            throw new Error(msg || 'Email send failed');
          }
          const ej = await er.json().catch(() => ({} as any));
          if (ej && ej.ok === false) throw new Error('Email send failed');
          sentEmail = true;
        }
      }

      if (mode === 'email') {
        if (!resolvedEmail) throw new Error('No customer email available');
        const er = await fetch('/api/admin/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ to: resolvedEmail, subject: `GameCart Confirmation: ${data?.transactionId || data?.id || ''}`, text })
        });
        if (!er.ok) {
          const msg = await er.text().catch(() => '');
          throw new Error(msg || 'Email send failed');
        }
        const ej = await er.json().catch(() => ({} as any));
        if (ej && ej.ok === false) throw new Error('Email send failed');
        sentEmail = true;
      }

      // Record into chat thread for secure threading
      if (data?.sessionId) {
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ sender: 'support', message: mediaUrl ? `${text}\n${mediaUrl}` : text, sessionId: data.sessionId })
        });
      }

      return { sentWhatsApp, sentEmail };
    },
    onSuccess: (result) => {
      setText(''); setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/confirmations', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat', data?.sessionId] });
      const parts: string[] = [];
      if (result?.sentWhatsApp) parts.push('WhatsApp');
      if (result?.sentEmail) parts.push('Email');
      toast({ title: 'Sent', description: parts.length ? `Sent via ${parts.join(' + ')}` : 'Sent', duration: 2000 });
    },
    onError: (err: any) => {
      toast({ title: 'Send failed', description: String(err?.message || err || 'Unknown error'), variant: 'destructive', duration: 3500 });
    }
  });

  if (!id) return <div className="p-8">Invalid confirmation ID</div>;
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card/50 border-gold-primary/30">
          <CardHeader><CardTitle>Confirmation Detail</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm">ID</div>
                <div className="font-mono text-xs">{data?.id}</div>
              </div>
              <div>
                <div className="text-sm">Order</div>
                <div className="font-mono text-xs">{data?.transactionId}</div>
              </div>
              <div>
                <div className="text-sm">User</div>
                <div className="text-sm">{data?.user?.name || '—'} ({data?.user?.phone || '—'})</div>
              </div>
              <div>
                <div className="text-sm">Created</div>
                <div className="text-sm">{data?.createdAt ? new Date(data.createdAt).toLocaleString() : '-'}</div>
              </div>
            </div>
            <div>
              <div className="text-sm">Message</div>
              <div className="rounded border p-2 text-sm whitespace-pre-wrap">{data?.message || '—'}</div>
            </div>
            {data?.receiptUrl && (
              <div>
                <div className="text-sm">Receipt</div>
                <a href={data.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <img src={data.receiptUrl} className="max-h-64 object-contain rounded border" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {data?.sessionId && (
          <Card className="bg-card/50 border-gold-primary/30">
            <CardHeader><CardTitle>Chat Thread</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(thread || []).map(m => (
                  <div key={m.id} className={`rounded border p-2 text-sm ${m.sender === 'support' ? 'bg-muted/30' : 'bg-muted/10'}`}>
                    <div className="text-xs text-muted-foreground">{m.sender} — {new Date(m.timestamp).toLocaleString()}</div>
                    <div className="whitespace-pre-wrap">{m.message}</div>
                  </div>
                ))}
                {(!thread || thread.length === 0) && <div className="text-xs text-muted-foreground">No messages</div>}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/50 border-gold-primary/30">
          <CardHeader><CardTitle>Admin Reply</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Text</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className="col-span-3 h-32" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <Input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="customer@email.com"
                className="col-span-3"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => sendMutation.mutate('whatsapp')}
                disabled={sendMutation.isPending || !data?.user?.phone || (!text.trim() && !imageFile)}
                className="bg-gold-primary"
              >
                Send via WhatsApp
              </Button>
              <Button
                type="button"
                variant={sendEmailToo ? 'default' : 'outline'}
                onClick={() => setSendEmailToo(!sendEmailToo)}
                disabled={sendMutation.isPending}
              >
                {sendEmailToo ? 'Also Email: ON' : 'Also Email: OFF'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => sendMutation.mutate('email')}
                disabled={sendMutation.isPending || !String(emailTo || '').trim() || (!text.trim() && !imageFile)}
              >
                Send via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
