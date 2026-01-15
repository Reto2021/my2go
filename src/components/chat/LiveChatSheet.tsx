import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircleHeart, Users, X, Music } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { hapticPress, hapticSuccess } from '@/lib/haptics';

interface LiveChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songTitle: string;
  songArtist?: string;
}

export function LiveChatSheet({ open, onOpenChange, songTitle, songArtist }: LiveChatSheetProps) {
  const { user, profile } = useAuth();
  const songIdentifier = `${songTitle}${songArtist ? `-${songArtist}` : ''}`.toLowerCase().replace(/\s+/g, '-');
  const { messages, isLoading, sendMessage, onlineCount } = useLiveChat(songIdentifier);
  
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    hapticPress();
    setIsSending(true);
    
    const success = await sendMessage(inputValue);
    
    if (success) {
      hapticSuccess();
      setInputValue('');
    }
    
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-border/50"
      >
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <MessageCircleHeart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left text-base">Live Chat</SheetTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Music className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{songTitle}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <Users className="h-3 w-3" />
                <span className="text-xs font-medium">{onlineCount}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 h-[calc(80vh-140px)] py-4" ref={scrollRef}>
          <div className="space-y-3 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                Lädt Nachrichten...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <MessageCircleHeart className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Sei der Erste!</p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Starte die Diskussion über diesen Song 🎶
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((msg, index) => {
                  const isOwn = msg.user_id === user?.id;
                  const displayName = msg.profile?.display_name || 'Anonym';
                  const initials = displayName.slice(0, 2).toUpperCase();
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex gap-2',
                        isOwn ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-muted">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        'max-w-[75%] space-y-0.5',
                        isOwn ? 'items-end' : 'items-start'
                      )}>
                        {!isOwn && (
                          <p className="text-[10px] text-muted-foreground px-2">
                            {displayName}
                          </p>
                        )}
                        <div className={cn(
                          'px-3 py-2 rounded-2xl text-sm',
                          isOwn 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-muted rounded-bl-sm'
                        )}>
                          {msg.message}
                        </div>
                        <p className={cn(
                          'text-[10px] text-muted-foreground/60 px-2',
                          isOwn ? 'text-right' : 'text-left'
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString('de-DE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50">
          {user ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Schreib was zum Song..."
                className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                maxLength={280}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Melde dich an, um mitzuchatten
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
