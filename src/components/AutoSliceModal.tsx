import React, { useState } from 'react';
import { Scissors, X, Check, Clock, RotateCcw } from 'lucide-react';

interface AutoSliceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaDuration: number;
  onApplySlice: (intervalSeconds: number, repeatCount: number, pauseDelay: number) => void;
}

export const AutoSliceModal: React.FC<AutoSliceModalProps> = ({
  isOpen,
  onClose,
  mediaDuration,
  onApplySlice,
}) => {
  const [interval, setInterval] = useState<number>(5);
  const [repeats, setRepeats] = useState<number>(4);
  const [pause, setPause] = useState<number>(0.3);

  if (!isOpen) return null;

  const totalSegments = Math.ceil(mediaDuration / interval);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplySlice(interval, repeats, pause);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0b1120] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Auto-Slice Generator
              </h2>
              <p className="text-xs text-slate-400">
                Instantly partition media into automated repeated intervals
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quick presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Preset Intervals
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setInterval(sec)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    interval === sec
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {sec} Seconds
                </button>
              ))}
            </div>
          </div>

          {/* Interval Input */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Segment Duration:</span>
              <span className="font-mono text-cyan-400 font-bold">{interval}s per segment</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Repeat count per segment */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Repetitions Per Segment:</span>
              <span className="font-mono text-cyan-400 font-bold">{repeats} times</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={repeats}
              onChange={(e) => setRepeats(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Pause delay */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Pause Between Repeats:</span>
              <span className="font-mono text-cyan-400 font-bold">{pause.toFixed(1)}s delay</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={pause}
              onChange={(e) => setPause(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Generated Result Preview */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Will generate <strong>{totalSegments} segments</strong>
            </span>
            <span className="font-mono text-cyan-400">Total {totalSegments * repeats} loops</span>
          </div>

          <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg hover:shadow-cyan-500/30 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Generate Chunks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
