/**
 * Haptic Feedback Utilities
 * Provides tactile feedback on supported mobile devices
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50],
};

/**
 * Trigger haptic feedback if supported
 * @param pattern - The type of haptic feedback
 */
export function hapticFeedback(pattern: HapticPattern = 'light'): void {
  // Check if Vibration API is supported
  if (!('vibrate' in navigator)) {
    return;
  }
  
  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    // Silently fail if vibration is not allowed
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Trigger haptic feedback for button press
 */
export function hapticPress(): void {
  hapticFeedback('light');
}

/**
 * Trigger haptic feedback for successful action
 */
export function hapticSuccess(): void {
  hapticFeedback('success');
}

/**
 * Trigger haptic feedback for toggle actions (like play/pause)
 */
export function hapticToggle(): void {
  hapticFeedback('medium');
}
