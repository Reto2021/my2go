/**
 * AI Sound Processing Engine
 * Uses Web Audio API to apply per-song EQ, compression, and loudness normalization.
 * Controlled via a manual toggle so the user can A/B compare.
 */

const STORAGE_KEY = 'radio2go_ai_sound';

export interface EQPreset {
  preset: string;
  label: string;
  bands: number[]; // 5-band gains in dB: [low, low-mid, mid, high-mid, high]
  compressor: { threshold: number; ratio: number; attack: number; release: number };
  description: string;
}

// Band center frequencies for 5-band parametric EQ
const BAND_FREQUENCIES = [80, 300, 1000, 3500, 12000];
const BAND_Q_VALUES = [0.7, 1.0, 1.2, 1.0, 0.7];

// Crossfade duration for EQ transitions in seconds
const CROSSFADE_DURATION = 1.5;

interface ProcessorState {
  context: AudioContext | null;
  source: MediaElementAudioSourceNode | null;
  bands: BiquadFilterNode[];
  compressor: DynamicsCompressorNode | null;
  makeupGain: GainNode | null;
  bypassGain: GainNode | null;
  processedGain: GainNode | null;
  isConnected: boolean;
  isEnabled: boolean;
  currentPreset: EQPreset | null;
  audioElement: HTMLAudioElement | null;
}

const state: ProcessorState = {
  context: null,
  source: null,
  bands: [],
  compressor: null,
  makeupGain: null,
  bypassGain: null,
  processedGain: null,
  isConnected: false,
  isEnabled: loadEnabledState(),
  currentPreset: null,
  audioElement: null,
};

// In-flight request tracking
let currentClassifyAbort: AbortController | null = null;
let lastClassifiedSong = '';

// Listeners
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(l => l());
}

function loadEnabledState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isAISoundEnabled(): boolean {
  return state.isEnabled;
}

export function setAISoundEnabled(enabled: boolean) {
  state.isEnabled = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}

  if (state.isConnected) {
    crossfade(enabled);
  }
  notifyListeners();
}

export function getCurrentPreset(): EQPreset | null {
  return state.currentPreset;
}

export function subscribeProcessor(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Connect the audio processor to an HTMLAudioElement.
 * Must be called ONCE per audio element. Safe to call multiple times.
 */
export function connectProcessor(audio: HTMLAudioElement) {
  // Don't reconnect to same element
  if (state.isConnected && state.audioElement === audio) return;

  // Disconnect previous if exists
  if (state.isConnected) {
    disconnectProcessor();
  }

  try {
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);

    // Create 5-band parametric EQ
    const bands: BiquadFilterNode[] = BAND_FREQUENCIES.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = BAND_Q_VALUES[i];
      filter.gain.value = 0;
      return filter;
    });

    // Compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 2;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.25;
    compressor.knee.value = 6;

    // Makeup gain
    const makeupGain = ctx.createGain();
    makeupGain.gain.value = 1.0;

    // Two parallel paths
    const bypassGain = ctx.createGain();
    const processedGain = ctx.createGain();

    // Bypass path: source → bypassGain → destination
    source.connect(bypassGain);
    bypassGain.connect(ctx.destination);

    // Processed path: source → EQ bands → compressor → makeupGain → processedGain → destination
    let lastNode: AudioNode = source;
    for (const band of bands) {
      lastNode.connect(band);
      lastNode = band;
    }
    lastNode.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(processedGain);
    processedGain.connect(ctx.destination);

    // Set initial gain state
    if (state.isEnabled) {
      bypassGain.gain.value = 0;
      processedGain.gain.value = 1;
    } else {
      bypassGain.gain.value = 1;
      processedGain.gain.value = 0;
    }

    state.context = ctx;
    state.source = source;
    state.bands = bands;
    state.compressor = compressor;
    state.makeupGain = makeupGain;
    state.bypassGain = bypassGain;
    state.processedGain = processedGain;
    state.isConnected = true;
    state.audioElement = audio;

    console.log('[AI Sound] Processor connected');
  } catch (e) {
    console.error('[AI Sound] Failed to connect:', e);
  }
}

export function disconnectProcessor() {
  if (state.source) {
    try { state.source.disconnect(); } catch {}
  }
  if (state.context) {
    try { state.context.close(); } catch {}
  }
  state.source = null;
  state.context = null;
  state.bands = [];
  state.compressor = null;
  state.makeupGain = null;
  state.bypassGain = null;
  state.processedGain = null;
  state.isConnected = false;
  state.currentPreset = null;
  state.audioElement = null;
  currentClassifyAbort = null;
  lastClassifiedSong = '';
}

function crossfade(toProcessed: boolean) {
  if (!state.context || !state.bypassGain || !state.processedGain) return;

  const now = state.context.currentTime;

  if (toProcessed) {
    state.bypassGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
    state.processedGain.gain.linearRampToValueAtTime(1, now + CROSSFADE_DURATION);
  } else {
    state.bypassGain.gain.linearRampToValueAtTime(1, now + CROSSFADE_DURATION);
    state.processedGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
  }
}

export function applyPreset(preset: EQPreset) {
  if (!state.isConnected || !state.context) return;

  state.currentPreset = preset;
  const now = state.context.currentTime;

  state.bands.forEach((band, i) => {
    const gain = preset.bands[i] || 0;
    band.gain.cancelScheduledValues(now);
    band.gain.linearRampToValueAtTime(gain, now + CROSSFADE_DURATION);
  });

  if (state.compressor) {
    const c = preset.compressor;
    state.compressor.threshold.linearRampToValueAtTime(c.threshold, now + CROSSFADE_DURATION);
    state.compressor.ratio.linearRampToValueAtTime(c.ratio, now + CROSSFADE_DURATION);
    state.compressor.attack.linearRampToValueAtTime(c.attack, now + CROSSFADE_DURATION);
    state.compressor.release.linearRampToValueAtTime(c.release, now + CROSSFADE_DURATION);
  }

  if (state.makeupGain) {
    const avgGain = preset.bands.reduce((a, b) => a + b, 0) / preset.bands.length;
    const makeup = 1.0 + (Math.abs(preset.compressor.threshold + 24) / 40) - (avgGain / 20);
    state.makeupGain.gain.linearRampToValueAtTime(
      Math.max(0.7, Math.min(1.4, makeup)),
      now + CROSSFADE_DURATION
    );
  }

  notifyListeners();
  console.log(`[AI Sound] ${preset.label}: ${preset.description}`);
}

/**
 * Classify a song via AI and apply optimal EQ.
 */
export async function classifySong(title: string, artist: string) {
  if (!state.isEnabled || !state.isConnected) return;
  if (!title || !artist || title === 'Unknown' || artist === 'Unknown Artist') return;

  const key = `${artist}::${title}`;
  if (key === lastClassifiedSong) return;

  if (currentClassifyAbort) currentClassifyAbort.abort();
  const controller = new AbortController();
  currentClassifyAbort = controller;
  lastClassifiedSong = key;

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-song`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ title, artist }),
      signal: controller.signal,
    });

    if (!res.ok) return;
    const preset: EQPreset = await res.json();
    if (!controller.signal.aborted) {
      applyPreset(preset);
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      console.error('[AI Sound] Classify error:', e);
    }
  }
}
