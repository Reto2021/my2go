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
  bypassGain: GainNode | null;  // direct connection (bypass)
  processedGain: GainNode | null; // processed chain
  isConnected: boolean;
  isEnabled: boolean;
  currentPreset: EQPreset | null;
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
};

// In-flight request tracking to avoid duplicate API calls for same song
let currentClassifyAbort: AbortController | null = null;
let lastClassifiedSong = '';

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
}

export function getCurrentPreset(): EQPreset | null {
  return state.currentPreset;
}

/**
 * Connect the audio processor to an HTMLAudioElement.
 * Must be called ONCE when the audio element is created.
 */
export function connectProcessor(audio: HTMLAudioElement) {
  // Don't reconnect if already connected to same element
  if (state.isConnected && state.source) return;

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

    // Compressor for loudness normalization
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 2;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.25;
    compressor.knee.value = 6;

    // Makeup gain to compensate for compression
    const makeupGain = ctx.createGain();
    makeupGain.gain.value = 1.0;

    // Two parallel paths: bypass and processed
    const bypassGain = ctx.createGain();
    const processedGain = ctx.createGain();

    // Chain: source → [bands] → compressor → makeupGain → processedGain → destination
    // Also: source → bypassGain → destination
    source.connect(bypassGain);
    bypassGain.connect(ctx.destination);

    // EQ chain
    let lastNode: AudioNode = source;
    for (const band of bands) {
      lastNode.connect(band);
      lastNode = band;
    }
    lastNode.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(processedGain);
    processedGain.connect(ctx.destination);

    // Set initial crossfade state
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

    console.log('[AudioProcessor] Connected');
  } catch (e) {
    console.error('[AudioProcessor] Failed to connect:', e);
  }
}

/**
 * Disconnect and clean up
 */
export function disconnectProcessor() {
  if (state.source) {
    try {
      state.source.disconnect();
    } catch {}
  }
  if (state.context) {
    try {
      state.context.close();
    } catch {}
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
  currentClassifyAbort = null;
  lastClassifiedSong = '';
}

/**
 * Crossfade between bypass and processed signal
 */
function crossfade(toProcessed: boolean) {
  if (!state.context || !state.bypassGain || !state.processedGain) return;

  const now = state.context.currentTime;
  const duration = CROSSFADE_DURATION;

  if (toProcessed) {
    state.bypassGain.gain.linearRampToValueAtTime(0, now + duration);
    state.processedGain.gain.linearRampToValueAtTime(1, now + duration);
  } else {
    state.bypassGain.gain.linearRampToValueAtTime(1, now + duration);
    state.processedGain.gain.linearRampToValueAtTime(0, now + duration);
  }
}

/**
 * Apply an EQ preset with smooth transitions
 */
export function applyPreset(preset: EQPreset) {
  if (!state.isConnected || !state.context) return;

  state.currentPreset = preset;
  const now = state.context.currentTime;
  const rampTime = CROSSFADE_DURATION;

  // Smoothly transition each EQ band
  state.bands.forEach((band, i) => {
    const targetGain = preset.bands[i] || 0;
    band.gain.cancelScheduledValues(now);
    band.gain.linearRampToValueAtTime(targetGain, now + rampTime);
  });

  // Update compressor
  if (state.compressor) {
    const c = preset.compressor;
    state.compressor.threshold.linearRampToValueAtTime(c.threshold, now + rampTime);
    state.compressor.ratio.linearRampToValueAtTime(c.ratio, now + rampTime);
    state.compressor.attack.linearRampToValueAtTime(c.attack, now + rampTime);
    state.compressor.release.linearRampToValueAtTime(c.release, now + rampTime);
  }

  // Adjust makeup gain based on compression (louder compression = more makeup)
  if (state.makeupGain) {
    const avgBandGain = preset.bands.reduce((a, b) => a + b, 0) / preset.bands.length;
    // Compensate: more compression → more makeup, more EQ boost → slightly less makeup
    const makeup = 1.0 + (Math.abs(preset.compressor.threshold + 24) / 40) - (avgBandGain / 20);
    state.makeupGain.gain.linearRampToValueAtTime(Math.max(0.7, Math.min(1.4, makeup)), now + rampTime);
  }

  console.log(`[AudioProcessor] Applied preset: ${preset.label} (${preset.description})`);
}

/**
 * Classify a song and apply the optimal EQ.
 * Called whenever the now-playing metadata changes.
 */
export async function classifySong(title: string, artist: string) {
  if (!state.isEnabled || !state.isConnected) return;
  if (!title || !artist || title === 'Unknown' || artist === 'Unknown Artist') return;

  const songKey = `${artist}::${title}`;
  if (songKey === lastClassifiedSong) return;

  // Abort any in-flight classification
  if (currentClassifyAbort) {
    currentClassifyAbort.abort();
  }

  const controller = new AbortController();
  currentClassifyAbort = controller;
  lastClassifiedSong = songKey;

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

    if (!res.ok) {
      console.warn('[AudioProcessor] Classification failed:', res.status);
      return;
    }

    const preset: EQPreset = await res.json();
    
    // Only apply if this is still the current song (not aborted)
    if (!controller.signal.aborted) {
      applyPreset(preset);
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      console.error('[AudioProcessor] Classification error:', e);
    }
  }
}

// Listeners for state changes
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeProcessor(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(l => l());
}

// Wrap setAISoundEnabled to notify
const _origSet = setAISoundEnabled;
(setAISoundEnabled as any) = (enabled: boolean) => {
  _origSet(enabled);
  notifyListeners();
};
