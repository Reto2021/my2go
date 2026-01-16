import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircleHeart, Users, Music, Sparkles } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  const { user } = useAuth();
  const songIdentifier = `${songTitle}${songArtist ? `-${songArtist}` : ''}`.toLowerCase().replace(/\s+/g, '-');
  const { messages, isLoading, sendMessage, onlineCount } = useLiveChat(songIdentifier);
  
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        className="h-[85vh] rounded-t-[2rem] border-0 p-0 z-[250] overflow-hidden"
      >
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/95 to-secondary" />
        
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-40 bg-gradient-to-b from-accent/20 via-primary/10 to-transparent blur-3xl pointer-events-none" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-shrink-0 px-5 pt-4 pb-3"
          >
            {/* Swipe indicator */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/30"
                >
                  <MessageCircleHeart className="h-6 w-6 text-accent-foreground" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Live Chat
                    <Sparkles className="h-4 w-4 text-accent" />
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Music className="h-3 w-3" />
                    <span className="truncate max-w-[180px]">{songTitle}</span>
                  </div>
                </div>
              </div>
              
              {/* Online indicator */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping" />
                </div>
                <Users className="h-3.5 w-3.5 text-white/70" />
                <span className="text-sm font-semibold text-white">{onlineCount}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="space-y-3 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent mb-3"
                  />
                  <span className="text-white/60 text-sm">Lädt Nachrichten...</span>
                </div>
              ) : messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-5 border border-white/10">
                    <MessageCircleHeart className="h-10 w-10 text-accent" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-1">Sei der Erste! 🎉</p>
                  <p className="text-white/50 text-sm max-w-[200px]">
                    Starte die Diskussion über diesen Song
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => {
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
                          'flex gap-2.5',
                          isOwn ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-white/10">
                            <AvatarImage src={msg.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/30 text-white font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          'max-w-[75%] space-y-1',
                          isOwn ? 'items-end' : 'items-start'
                        )}>
                          {!isOwn && (
                            <p className="text-[11px] text-white/50 px-1 font-medium">
                              {displayName}
                            </p>
                          )}
                          <div className={cn(
                            'px-4 py-2.5 text-sm leading-relaxed',
                            isOwn 
                              ? 'bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl rounded-br-md shadow-lg shadow-accent/20' 
                              : 'bg-white/10 backdrop-blur-sm text-white rounded-2xl rounded-bl-md border border-white/5'
                          )}>
                            {msg.message}
                          </div>
                          <p className={cn(
                            'text-[10px] text-white/40 px-1',
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
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-shrink-0 p-4 bg-gradient-to-t from-black/40 to-transparent"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {user ? (
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Schreib was zum Song..."
                  className="flex-1 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/50 focus-visible:border-accent/50"
                  maxLength={280}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending}
                  className="h-12 w-12 rounded-2xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 shadow-lg shadow-accent/30 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 px-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-sm text-white/70">
                  Melde dich an, um mitzuchatten 💬
                </p>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = '/auth';
                  }}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground font-semibold shadow-lg shadow-accent/30"
                >
                  Jetzt einloggen
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}