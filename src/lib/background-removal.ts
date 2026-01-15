import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512; // Smaller for real-time processing
const REALTIME_DIMENSION = 256; // Even smaller for real-time video

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
  image: HTMLImageElement | HTMLVideoElement | ImageBitmap,
  maxDimension: number = MAX_IMAGE_DIMENSION
) {
  let width = 'naturalWidth' in image ? image.naturalWidth : image.width;
  let height = 'naturalHeight' in image ? image.naturalHeight : image.height;

  // For video elements, use videoWidth/videoHeight
  if (image instanceof HTMLVideoElement) {
    width = image.videoWidth;
    height = image.videoHeight;
  }

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
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

// Real-time video background processor class
export class RealtimeBackgroundProcessor {
  private isProcessing = false;
  private animationId: number | null = null;
  private segmenter: any = null;
  private inputCanvas: HTMLCanvasElement;
  private inputCtx: CanvasRenderingContext2D;
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;
  private lastMaskData: Float32Array | null = null;
  private frameSkip = 0;
  private frameCount = 0;
  private smoothingFactor = 0.7; // For temporal smoothing

  constructor() {
    this.inputCanvas = document.createElement('canvas');
    this.inputCtx = this.inputCanvas.getContext('2d', { willReadFrequently: true })!;
    this.outputCanvas = document.createElement('canvas');
    this.outputCtx = this.outputCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  async initialize(): Promise<boolean> {
    try {
      this.segmenter = await getSegmenter();
      return true;
    } catch (error) {
      console.error('[RealtimeBackground] Initialization error:', error);
      return false;
    }
  }

  async processFrame(
    videoElement: HTMLVideoElement,
    virtualBackground: string | CanvasGradient | null,
    outputElement: HTMLCanvasElement
  ): Promise<void> {
    if (this.isProcessing || !this.segmenter) return;

    this.frameCount++;
    
    // Process every 3rd frame for performance (adjust based on device)
    if (this.frameCount % 3 !== 0 && this.lastMaskData) {
      // Use cached mask for intermediate frames
      this.renderWithCachedMask(videoElement, virtualBackground, outputElement);
      return;
    }

    this.isProcessing = true;

    try {
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      if (videoWidth === 0 || videoHeight === 0) {
        this.isProcessing = false;
        return;
      }

      // Resize for processing
      let width = REALTIME_DIMENSION;
      let height = Math.round((videoHeight / videoWidth) * REALTIME_DIMENSION);
      if (height > REALTIME_DIMENSION) {
        height = REALTIME_DIMENSION;
        width = Math.round((videoWidth / videoHeight) * REALTIME_DIMENSION);
      }

      this.inputCanvas.width = width;
      this.inputCanvas.height = height;
      this.inputCtx.drawImage(videoElement, 0, 0, width, height);

      const imageData = this.inputCanvas.toDataURL('image/jpeg', 0.5);
      const result = await this.segmenter(imageData);

      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        this.isProcessing = false;
        return;
      }

      let newMaskData = result[0].mask.data;

      // Apply temporal smoothing
      if (this.lastMaskData && this.lastMaskData.length === newMaskData.length) {
        const smoothedMask = new Float32Array(newMaskData.length);
        for (let i = 0; i < newMaskData.length; i++) {
          smoothedMask[i] = this.lastMaskData[i] * this.smoothingFactor + 
                           newMaskData[i] * (1 - this.smoothingFactor);
        }
        newMaskData = smoothedMask;
      }

      this.lastMaskData = new Float32Array(newMaskData);

      // Render the composited frame
      this.renderComposited(videoElement, newMaskData, width, height, virtualBackground, outputElement);

    } catch (error) {
      console.error('[RealtimeBackground] Frame error:', error);
    }

    this.isProcessing = false;
  }

  private renderWithCachedMask(
    videoElement: HTMLVideoElement,
    virtualBackground: string | CanvasGradient | null,
    outputElement: HTMLCanvasElement
  ): void {
    if (!this.lastMaskData) return;

    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    let width = REALTIME_DIMENSION;
    let height = Math.round((videoHeight / videoWidth) * REALTIME_DIMENSION);
    if (height > REALTIME_DIMENSION) {
      height = REALTIME_DIMENSION;
      width = Math.round((videoWidth / videoHeight) * REALTIME_DIMENSION);
    }

    this.inputCanvas.width = width;
    this.inputCanvas.height = height;
    this.inputCtx.drawImage(videoElement, 0, 0, width, height);

    this.renderComposited(videoElement, this.lastMaskData, width, height, virtualBackground, outputElement);
  }

  private renderComposited(
    videoElement: HTMLVideoElement,
    maskData: Float32Array,
    width: number,
    height: number,
    virtualBackground: string | CanvasGradient | null,
    outputElement: HTMLCanvasElement
  ): void {
    const outputWidth = videoElement.videoWidth;
    const outputHeight = videoElement.videoHeight;

    outputElement.width = outputWidth;
    outputElement.height = outputHeight;
    const outCtx = outputElement.getContext('2d');
    if (!outCtx) return;

    // Draw background first
    if (virtualBackground) {
      if (typeof virtualBackground === 'string') {
        if (virtualBackground.startsWith('linear-gradient') || virtualBackground.startsWith('radial-gradient')) {
          // Parse CSS gradient to canvas gradient
          outCtx.fillStyle = '#1a1a2e'; // Fallback color
        } else {
          outCtx.fillStyle = virtualBackground;
        }
      } else {
        outCtx.fillStyle = virtualBackground;
      }
      outCtx.fillRect(0, 0, outputWidth, outputHeight);
    } else {
      outCtx.clearRect(0, 0, outputWidth, outputHeight);
    }

    // Draw the video frame with mask applied
    this.inputCanvas.width = width;
    this.inputCanvas.height = height;
    this.inputCtx.drawImage(videoElement, 0, 0, width, height);

    const frameData = this.inputCtx.getImageData(0, 0, width, height);
    const pixels = frameData.data;

    // Apply mask to alpha channel
    for (let i = 0; i < maskData.length; i++) {
      // Invert mask (keep person)
      const alpha = Math.round((1 - maskData[i]) * 255);
      // Apply feathering for smoother edges
      const feathered = alpha > 10 ? Math.min(255, alpha + 20) : 0;
      pixels[i * 4 + 3] = feathered;
    }

    this.inputCtx.putImageData(frameData, 0, 0);

    // Draw the masked person onto the output
    outCtx.drawImage(this.inputCanvas, 0, 0, outputWidth, outputHeight);
  }

  startProcessing(
    videoElement: HTMLVideoElement,
    virtualBackground: string | CanvasGradient | null,
    outputCanvas: HTMLCanvasElement,
    fps: number = 15
  ): void {
    const frameTime = 1000 / fps;
    let lastFrameTime = 0;

    const loop = (timestamp: number) => {
      if (timestamp - lastFrameTime >= frameTime) {
        this.processFrame(videoElement, virtualBackground, outputCanvas);
        lastFrameTime = timestamp;
      }
      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  stopProcessing(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.lastMaskData = null;
    this.frameCount = 0;
  }

  destroy(): void {
    this.stopProcessing();
  }
}

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
