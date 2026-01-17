/**
 * App Badging API for PWAs
 * Allows setting badge count on the app icon (Android only for PWAs)
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

// Check if the Badging API is supported
export function isBadgingSupported(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

// Set the badge count on the app icon
export async function setAppBadge(count: number): Promise<boolean> {
  if (!isBadgingSupported()) {
    console.log('[Badge] Badging API not supported');
    return false;
  }

  try {
    if (count > 0) {
      await (navigator as any).setAppBadge(count);
      console.log(`[Badge] Set badge count to ${count}`);
    } else {
      await (navigator as any).clearAppBadge();
      console.log('[Badge] Cleared badge');
    }
    return true;
  } catch (error) {
    console.error('[Badge] Error setting badge:', error);
    return false;
  }
}

// Clear the badge from the app icon
export async function clearAppBadge(): Promise<boolean> {
  if (!isBadgingSupported()) {
    console.log('[Badge] Badging API not supported');
    return false;
  }

  try {
    await (navigator as any).clearAppBadge();
    console.log('[Badge] Cleared badge');
    return true;
  } catch (error) {
    console.error('[Badge] Error clearing badge:', error);
    return false;
  }
}

// Increment the badge count by 1
export async function incrementAppBadge(): Promise<boolean> {
  const currentCount = getStoredBadgeCount();
  const newCount = currentCount + 1;
  setStoredBadgeCount(newCount);
  return setAppBadge(newCount);
}

// Decrement the badge count by 1
export async function decrementAppBadge(): Promise<boolean> {
  const currentCount = getStoredBadgeCount();
  const newCount = Math.max(0, currentCount - 1);
  setStoredBadgeCount(newCount);
  return setAppBadge(newCount);
}

// Store badge count in localStorage for persistence
const BADGE_COUNT_KEY = 'my2go_badge_count';

export function getStoredBadgeCount(): number {
  try {
    const stored = localStorage.getItem(BADGE_COUNT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function setStoredBadgeCount(count: number): void {
  try {
    localStorage.setItem(BADGE_COUNT_KEY, String(count));
  } catch {
    // Ignore storage errors
  }
}

// Restore badge count from storage (call on app init)
export async function restoreBadgeFromStorage(): Promise<void> {
  const count = getStoredBadgeCount();
  if (count > 0) {
    await setAppBadge(count);
  }
}

// Mark all notifications as read and clear badge
export async function markAllNotificationsRead(): Promise<void> {
  setStoredBadgeCount(0);
  await clearAppBadge();
}
