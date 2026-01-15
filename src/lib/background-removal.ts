import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512; // Smaller for real-time processing

let segmenterPromise: Promise<any> | null = null;

// Lazy load the segmentation model
const getSegmenter = async () => {
  if (!segmenterPromise) {
    console.log('[BackgroundRemoval] Loading segmentation model...');
    segmenterPromise = pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device: 'webgpu' }
    ).catch((err) => {
      console.error('[BackgroundRemoval] WebGPU failed, falling back to WASM:', err);
      // Fallback to WASM if WebGPU fails
      return pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512'
      );
    });
  }
  return segmenterPromise;
};

// Preload the model (call this early to reduce delay when user enables the feature)
export const preloadSegmentationModel = () => {
  getSegmenter().catch(console.error);
};

function resizeImageIfNeeded(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLVideoElement | ImageBitmap
) {
  let width = 'naturalWidth' in image ? image.naturalWidth : image.width;
  let height = 'naturalHeight' in image ? image.naturalHeight : image.height;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return { width, height };
}

export interface SegmentationResult {
  maskCanvas: HTMLCanvasElement;
  personCanvas: HTMLCanvasElement;
}

// Remove background from an image element
export const removeBackground = async (
  imageElement: HTMLImageElement
): Promise<Blob> => {
  try {
    console.log('[BackgroundRemoval] Starting background removal...');
    const segmenter = await getSegmenter();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    resizeImageIfNeeded(canvas, ctx, imageElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    console.log('[BackgroundRemoval] Running segmentation...');
    const result = await segmenter(imageData);

    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');

    outputCtx.drawImage(canvas, 0, 0);

    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;

    // Apply inverted mask to alpha channel
    for (let i = 0; i < result[0].mask.data.length; i++) {
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }

    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('[BackgroundRemoval] Background removed successfully');

    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('[BackgroundRemoval] Error:', error);
    throw error;
  }
};

// Process video frame for real-time background replacement
export const processVideoFrame = async (
  videoElement: HTMLVideoElement,
  backgroundCanvas: HTMLCanvasElement | null
): Promise<ImageData | null> => {
  try {
    const segmenter = await getSegmenter();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { width, height } = resizeImageIfNeeded(canvas, ctx, videoElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.6);

    const result = await segmenter(imageData);

    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      return null;
    }

    // Get the mask data
    const maskData = result[0].mask.data;

    // Create output with transparent background
    const outputImageData = ctx.getImageData(0, 0, width, height);
    const data = outputImageData.data;

    for (let i = 0; i < maskData.length; i++) {
      // Keep person (invert mask)
      const alpha = Math.round((1 - maskData[i]) * 255);
      data[i * 4 + 3] = alpha;
    }

    return outputImageData;
  } catch (error) {
    console.error('[BackgroundRemoval] Frame processing error:', error);
    return null;
  }
};

// Load image from blob/file
export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Check if WebGPU is available
export const isWebGPUAvailable = async (): Promise<boolean> => {
  try {
    const nav = navigator as any;
    if (!nav.gpu) return false;
    const adapter = await nav.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
};
