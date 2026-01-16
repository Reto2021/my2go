/**
 * Format seconds to mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format seconds to tier display (e.g., "30s" or "2m")
 */
export function formatTimeToTier(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins === 0) return `${seconds}s`;
  return `${mins}m`;
}
