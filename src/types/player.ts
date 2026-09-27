/**
 * NeonLoop Media Player - Type Definitions
 */

export interface MediaSegment {
  id: string;
  name: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  repeatCount: number; // e.g. 4 times
  pauseDelay: number;  // delay in seconds before each repeat (e.g. 0.5s)
  color?: string;
}

export interface LoopPreset {
  id: string;
  title: string;
  fileIdentifier: string; // file name or hash
  mediaType: 'audio' | 'video';
  duration: number;
  segments: MediaSegment[];
  autoAdvance: boolean;
  loopAll: boolean;
  defaultDelay: number;
  createdAt: number;
  updatedAt: number;
}

export interface NeonThemeSettings {
  presetId: 'electric-cyan' | 'cyber-blue' | 'synth-purple' | 'matrix-green' | 'neon-pink' | 'solar-amber' | 'custom';
  hue: number;
  saturation: number;
  lightness: number;
  intensity: number; // 0.2 to 2.0
  reactiveAudioGlow: boolean; // pulses with audio spectrum
  showCyberGrid: boolean;
  ambientBacklight: boolean;
}

export type PlaybackMode = 'normal' | 'step-loop' | 'single-loop';

export interface ExportProgress {
  isExporting: boolean;
  progress: number; // 0 to 100
  statusText: string;
  downloadUrl?: string;
  downloadFileName?: string;
  error?: string;
}
