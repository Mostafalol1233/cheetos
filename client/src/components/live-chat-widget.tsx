import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  timestamp: number;
}

interface ChatWidgetConfig {
  enabled: boolean;
  iconUrl: string;
  welcomeMessage: string;
  position: string;
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch chat widget config
  const { data: config } = useQuery<ChatWidgetConfig>({
    queryKey: ['/api/chat-widget/config'],
    queryFn: async () => {
      const res = await fetch('/api/chat-widget/config');
      return res.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const widgetConfig = config || {
    enabled: true,
    iconUrl: '/images/message-icon.svg',
    welcomeMessage: 'Hello! How can we help you?',
    position: 'bottom-right'
  };

  // Fetch chat messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${sessionId}`],
    enabled: isOpen,
    refetchInterval: 2000
  });

  // Auto-reply mutation
  const autoReplyMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate support response
      setIsSupportTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSupportTyping(false);
      // Simple triggers for common queries
      const lc = message.toLowerCase();
      if (lc.includes('price')) {
        return 'Our prices are listed on each game page. Look for the "Starting from" label.';
      }
      if (lc.includes('delivery') || lc.includes('time')) {
        return 'Most digital products are delivered instantly after payment confirmation.';
      }
      if (lc.includes('payment') || lc.includes('method')) {
        return 'We accept Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, InstaPay, Bank Transfer, and PayPal.';
      }
      return 'Thank you for contacting Diaa Eldeen! Our support team will get back to you soon. 🎮';
    },
    onSuccess: async (replyText) => {
      // Add auto-reply message
      await apiRequest('POST', '/api/chat/message', {
        sender: 'support',
        message: String(replyText),
        sessionId
      });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
    }
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const response = await apiRequest('POST', '/api/chat/message', {
        sender: 'user',
        message: msg,
        sessionId
      });
      return response.json();
    },
    onSuccess: (_data, msg) => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
      setInputMessage('');
      // Trigger auto-reply
      autoReplyMutation.mutate(String(msg || ''));
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMutation.mutate(inputMessage);
    }
  };

  useEffect(() => {
    if (!inputMessage) { setIsUserTyping(false); return; }
    setIsUserTyping(true);
    const t = setTimeout(() => setIsUserTyping(false), 1000);
    return () => clearTimeout(t);
  }, [inputMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-live-chat', handler);
    return () => window.removeEventListener('open-live-chat', handler);
  }, []);

  if (!widgetConfig.enabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={`fixed ${widgetConfig.position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} z-40`}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-gold-primary to-neon-pink hover:scale-110 transition-transform duration-300 shadow-lg flex items-center justify-center relative overflow-hidden"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-card border border-gold-primary/30 rounded-2xl shadow-2xl z-50 flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold-primary/20 to-neon-pink/20 border-b border-gold-primary/30 p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">Diaa Eldeen Support</h3>
          <p className="text-xs text-muted-foreground">{widgetConfig.welcomeMessage || 'We typically reply in minutes'}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-gold-primary/10"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="hover:bg-red-500/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {(messages.filter(m => !search || m.message.toLowerCase().includes(search.toLowerCase()))).length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with our support team!</p>
                </div>
              ) : (
                messages.filter(m => !search || m.message.toLowerCase().includes(search.toLowerCase())).map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-gold-primary/30 text-foreground rounded-br-none'
                          : 'bg-muted/50 text-muted-foreground rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {(isUserTyping || isSupportTyping) && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-lg bg-muted/50 text-muted-foreground rounded-bl-none">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="text-xs ml-2">{isSupportTyping ? 'Support is typing...' : 'Typing...'}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gold-primary/30 p-4 bg-muted/20">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 border-gold-primary/30"
              />
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="border-gold-primary/30 focus:border-gold-primary"
                disabled={sendMutation.isPending}
              />
              <Button
                type="submit"
                disabled={sendMutation.isPending || !inputMessage.trim()}
                className="bg-gradient-to-r from-gold-primary to-neon-pink hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
