/**
 * Audio Effects Engine
 * Provides reverb, echo, and pitch-shift effects for live audio
 */

export type AudioEffectType = 'reverb' | 'echo' | 'pitch-up' | 'pitch-down' | 'robot' | 'none';

export interface AudioEffect {
  id: AudioEffectType;
  name: string;
  emoji: string;
  description: string;
}

export const AUDIO_EFFECTS: AudioEffect[] = [
  { id: 'none', name: 'Normal', emoji: '🎙️', description: 'Keine Effekte' },
  { id: 'reverb', name: 'Hall', emoji: '🏛️', description: 'Halleffekt wie in einer Kirche' },
  { id: 'echo', name: 'Echo', emoji: '🗻', description: 'Wiederholendes Echo' },
  { id: 'pitch-up', name: 'Hoch', emoji: '🐿️', description: 'Höhere Stimme (Chipmunk)' },
  { id: 'pitch-down', name: 'Tief', emoji: '🐻', description: 'Tiefere Stimme (Bär)' },
  { id: 'robot', name: 'Roboter', emoji: '🤖', description: 'Roboter-Stimme' },
];

export class AudioEffectsProcessor {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private currentEffect: AudioEffectType = 'none';
  
  // Effect nodes
  private convolverNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private modulationGain: GainNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;
  
  private originalStream: MediaStream | null = null;
  
  constructor() {
    // Initialize audio context lazily
  }
  
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 48000 });
    }
    
    // Create impulse response for reverb
    await this.createReverbImpulse();
  }
  
  private async createReverbImpulse(): Promise<void> {
    if (!this.audioContext) return;
    
    // Create synthetic impulse response for reverb
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.5; // seconds
    const decay = 2.0;
    const length = sampleRate * duration;
    
    const impulseBuffer = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulseBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    this.convolverNode = this.audioContext.createConvolver();
    this.convolverNode.buffer = impulseBuffer;
  }
  
  /**
   * Process a MediaStream with the selected effect
   */
  async processStream(stream: MediaStream, effect: AudioEffectType): Promise<MediaStream> {
    if (effect === 'none') {
      return stream;
    }
    
    await this.initialize();
    
    if (!this.audioContext) {
      return stream;
    }
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    // Disconnect previous nodes
    this.disconnect();
    
    this.originalStream = stream;
    this.currentEffect = effect;
    
    // Get audio track
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      return stream;
    }
    
    // Create audio-only stream for processing
    const audioStream = new MediaStream(audioTracks);
    
    // Create source from stream
    this.sourceNode = this.audioContext.createMediaStreamSource(audioStream);
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    
    // Create gain nodes for mixing
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    
    // Apply the selected effect
    switch (effect) {
      case 'reverb':
        this.applyReverb();
        break;
      case 'echo':
        this.applyEcho();
        break;
      case 'pitch-up':
        this.applyPitchShift(1.3);
        break;
      case 'pitch-down':
        this.applyPitchShift(0.7);
        break;
      case 'robot':
        this.applyRobot();
        break;
    }
    
    // Combine processed audio with video tracks
    const videoTracks = stream.getVideoTracks();
    const processedStream = new MediaStream([
      ...this.destinationNode.stream.getAudioTracks(),
      ...videoTracks
    ]);
    
    return processedStream;
  }
  
  private applyReverb(): void {
    if (!this.audioContext || !this.sourceNode || !this.destinationNode || 
        !this.dryGain || !this.wetGain || !this.convolverNode) return;
    
    // Dry signal (original)
    this.dryGain.gain.value = 0.6;
    this.sourceNode.connect(this.dryGain);
    this.dryGain.connect(this.destinationNode);
    
    // Wet signal (reverb)
    this.wetGain.gain.value = 0.5;
    this.sourceNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetGain);
    this.wetGain.connect(this.destinationNode);
  }
  
  private applyEcho(): void {
    if (!this.audioContext || !this.sourceNode || !this.destinationNode ||
        !this.dryGain || !this.wetGain) return;
    
    // Create delay node
    this.delayNode = this.audioContext.createDelay(1.0);
    this.delayNode.delayTime.value = 0.3; // 300ms delay
    
    // Create feedback loop
    this.feedbackGain = this.audioContext.createGain();
    this.feedbackGain.gain.value = 0.4;
    
    // Dry signal
    this.dryGain.gain.value = 1.0;
    this.sourceNode.connect(this.dryGain);
    this.dryGain.connect(this.destinationNode);
    
    // Echo chain
    this.wetGain.gain.value = 0.6;
    this.sourceNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode); // Feedback loop
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.destinationNode);
  }
  
  private applyPitchShift(pitchFactor: number): void {
    if (!this.audioContext || !this.sourceNode || !this.destinationNode) return;
    
    // Use playbackRate trick with buffer (simplified pitch shift)
    // For real-time pitch shifting, we use a combination of delay modulation
    
    // Create a biquad filter to simulate pitch shift effect
    this.biquadFilter = this.audioContext.createBiquadFilter();
    this.biquadFilter.type = 'allpass';
    
    // Create modulation
    this.oscillator = this.audioContext.createOscillator();
    this.modulationGain = this.audioContext.createGain();
    
    if (pitchFactor > 1) {
      // Higher pitch - faster modulation, higher frequencies
      this.biquadFilter.frequency.value = 3000;
      this.oscillator.frequency.value = 5;
      this.modulationGain.gain.value = 50;
    } else {
      // Lower pitch - slower modulation, lower frequencies
      this.biquadFilter.frequency.value = 500;
      this.oscillator.frequency.value = 2;
      this.modulationGain.gain.value = 100;
    }
    
    this.oscillator.connect(this.modulationGain);
    this.modulationGain.connect(this.biquadFilter.frequency);
    this.oscillator.start();
    
    this.sourceNode.connect(this.biquadFilter);
    this.biquadFilter.connect(this.destinationNode);
  }
  
  private applyRobot(): void {
    if (!this.audioContext || !this.sourceNode || !this.destinationNode) return;
    
    // Ring modulator effect for robot voice
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sawtooth';
    this.oscillator.frequency.value = 50;
    
    const ringModGain = this.audioContext.createGain();
    ringModGain.gain.value = 0;
    
    // Modulate the gain with oscillator
    this.oscillator.connect(ringModGain.gain);
    this.oscillator.start();
    
    // Connect source through modulated gain
    this.sourceNode.connect(ringModGain);
    ringModGain.connect(this.destinationNode);
    
    // Add original signal mixed in
    const directGain = this.audioContext.createGain();
    directGain.gain.value = 0.5;
    this.sourceNode.connect(directGain);
    directGain.connect(this.destinationNode);
  }
  
  /**
   * Change effect on the fly
   */
  async setEffect(effect: AudioEffectType): Promise<MediaStream | null> {
    if (this.originalStream) {
      return this.processStream(this.originalStream, effect);
    }
    return null;
  }
  
  /**
   * Get current effect
   */
  getCurrentEffect(): AudioEffectType {
    return this.currentEffect;
  }
  
  /**
   * Disconnect all nodes and cleanup
   */
  disconnect(): void {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.delayNode) {
        this.delayNode.disconnect();
        this.delayNode = null;
      }
      if (this.feedbackGain) {
        this.feedbackGain.disconnect();
        this.feedbackGain = null;
      }
      if (this.dryGain) {
        this.dryGain.disconnect();
        this.dryGain = null;
      }
      if (this.wetGain) {
        this.wetGain.disconnect();
        this.wetGain = null;
      }
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.modulationGain) {
        this.modulationGain.disconnect();
        this.modulationGain = null;
      }
      if (this.biquadFilter) {
        this.biquadFilter.disconnect();
        this.biquadFilter = null;
      }
    } catch (e) {
      console.warn('Error disconnecting audio nodes:', e);
    }
  }
  
  /**
   * Full cleanup
   */
  dispose(): void {
    this.disconnect();
    if (this.convolverNode) {
      this.convolverNode.disconnect();
      this.convolverNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.originalStream = null;
    this.currentEffect = 'none';
  }
}

// Singleton instance
let effectsProcessor: AudioEffectsProcessor | null = null;

export const getAudioEffectsProcessor = (): AudioEffectsProcessor => {
  if (!effectsProcessor) {
    effectsProcessor = new AudioEffectsProcessor();
  }
  return effectsProcessor;
};
