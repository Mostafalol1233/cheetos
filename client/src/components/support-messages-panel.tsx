import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Phone, Mail, Eye, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface ContactMessage {
  id: string;
  name: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  read: boolean;
  created_at: string;
}

export function SupportMessagesPanel() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact-messages'],
    staleTime: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/contact-messages/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/contact-messages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/contact-messages/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      setSelected(null);
      qc.invalidateQueries({ queryKey: ['/api/contact-messages'] });
    },
  });

  const handleSelect = (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) markReadMutation.mutate(msg.id);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">رسائل التواصل</h2>
          <p className="text-sm text-muted-foreground">رسائل العملاء الواردة من صفحة الدعم</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white text-sm px-3 py-1">{unreadCount} غير مقروءة</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>
      ) : messages.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">لا توجد رسائل بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-base">الرسائل ({messages.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border">
                    {messages.map(msg => (
                      <button
                        key={msg.id}
                        onClick={() => handleSelect(msg)}
                        className={`w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors ${selected?.id === msg.id ? 'bg-muted' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!msg.read && <span className="w-2 h-2 rounded-full bg-gold-primary flex-shrink-0" />}
                              <span className={`font-medium text-sm truncate ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {msg.name}
                              </span>
                            </div>
                            {msg.subject && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject}</p>
                            )}
                            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{msg.message}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                            {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selected.name}</CardTitle>
                      {selected.subject && (
                        <p className="text-sm text-muted-foreground mt-1">{selected.subject}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(selected.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {selected.phone && (
                      <a
                        href={`tel:${selected.phone}`}
                        className="flex items-center gap-2 text-sm text-gold-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {selected.phone}
                      </a>
                    )}
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      {new Date(selected.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-xl p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>
                  {selected.phone && (
                    <a
                      href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                        <Phone className="w-4 h-4 mr-2" />
                        الرد عبر واتساب
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">اختر رسالة لعرضها</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
