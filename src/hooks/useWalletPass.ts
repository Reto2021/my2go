import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trackFunnelEvent } from '@/lib/funnel-config';
import { toast } from 'sonner';

interface WalletPassResult {
  success: boolean;
  walletType: 'apple' | 'google';
  saveUrl?: string;
  downloadUrl?: string;
  objectId?: string;
  serialNumber?: string;
  error?: string;
}

export function useWalletPass() {
  const { user, userCode, balance, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePass = async (walletType: 'apple' | 'google'): Promise<WalletPassResult | null> => {
    if (!user) {
      setError('Bitte zuerst einloggen');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-wallet-pass', {
        body: { walletType },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unbekannter Fehler');
      }

      trackFunnelEvent('wallet_pass_generated', { wallet_type: walletType });

      return data as WalletPassResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Generieren des Wallet Passes';
      setError(message);
      console.error('Wallet pass generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addToGoogleWallet = async () => {
    const result = await generatePass('google');
    
    if (result?.saveUrl) {
      trackFunnelEvent('wallet_added', { type: 'google' });
      
      // Open Google Wallet save URL
      window.open(result.saveUrl, '_blank');
      toast.success('Google Wallet wird geöffnet...');
      return true;
    }
    
    // Fallback: Show code page with wallet parameter
    if (userCode?.permanent_code) {
      window.location.href = `/code?wallet=google`;
      return true;
    }
    
    toast.error('Wallet Pass konnte nicht erstellt werden');
    return false;
  };

  const addToAppleWallet = async () => {
    const result = await generatePass('apple');
    
    if (result?.downloadUrl) {
      trackFunnelEvent('wallet_added', { type: 'apple' });
      
      // Download Apple Wallet pass
      window.location.href = result.downloadUrl;
      toast.success('Apple Wallet Pass wird heruntergeladen...');
      return true;
    }
    
    // Fallback: Show code page with wallet parameter
    if (userCode?.permanent_code) {
      window.location.href = `/code?wallet=apple`;
      return true;
    }
    
    toast.error('Wallet Pass konnte nicht erstellt werden');
    return false;
  };

  const addToWallet = async (type?: 'apple' | 'google') => {
    const walletType = type || (isAppleDevice() ? 'apple' : 'google');
    
    if (walletType === 'apple') {
      return addToAppleWallet();
    } else {
      return addToGoogleWallet();
    }
  };

  return {
    generatePass,
    addToGoogleWallet,
    addToAppleWallet,
    addToWallet,
    isLoading,
    error,
  };
}

// Utility to detect Apple devices
export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);
}

// Utility to check if Google Wallet is likely supported
export function isGoogleWalletSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Android devices or Chrome on any platform
  return /Android/.test(navigator.userAgent) || 
    (/Chrome/.test(navigator.userAgent) && !/iPhone|iPad|iPod/.test(navigator.userAgent));
}
