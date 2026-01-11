import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateSubAccountParams {
  partnerId: string;
  partnerName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  country?: string;
}

interface SyncContactParams {
  locationId: string;
  contact: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
}

export function useGHLSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubAccount = async (params: CreateSubAccountParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ghl-sync', {
        body: {
          action: 'create-subaccount',
          ...params,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('GoHighLevel Sub-Account erstellt!');
      return { success: true, locationId: data.locationId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      toast.error(`GHL Fehler: ${message}`);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const syncContact = async (params: SyncContactParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ghl-sync', {
        body: {
          action: 'sync-contact',
          ...params,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return { success: true, contactId: data.contactId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = async (locationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ghl-sync', {
        body: {
          action: 'get-location',
          locationId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      return { success: true, location: data.location };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createSubAccount,
    syncContact,
    getLocation,
  };
}
