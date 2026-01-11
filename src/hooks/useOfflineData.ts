import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

// IndexedDB configuration
const DB_NAME = 'my2go-offline-db';
const DB_VERSION = 1;
const STORES = {
  partners: 'partners',
  rewards: 'rewards',
  partnerDetails: 'partnerDetails',
} as const;

type StoreName = keyof typeof STORES;

interface CachedData<T> {
  data: T;
  cachedAt: number;
  key: string;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'key' });
        }
      });
    };
  });
}

// Save data to IndexedDB
async function saveToStore<T>(storeName: StoreName, key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES[storeName], 'readwrite');
    const store = transaction.objectStore(STORES[storeName]);
    
    const cachedData: CachedData<T> = {
      key,
      data,
      cachedAt: Date.now(),
    };
    
    store.put(cachedData);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('[OfflineDB] Failed to save:', storeName, key, error);
  }
}

// Load data from IndexedDB
async function loadFromStore<T>(storeName: StoreName, key: string): Promise<CachedData<T> | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES[storeName], 'readonly');
    const store = transaction.objectStore(STORES[storeName]);
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[OfflineDB] Failed to load:', storeName, key, error);
    return null;
  }
}

// Load all data from a store
async function loadAllFromStore<T>(storeName: StoreName): Promise<CachedData<T>[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES[storeName], 'readonly');
    const store = transaction.objectStore(STORES[storeName]);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[OfflineDB] Failed to load all:', storeName, error);
    return [];
  }
}

// Cache age threshold (1 hour)
const MAX_CACHE_AGE = 60 * 60 * 1000;

// Hook for offline-capable partners data
export function useOfflinePartners<T>(
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean }
) {
  const { isOnline } = useOnlineStatus();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = 'all-partners';
    
    // If offline, try to load from IndexedDB
    if (!isOnline) {
      console.log('[OfflineData] Offline - loading partners from IndexedDB');
      const cached = await loadFromStore<T>('partners', cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setLastUpdated(new Date(cached.cachedAt));
        setIsLoading(false);
        return;
      }
      setError(new Error('Keine Internetverbindung und keine gespeicherten Daten'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Try to fetch from network
      const result = await queryFn();
      setData(result);
      setIsFromCache(false);
      setLastUpdated(new Date());
      
      // Save to IndexedDB for offline use
      await saveToStore('partners', cacheKey, result);
      console.log('[OfflineData] Saved partners to IndexedDB');
    } catch (err) {
      console.log('[OfflineData] Network error, trying cache:', err);
      
      // On error, try to load from cache
      const cached = await loadFromStore<T>('partners', cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setLastUpdated(new Date(cached.cachedAt));
        
        // Check if cache is stale
        const isStale = Date.now() - cached.cachedAt > MAX_CACHE_AGE;
        if (isStale) {
          console.log('[OfflineData] Cache is stale');
        }
      } else {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queryFn]);

  useEffect(() => {
    if (options?.enabled === false) return;
    fetchData();
  }, [fetchData, options?.enabled]);

  return { data, isLoading, isFromCache, error, lastUpdated, refetch: fetchData };
}

// Hook for offline-capable rewards data
export function useOfflineRewards<T>(
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean }
) {
  const { isOnline } = useOnlineStatus();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = 'all-rewards';
    
    if (!isOnline) {
      console.log('[OfflineData] Offline - loading rewards from IndexedDB');
      const cached = await loadFromStore<T>('rewards', cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setLastUpdated(new Date(cached.cachedAt));
        setIsLoading(false);
        return;
      }
      setError(new Error('Keine Internetverbindung und keine gespeicherten Daten'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await queryFn();
      setData(result);
      setIsFromCache(false);
      setLastUpdated(new Date());
      
      await saveToStore('rewards', cacheKey, result);
      console.log('[OfflineData] Saved rewards to IndexedDB');
    } catch (err) {
      console.log('[OfflineData] Network error, trying cache:', err);
      
      const cached = await loadFromStore<T>('rewards', cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setLastUpdated(new Date(cached.cachedAt));
      } else {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queryFn]);

  useEffect(() => {
    if (options?.enabled === false) return;
    fetchData();
  }, [fetchData, options?.enabled]);

  return { data, isLoading, isFromCache, error, lastUpdated, refetch: fetchData };
}

// Hook for offline-capable partner details
export function useOfflinePartnerDetails<T>(
  slug: string,
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean }
) {
  const { isOnline } = useOnlineStatus();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = `partner-${slug}`;
    
    if (!isOnline) {
      const cached = await loadFromStore<T>('partnerDetails', cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setIsLoading(false);
        return;
      }
      setError(new Error('Keine Internetverbindung und keine gespeicherten Daten'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await queryFn();
      setData(result);
      setIsFromCache(false);
      
      await saveToStore('partnerDetails', cacheKey, result);
    } catch (err) {
      const cached = await loadFromStore<T>('partnerDetails', cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, slug, queryFn]);

  useEffect(() => {
    if (options?.enabled === false || !slug) return;
    fetchData();
  }, [fetchData, options?.enabled, slug]);

  return { data, isLoading, isFromCache, error, refetch: fetchData };
}

// Utility to prefetch all partners and rewards for offline use
export async function prefetchOfflineData(
  fetchPartners: () => Promise<unknown>,
  fetchRewards: () => Promise<unknown>
) {
  try {
    console.log('[OfflineData] Prefetching data for offline use...');
    
    const [partners, rewards] = await Promise.all([
      fetchPartners(),
      fetchRewards(),
    ]);
    
    await Promise.all([
      saveToStore('partners', 'all-partners', partners),
      saveToStore('rewards', 'all-rewards', rewards),
    ]);
    
    console.log('[OfflineData] Prefetch complete');
    return true;
  } catch (error) {
    console.error('[OfflineData] Prefetch failed:', error);
    return false;
  }
}

// Clear all offline data
export async function clearOfflineData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
