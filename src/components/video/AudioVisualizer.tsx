import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioElement?: HTMLAudioElement | null;
  isActive: boolean;
  variant?: 'bars' | 'wave' | 'circle';
  className?: string;
}

export const AudioVisualizer = ({ 
  audioElement, 
  isActive, 
  variant = 'bars',
  className 
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isActive || !audioElement) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const setupAudio = async () => {
      try {
        // Create or resume audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Create analyser if not exists
        if (!analyserRef.current) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }

        // Connect source to analyser (only once per audio element)
        if (!sourceRef.current && audioElement) {
          try {
            sourceRef.current = audioContext.createMediaElementSource(audioElement);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContext.destination);
          } catch (e) {
            // Source may already be connected
            console.log('Audio source already connected');
          }
        }

        // Start visualization
        draw();
      } catch (error) {
        console.error('Audio visualizer setup error:', error);
      }
    };

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current || !isActive) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (variant === 'bars') {
        drawBars(ctx, canvas, dataArray, bufferLength);
      } else if (variant === 'wave') {
        drawWave(ctx, canvas, dataArray, bufferLength);
      } else if (variant === 'circle') {
        drawCircle(ctx, canvas, dataArray, bufferLength);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    setupAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isActive, variant]);

  const drawBars = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, 'hsl(200, 50%, 66%)');
      gradient.addColorStop(0.5, 'hsl(280, 80%, 60%)');
      gradient.addColorStop(1, 'hsl(44, 98%, 49%)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      
      x += barWidth;
    }
  };

  const drawWave = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'hsl(200, 50%, 66%)';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'hsl(280, 80%, 60%)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircle = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    dataArray: Uint8Array, 
    bufferLength: number
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const amplitude = (dataArray[i] / 255) * radius * 0.5;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + amplitude);
      const y2 = centerY + Math.sin(angle) * (radius + amplitude);

      const hue = (i / bufferLength) * 360;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("pointer-events-none", className)}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-full"
      />
    </motion.div>
  );
};

// Standalone visualizer that creates its own audio from microphone
export const MicrophoneVisualizer = ({ 
  isActive, 
  className 
}: { 
  isActive: boolean; 
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bars, setBars] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    if (!isActive) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationId: number | null = null;
    let stream: MediaStream | null = null;

    const setup = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const animate = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          
          // Take 20 samples evenly distributed
          const newBars = [];
          const step = Math.floor(dataArray.length / 20);
          for (let i = 0; i < 20; i++) {
            newBars.push(dataArray[i * step] / 255);
          }
          setBars(newBars);
          
          animationId = requestAnimationFrame(animate);
        };

        animate();
      } catch (error) {
        console.error('Microphone access error:', error);
      }
    };

    setup();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioContext) audioContext.close();
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("flex items-end justify-center gap-[2px] h-8", className)}
    >
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{
            background: `linear-gradient(to top, hsl(200, 50%, 66%), hsl(280, 80%, 60%))`,
          }}
          animate={{
            height: `${Math.max(4, height * 32)}px`,
          }}
          transition={{ duration: 0.05 }}
        />
      ))}
    </motion.div>
  );
};

export default AudioVisualizer;
