import { useState, useEffect, useCallback } from 'react';
import { NeonThemeSettings } from '../types/player';

export const NEON_PRESETS: Record<string, { name: string; hue: number; hex: string }> = {
  'electric-cyan': { name: 'Electric Cyan', hue: 188, hex: '#00f0ff' },
  'cyber-blue': { name: 'Cyber Neon Blue', hue: 215, hex: '#0084ff' },
  'synth-purple': { name: 'Synthwave Violet', hue: 275, hex: '#a855f7' },
  'matrix-green': { name: 'Acid Matrix Emerald', hue: 150, hex: '#10b981' },
  'neon-pink': { name: 'Cyberpunk Pink', hue: 325, hex: '#ec4899' },
  'solar-amber': { name: 'Solar Amber', hue: 38, hex: '#f59e0b' },
};

const DEFAULT_SETTINGS: NeonThemeSettings = {
  presetId: 'electric-cyan',
  hue: 188,
  saturation: 100,
  lightness: 50,
  intensity: 1.0,
  reactiveAudioGlow: true,
  showCyberGrid: true,
  ambientBacklight: true,
};

const STORAGE_KEY = 'neonloop_lighting_settings_v1';

export function useNeonTheme() {
  const [settings, setSettings] = useState<NeonThemeSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Apply CSS variables to root
  const applyThemeToDOM = useCallback((current: NeonThemeSettings, dynamicBoost = 0) => {
    const root = document.documentElement;
    const effIntensity = Math.min(2.5, current.intensity * (1 + dynamicBoost));
    
    root.style.setProperty('--neon-hue', `${current.hue}`);
    root.style.setProperty('--neon-saturation', `${current.saturation}%`);
    root.style.setProperty('--neon-lightness', `${current.lightness}%`);
    root.style.setProperty(
      '--neon-color',
      `hsl(${current.hue}, ${current.saturation}%, ${current.lightness}%)`
    );
    root.style.setProperty(
      '--neon-color-dim',
      `hsla(${current.hue}, ${current.saturation}%, ${current.lightness}%, 0.3)`
    );
    root.style.setProperty(
      '--neon-color-bright',
      `hsl(${current.hue}, 100%, 75%)`
    );
    root.style.setProperty('--neon-intensity', `${effIntensity}`);
  }, []);

  useEffect(() => {
    applyThemeToDOM(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, applyThemeToDOM]);

  const updateSetting = <K extends keyof NeonThemeSettings>(
    key: K,
    value: NeonThemeSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'presetId' && typeof value === 'string' && NEON_PRESETS[value]) {
        next.hue = NEON_PRESETS[value].hue;
      }
      return next;
    });
  };

  const setPreset = (presetId: NeonThemeSettings['presetId']) => {
    if (NEON_PRESETS[presetId]) {
      setSettings((prev) => ({
        ...prev,
        presetId,
        hue: NEON_PRESETS[presetId].hue,
      }));
    }
  };

  const setCustomHue = (hue: number) => {
    setSettings((prev) => ({
      ...prev,
      presetId: 'custom',
      hue,
    }));
  };

  return {
    settings,
    updateSetting,
    setPreset,
    setCustomHue,
    applyThemeToDOM,
    presets: NEON_PRESETS,
  };
}
