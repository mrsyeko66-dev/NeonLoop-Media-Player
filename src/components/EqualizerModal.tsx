import React from 'react';
import { SlidersHorizontal, Volume2, Gauge, RotateCcw, X, Zap } from 'lucide-react';
import { EqualizerSettings } from '../hooks/useAudioVisualizer';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eq: EqualizerSettings;
  updateEqualizer: (partial: Partial<EqualizerSettings>) => void;
  playbackRate: number;
  changePlaybackRate: (rate: number) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  eq,
  updateEqualizer,
  playbackRate,
  changePlaybackRate,
}) => {
  if (!isOpen) return null;

  const resetEq = () => {
    updateEqualizer({ bass: 0, mid: 0, treble: 0, boost: 1.0 });
    changePlaybackRate(1.0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0b1120] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Audio Equalizer & Speed
              </h2>
              <p className="text-xs text-slate-400">
                Hardware tone control, volume preamp boost & playback tempo
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

        {/* 3-Band Equalizer Sliders */}
        <div className="mt-5 space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            3-Band Parametric EQ
          </label>

          {/* Bass */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">Bass (120 Hz)</span>
              <span className="font-mono text-cyan-400 font-bold">{eq.bass > 0 ? `+${eq.bass}` : eq.bass} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eq.bass}
              onChange={(e) => updateEqualizer({ bass: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Mid */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">Mid (1000 Hz)</span>
              <span className="font-mono text-cyan-400 font-bold">{eq.mid > 0 ? `+${eq.mid}` : eq.mid} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eq.mid}
              onChange={(e) => updateEqualizer({ mid: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Treble */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">Treble (4000 Hz)</span>
              <span className="font-mono text-cyan-400 font-bold">{eq.treble > 0 ? `+${eq.treble}` : eq.treble} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eq.treble}
              onChange={(e) => updateEqualizer({ treble: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Volume Preamp Boost */}
        <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Volume Preamp Boost
            </span>
            <span className="font-mono text-amber-400 font-bold">{Math.round(eq.boost * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={eq.boost}
            onChange={(e) => updateEqualizer({ boost: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>50%</span>
            <span>100% (Normal)</span>
            <span>200% (Max Boost)</span>
          </div>
        </div>

        {/* Playback Tempo Speed */}
        <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Playback Speed
            </span>
            <span className="font-mono text-cyan-400 font-bold">{playbackRate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="2.5"
            step="0.05"
            value={playbackRate}
            onChange={(e) => changePlaybackRate(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
          />
          {/* Quick speed buttons */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => changePlaybackRate(rate)}
                className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-all ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={resetEq}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
