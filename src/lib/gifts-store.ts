import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  talerCost: number;
  animation: 'float' | 'burst' | 'rain' | 'spin';
  tier: 'common' | 'rare' | 'epic' | 'legendary';
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  // Common gifts (1-5 Taler)
  { id: 'heart', name: 'Herz', emoji: '❤️', talerCost: 1, animation: 'float', tier: 'common' },
  { id: 'clap', name: 'Applaus', emoji: '👏', talerCost: 1, animation: 'burst', tier: 'common' },
  { id: 'fire', name: 'Feuer', emoji: '🔥', talerCost: 2, animation: 'float', tier: 'common' },
  { id: 'star', name: 'Stern', emoji: '⭐', talerCost: 2, animation: 'burst', tier: 'common' },
  { id: 'music', name: 'Musik', emoji: '🎵', talerCost: 3, animation: 'rain', tier: 'common' },
  
  // Rare gifts (5-15 Taler)
  { id: 'rose', name: 'Rose', emoji: '🌹', talerCost: 5, animation: 'float', tier: 'rare' },
  { id: 'diamond', name: 'Diamant', emoji: '💎', talerCost: 10, animation: 'spin', tier: 'rare' },
  { id: 'crown', name: 'Krone', emoji: '👑', talerCost: 15, animation: 'burst', tier: 'rare' },
  
  // Epic gifts (20-50 Taler)
  { id: 'fireworks', name: 'Feuerwerk', emoji: '🎆', talerCost: 20, animation: 'rain', tier: 'epic' },
  { id: 'disco', name: 'Disco-Kugel', emoji: '🪩', talerCost: 30, animation: 'spin', tier: 'epic' },
  { id: 'rocket', name: 'Rakete', emoji: '🚀', talerCost: 50, animation: 'burst', tier: 'epic' },
  
  // Legendary gifts (100+ Taler)
  { id: 'unicorn', name: 'Einhorn', emoji: '🦄', talerCost: 100, animation: 'rain', tier: 'legendary' },
  { id: 'galaxy', name: 'Galaxie', emoji: '🌌', talerCost: 200, animation: 'spin', tier: 'legendary' },
];

export interface SentGift {
  id: string;
  giftId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  timestamp: number;
}

interface GiftStore {
  recentGifts: SentGift[];
  isSending: boolean;
  error: string | null;
  
  sendGift: (
    giftId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    recipientName: string
  ) => Promise<boolean>;
  
  addReceivedGift: (gift: SentGift) => void;
  clearOldGifts: () => void;
}

export const useGiftStore = create<GiftStore>((set, get) => ({
  recentGifts: [],
  isSending: false,
  error: null,
  
  sendGift: async (giftId, senderId, senderName, recipientId, recipientName) => {
    const gift = VIRTUAL_GIFTS.find(g => g.id === giftId);
    if (!gift) {
      set({ error: 'Geschenk nicht gefunden' });
      return false;
    }
    
    set({ isSending: true, error: null });
    
    try {
      // First check balance (this will also get current balance)
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_balance', { _user_id: senderId });
      
      if (balanceError) throw balanceError;
      
      const balance = balanceData?.[0]?.taler_balance ?? 0;
      
      if (balance < gift.talerCost) {
        set({ error: 'Nicht genügend Taler', isSending: false });
        return false;
      }
      
      // Create a spend transaction for the gift
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: senderId,
          amount: gift.talerCost,
          type: 'spend',
          source: 'system',
          description: `Geschenk "${gift.name}" an ${recipientName}`
        });
      
      if (txError) throw txError;
      
      // Add to recent gifts for animation
      const sentGift: SentGift = {
        id: `${Date.now()}-${Math.random()}`,
        giftId,
        senderId,
        senderName,
        recipientId,
        recipientName,
        timestamp: Date.now()
      };
      
      set((state) => ({
        recentGifts: [...state.recentGifts, sentGift],
        isSending: false
      }));
      
      return true;
      
    } catch (err) {
      console.error('Gift send error:', err);
      set({ error: 'Fehler beim Senden', isSending: false });
      return false;
    }
  },
  
  addReceivedGift: (gift) => {
    set((state) => ({
      recentGifts: [...state.recentGifts, gift]
    }));
  },
  
  clearOldGifts: () => {
    const now = Date.now();
    set((state) => ({
      recentGifts: state.recentGifts.filter(g => now - g.timestamp < 10000) // 10 seconds
    }));
  }
}));

// Gift tier colors
export const GIFT_TIER_COLORS: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 via-orange-500 to-red-500'
};
