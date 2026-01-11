/**
 * Image optimization utilities for better performance
 */

// Supabase Storage image transformation options
interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin' | 'webp' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Generate optimized Supabase Storage URL with transformations
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return '';
  
  // Only transform Supabase storage URLs
  if (!url.includes('supabase.co/storage')) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover',
  } = options;

  const params = new URLSearchParams();
  
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  if (quality !== 80) params.set('quality', String(quality));
  if (format !== 'origin') params.set('format', format);
  if (resize !== 'cover') params.set('resize', resize);

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  url: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  if (!url.includes('supabase.co/storage')) {
    return '';
  }

  return widths
    .map(w => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

/**
 * Generate sizes attribute based on common breakpoints
 */
export function generateSizes(config: {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  default: string;
}): string {
  const parts: string[] = [];
  
  if (config.sm) parts.push(`(max-width: 640px) ${config.sm}`);
  if (config.md) parts.push(`(max-width: 768px) ${config.md}`);
  if (config.lg) parts.push(`(max-width: 1024px) ${config.lg}`);
  if (config.xl) parts.push(`(max-width: 1280px) ${config.xl}`);
  parts.push(config.default);
  
  return parts.join(', ');
}

/**
 * Preload critical images for faster LCP
 */
export function preloadCriticalImages(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Check if browser supports WebP
 */
export async function supportsWebP(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Check if browser supports AVIF
 */
export async function supportsAvif(): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgADlAgIDAwMPggAA0MA';
  });
}

/**
 * Get optimal image format based on browser support
 */
export async function getOptimalFormat(): Promise<'avif' | 'webp' | 'origin'> {
  if (await supportsAvif()) return 'avif';
  if (await supportsWebP()) return 'webp';
  return 'origin';
}
