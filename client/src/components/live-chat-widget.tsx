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
      await new Promise(resolve => setTimeout(resolve, 1500));
      return message;
    },
    onSuccess: async () => {
      // Add auto-reply message
      await apiRequest('POST', '/api/chat/message', {
        sender: 'support',
        message: 'Thank you for contacting Diaa Eldeen! Our support team will get back to you soon. 🎮',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
      setInputMessage('');
      // Trigger auto-reply
      autoReplyMutation.mutate(inputMessage);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMutation.mutate(inputMessage);
    }
  };

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
          className="w-20 h-20 rounded-lg bg-gradient-to-r from-gold-primary to-neon-pink hover:scale-110 transition-transform duration-300 shadow-lg relative overflow-hidden group"
        >
          {/* Square image background */}
          <img 
            src={widgetConfig.iconUrl || '/images/message-icon.svg'} 
            alt="Chat" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/message-icon.svg';
            }}
          />
          {/* Black text overlay */}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-center px-1">
            <p className="text-[10px] font-bold leading-tight">Diaa Eldeen</p>
            <p className="text-[9px] font-semibold leading-tight">Support</p>
          </div>
          {/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[8px] font-medium py-0.5 text-center">
            We typically reply in minutes
          </div>
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
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with our support team!</p>
                </div>
              ) : (
                messages.map((msg: ChatMessage) => (
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
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gold-primary/30 p-4 bg-muted/20">
            <form onSubmit={handleSendMessage} className="flex gap-2">
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
