import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, Video, Mic, Radio, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PartyMode = 'standard' | 'live-stage' | 'duet';

export interface PartyModeInfo {
  id: PartyMode;
  name: string;
  description: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  maxPerformers: number;
  maxSpectators: number | 'unlimited';
  features: string[];
}

export const PARTY_MODES: Record<PartyMode, PartyModeInfo> = {
  standard: {
    id: 'standard',
    name: 'Standard Party',
    description: 'Alle tanzen gemeinsam mit Video',
    emoji: '🎉',
    icon: Users,
    maxPerformers: 8,
    maxSpectators: 0,
    features: ['Alle mit Video', 'Grid-Layout', 'Bis zu 8 Personen']
  },
  'live-stage': {
    id: 'live-stage',
    name: 'Live Stage',
    description: 'Hosts performen, viele schauen zu',
    emoji: '🎤',
    icon: Crown,
    maxPerformers: 4,
    maxSpectators: 'unlimited',
    features: ['1-4 Hosts', 'Unbegrenzt Zuschauer', 'Live Chat', 'Spotlight']
  },
  duet: {
    id: 'duet',
    name: 'Duett',
    description: 'Zu zweit im Split-Screen',
    emoji: '👯',
    icon: Video,
    maxPerformers: 2,
    maxSpectators: 0,
    features: ['Split-Screen', 'Video-Aufnahme', 'Teilen & Export']
  }
};

interface PartyModeSelectorProps {
  currentMode: PartyMode;
  onModeChange: (mode: PartyMode) => void;
  isConnected: boolean;
}

export const PartyModeSelector = ({ 
  currentMode, 
  onModeChange,
  isConnected 
}: PartyModeSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {Object.values(PARTY_MODES).map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onModeChange(mode.id)}
            disabled={isConnected}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
              "border-2",
              isActive 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-muted/30 border-transparent hover:border-muted-foreground/20",
              isConnected && !isActive && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-2xl">{mode.emoji}</span>
            <span className="text-xs font-medium">{mode.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Role selector for live stage mode
export type StageRole = 'host' | 'spectator';

interface RoleSelectorProps {
  onRoleSelect: (role: StageRole) => void;
  currentHosts: number;
  maxHosts: number;
}

export const RoleSelector = ({ onRoleSelect, currentHosts, maxHosts }: RoleSelectorProps) => {
  const canJoinAsHost = currentHosts < maxHosts;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-4"
    >
      <h3 className="text-center font-semibold">Wie möchtest du beitreten?</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Host option */}
        <motion.button
          whileHover={{ scale: canJoinAsHost ? 1.02 : 1 }}
          whileTap={{ scale: canJoinAsHost ? 0.98 : 1 }}
          onClick={() => canJoinAsHost && onRoleSelect('host')}
          disabled={!canJoinAsHost}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            canJoinAsHost 
              ? "border-primary/50 hover:border-primary hover:bg-primary/5"
              : "border-muted opacity-50 cursor-not-allowed"
          )}
        >
          <div className="relative">
            <Crown className="h-8 w-8 text-yellow-500" />
            <Video className="h-4 w-4 text-primary absolute -bottom-1 -right-1" />
          </div>
          <span className="font-medium">Als Host</span>
          <span className="text-xs text-muted-foreground text-center">
            Mit Kamera & Mikrofon
          </span>
          <span className="text-xs text-muted-foreground">
            {currentHosts}/{maxHosts} Hosts
          </span>
        </motion.button>
        
        {/* Spectator option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onRoleSelect('spectator')}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            "border-muted-foreground/30 hover:border-muted-foreground hover:bg-muted/10"
          )}
        >
          <div className="relative">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <span className="font-medium">Als Zuschauer</span>
          <span className="text-xs text-muted-foreground text-center">
            Zuschauen & Reagieren
          </span>
          <span className="text-xs text-muted-foreground">
            Unbegrenzt
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Live chat message component
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'message' | 'join' | 'reaction';
}

interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isSpectator?: boolean;
}

export const LiveChat = ({ messages, onSendMessage, isSpectator = true }: LiveChatProps) => {
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2 min-h-[100px] max-h-[200px]">
        {messages.slice(-50).map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "text-sm rounded px-2 py-1",
              msg.type === 'join' && "text-green-500 text-xs",
              msg.type === 'reaction' && "text-xl"
            )}
          >
            {msg.type === 'message' && (
              <>
                <span className="font-medium text-primary">{msg.userName}: </span>
                <span className="text-foreground">{msg.message}</span>
              </>
            )}
            {msg.type === 'join' && (
              <span>👋 {msg.userName} ist beigetreten</span>
            )}
            {msg.type === 'reaction' && (
              <span>{msg.message}</span>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Input */}
      <div className="flex gap-2 p-2 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nachricht..."
          className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          maxLength={200}
        />
        <Button 
          size="sm" 
          onClick={handleSend}
          disabled={!input.trim()}
          className="rounded-full"
        >
          Senden
        </Button>
      </div>
    </div>
  );
};

// Spectator count badge
interface SpectatorCountProps {
  count: number;
  className?: string;
}

export const SpectatorCount = ({ count, className }: SpectatorCountProps) => {
  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={cn(
        "flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium",
        className
      )}
    >
      <Eye className="h-3 w-3" />
      <span>{count.toLocaleString()}</span>
      <span className="animate-pulse">●</span>
    </motion.div>
  );
};

// Quick reaction buttons for spectators
const QUICK_REACTIONS = ['❤️', '🔥', '👏', '😍', '🎉', '💯'];

interface QuickReactionsProps {
  onReaction: (emoji: string) => void;
}

export const QuickReactions = ({ onReaction }: QuickReactionsProps) => {
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {QUICK_REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => onReaction(emoji)}
          className="text-xl p-1 rounded-full hover:bg-muted/50 transition-colors"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
};

export default PartyModeSelector;
