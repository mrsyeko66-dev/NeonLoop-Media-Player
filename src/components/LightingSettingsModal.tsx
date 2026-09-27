import React from 'react';
import { Sparkles, Sliders, Sun, Activity, Grid, X, RotateCcw } from 'lucide-react';
import { useNeonTheme } from '../hooks/useNeonTheme';
import { NeonThemeSettings } from '../types/player';

interface LightingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  neonHook: ReturnType<typeof useNeonTheme>;
}

export const LightingSettingsModal: React.FC<LightingSettingsModalProps> = ({
  isOpen,
  onClose,
  neonHook,
}) => {
  const { settings, updateSetting, setPreset, setCustomHue, presets } = neonHook;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-[var(--neon-color)] rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Neon top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--neon-color)] shadow-[0_0_12px_var(--neon-color)]" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--neon-color-dim)',
                borderColor: 'var(--neon-color)',
                boxShadow: '0 0 14px var(--neon-color-dim)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Neon Lighting & Theme
              </h2>
              <p className="text-xs text-slate-400">
                Customize your futuristic player glow & reactive cyber illumination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Presets */}
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
            Neon Color Palette
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(presets).map(([key, item]) => {
              const isSelected = settings.presetId === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreset(key as NeonThemeSettings['presetId'])}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-white bg-slate-800/90 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  }`}
                  style={isSelected ? { borderColor: item.hex, boxShadow: `0 0 12px ${item.hex}40` } : {}}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                    style={{
                      backgroundColor: item.hex,
                      boxShadow: `0 0 8px ${item.hex}`,
                    }}
                  />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hue Slider */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Custom Hue Angle
            </span>
            <span className="font-mono text-cyan-400">{Math.round(settings.hue)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={settings.hue}
            onChange={(e) => setCustomHue(Number(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer appearance-none"
            style={{
              background:
                'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            }}
          />
        </div>

        {/* Glow Intensity Slider */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-yellow-400" /> Glow Intensity
            </span>
            <span className="font-mono text-yellow-300">{settings.intensity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.2"
            step="0.1"
            value={settings.intensity}
            onChange={(e) => updateSetting('intensity', Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-[var(--neon-color)]"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Subtle (0.2x)</span>
            <span>Balanced (1.0x)</span>
            <span>Overdrive (2.2x)</span>
          </div>
        </div>

        {/* Interactive Lighting Options */}
        <div className="mt-5 space-y-3 pt-4 border-t border-slate-800">
          {/* Audio Reactive */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Audio Reactive Glow Pulse</p>
                <p className="text-[11px] text-slate-400">Pulsates ambient neon lighting in sync with bass and audio spectrum</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reactiveAudioGlow}
                onChange={(e) => updateSetting('reactiveAudioGlow', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--neon-color)]"></div>
            </label>
          </div>

          {/* Ambient Backlight */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Player Ambient Halo Backlight</p>
                <p className="text-[11px] text-slate-400">Casts a soft luminous cyber halo behind the video / audio stage</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.ambientBacklight}
                onChange={(e) => updateSetting('ambientBacklight', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--neon-color)]"></div>
            </label>
          </div>

          {/* Cyber Grid */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Grid className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Cyber Matrix Grid Pattern</p>
                <p className="text-[11px] text-slate-400">Renders high-tech perspective background grid</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCyberGrid}
                onChange={(e) => updateSetting('showCyberGrid', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--neon-color)]"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setPreset('electric-cyan')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Default Blue
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
