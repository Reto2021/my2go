import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Video, 
  Square, 
  Download, 
  Share2, 
  RotateCcw,
  Timer,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Participant } from '@/hooks/useLiveKitRoom';
import { Room, Track } from 'livekit-client';

interface DuetRecorderProps {
  localParticipant: Participant | null;
  remoteParticipant: Participant | null;
  room: Room | null;
  songTitle?: string;
  onClose: () => void;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'preview' | 'exporting';

export const DuetRecorder = ({
  localParticipant,
  remoteParticipant,
  room,
  songTitle,
  onClose
}: DuetRecorderProps) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECORDING_TIME = 60; // 60 seconds max

  // Attach video tracks
  useEffect(() => {
    if (!room) return;

    // Local video
    if (localVideoRef.current) {
      const localTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
      if (localTrack) {
        localTrack.attach(localVideoRef.current);
      }
    }

    // Remote video
    if (remoteVideoRef.current && remoteParticipant) {
      const remoteP = room.remoteParticipants.get(remoteParticipant.identity);
      if (remoteP) {
        const remoteTrack = remoteP.getTrackPublication(Track.Source.Camera)?.track;
        if (remoteTrack) {
          remoteTrack.attach(remoteVideoRef.current);
        }
      }
    }

    return () => {
      const localTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
      if (localTrack) localTrack.detach();
      
      if (remoteParticipant) {
        const remoteP = room.remoteParticipants.get(remoteParticipant.identity);
        if (remoteP) {
          const remoteTrack = remoteP.getTrackPublication(Track.Source.Camera)?.track;
          if (remoteTrack) remoteTrack.detach();
        }
      }
    };
  }, [room, remoteParticipant]);

  // Draw split-screen to canvas
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;
    
    if (!canvas || !ctx) return;
    
    // Set canvas size for vertical split (portrait mode)
    canvas.width = 720;
    canvas.height = 1280;
    
    // Draw black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const halfHeight = canvas.height / 2;
    
    // Draw local video (top half, mirrored)
    if (localVideo && localVideo.readyState >= 2) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      const aspectRatio = localVideo.videoWidth / localVideo.videoHeight;
      let drawWidth = canvas.width;
      let drawHeight = halfHeight;
      
      if (aspectRatio > canvas.width / halfHeight) {
        drawHeight = canvas.width / aspectRatio;
      } else {
        drawWidth = halfHeight * aspectRatio;
      }
      
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (halfHeight - drawHeight) / 2;
      
      ctx.drawImage(localVideo, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
    }
    
    // Draw remote video (bottom half)
    if (remoteVideo && remoteVideo.readyState >= 2) {
      const aspectRatio = remoteVideo.videoWidth / remoteVideo.videoHeight;
      let drawWidth = canvas.width;
      let drawHeight = halfHeight;
      
      if (aspectRatio > canvas.width / halfHeight) {
        drawHeight = canvas.width / aspectRatio;
      } else {
        drawWidth = halfHeight * aspectRatio;
      }
      
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = halfHeight + (halfHeight - drawHeight) / 2;
      
      ctx.drawImage(remoteVideo, offsetX, offsetY, drawWidth, drawHeight);
    }
    
    // Draw divider line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(canvas.width, halfHeight);
    ctx.stroke();
    
    // Draw names
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    
    // Draw name badges with background
    const drawNameBadge = (name: string, y: number) => {
      const padding = 10;
      const metrics = ctx.measureText(name);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(20, y - 24, metrics.width + padding * 2, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(name, 20 + padding, y);
    };
    
    if (localParticipant) {
      drawNameBadge(localParticipant.name, halfHeight - 20);
    }
    if (remoteParticipant) {
      drawNameBadge(remoteParticipant.name, canvas.height - 20);
    }
    
    // Continue animation loop during recording
    if (recordingState === 'recording' || recordingState === 'countdown') {
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    }
  }, [localParticipant, remoteParticipant, recordingState]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setRecordingState('countdown');
    setCountdown(3);
    
    // Play countdown sound
    const playBeep = (freq: number) => {
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        console.log('Audio not supported');
      }
    };
    
    playBeep(440);
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count > 0) {
        playBeep(440);
      } else {
        playBeep(880);
        clearInterval(countdownInterval);
        startRecording();
      }
    }, 1000);
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setRecordingState('recording');
    setRecordingTime(0);
    chunksRef.current = [];
    
    // Start drawing frames
    animationFrameRef.current = requestAnimationFrame(drawFrame);
    
    // Create media stream from canvas
    const stream = canvas.captureStream(30);
    
    // Add audio if available
    if (room) {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      // Try to add local audio
      const localAudioTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      if (localAudioTrack) {
        const audioEl = document.createElement('audio');
        localAudioTrack.attach(audioEl);
        const source = audioContext.createMediaElementSource(audioEl);
        source.connect(destination);
      }
      
      // Add audio tracks to stream
      destination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    }
    
    // Create MediaRecorder
    const options = { mimeType: 'video/webm;codecs=vp9' };
    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options);
    } catch (e) {
      mediaRecorderRef.current = new MediaRecorder(stream);
    }
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setRecordingState('preview');
    };
    
    mediaRecorderRef.current.start(1000);
    
    // Recording timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= MAX_RECORDING_TIME) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
  }, [drawFrame, room]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Reset recording
  const resetRecording = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
  }, [previewUrl]);

  // Download video
  const downloadVideo = useCallback(() => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duet-${songTitle || 'dance'}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Video heruntergeladen! 🎬');
  }, [recordedBlob, songTitle]);

  // Share video
  const shareVideo = useCallback(async () => {
    if (!recordedBlob) return;
    
    const file = new File([recordedBlob], `duet-${Date.now()}.webm`, { type: 'video/webm' });
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: '🎬 Unser Duett!',
          text: songTitle ? `Unser Duett zu "${songTitle}" 💃🕺` : 'Schau dir unser Duett an! 💃🕺',
          files: [file]
        });
        toast.success('Video geteilt! 🎉');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          downloadVideo();
        }
      }
    } else {
      downloadVideo();
    }
  }, [recordedBlob, songTitle, downloadVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [previewUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Split-screen preview / recording area */}
      <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
        {/* Hidden video elements for capture */}
        <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
        <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
        
        {/* Canvas for combined view */}
        <canvas 
          ref={canvasRef} 
          className={cn(
            "w-full h-full object-contain",
            recordingState === 'preview' && "hidden"
          )}
        />
        
        {/* Preview video */}
        {recordingState === 'preview' && previewUrl && (
          <video 
            src={previewUrl} 
            autoPlay 
            loop 
            playsInline
            className="w-full h-full object-contain"
          />
        )}
        
        {/* Countdown overlay */}
        <AnimatePresence>
          {recordingState === 'countdown' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-8xl font-bold text-white"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Recording indicator */}
        {recordingState === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            <span className="text-xs opacity-75">/ {formatTime(MAX_RECORDING_TIME)}</span>
          </div>
        )}
        
        {/* Waiting for partner */}
        {!remoteParticipant && recordingState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Warte auf deinen Duett-Partner...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-4">
        {recordingState === 'idle' && (
          <>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Abbrechen
            </Button>
            <Button
              onClick={startCountdown}
              disabled={!remoteParticipant}
              className="bg-red-500 hover:bg-red-600 gap-2"
            >
              <Video className="h-4 w-4" />
              Aufnahme starten
            </Button>
          </>
        )}
        
        {recordingState === 'recording' && (
          <Button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 gap-2"
          >
            <Square className="h-4 w-4" />
            Stoppen
          </Button>
        )}
        
        {recordingState === 'preview' && (
          <>
            <Button
              variant="outline"
              onClick={resetRecording}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Neu
            </Button>
            <Button
              variant="outline"
              onClick={downloadVideo}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={shareVideo}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Teilen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DuetRecorder;
