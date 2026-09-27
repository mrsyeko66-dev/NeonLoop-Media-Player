import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Scissors,
  Repeat,
  Sparkles,
  ArrowRight,
  Clock,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Check,
  Gauge,
  Layers,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { MediaSegment, PlaybackMode } from '../types/player';

interface LoopControllerPanelProps {
  segments: MediaSegment[];
  activeSegment: MediaSegment | null;
  currentSegmentIndex: number;
  currentRepeat: number;
  playbackMode: PlaybackMode;
  autoAdvance: boolean;
  loopAll: boolean;
  defaultPauseDelay: number;
  intervalSeconds: number;
  repeatsPerSegment: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSelectSegment: (index: number) => void;
  onNextSegment: () => void;
  onPrevSegment: () => void;
  onResetRepeat: () => void;
  onSetPlaybackMode: (mode: PlaybackMode) => void;
  onSetAutoAdvance: (val: boolean) => void;
  onSetLoopAll: (val: boolean) => void;
  onSetDefaultPauseDelay: (delay: number) => void;
  onApplyIntervalAndRepeats: (interval: number, repeats: number, pause?: number) => void;
  onAddSegment: (start: number, end: number, repeats: number, pause: number, name?: string) => void;
  onUpdateSegment: (id: string, partial: Partial<MediaSegment>) => void;
  onRemoveSegment: (id: string) => void;
  onOpenAutoSlice: () => void;
  onChangeSpeed: (rate: number) => void;
  onSpeedUp: () => void;
  onSlowDown: () => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
}

export const LoopControllerPanel: React.FC<LoopControllerPanelProps> = ({
  segments,
  activeSegment,
  currentSegmentIndex,
  currentRepeat,
  playbackMode,
  autoAdvance,
  loopAll,
  defaultPauseDelay,
  intervalSeconds,
  repeatsPerSegment,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onSelectSegment,
  onNextSegment,
  onPrevSegment,
  onResetRepeat,
  onSetPlaybackMode,
  onSetAutoAdvance,
  onSetLoopAll,
  onSetDefaultPauseDelay,
  onApplyIntervalAndRepeats,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment,
  onOpenAutoSlice,
  onChangeSpeed,
  onSpeedUp,
  onSlowDown,
  onChangeVolume,
  onToggleMute,
}) => {
  const [customInterval, setCustomInterval] = useState<number>(intervalSeconds || 5);
  const [customRepeats, setCustomRepeats] = useState<number>(repeatsPerSegment || 4);

  // Sync state if prop changes
  React.useEffect(() => {
    setCustomInterval(intervalSeconds);
    setCustomRepeats(repeatsPerSegment);
  }, [intervalSeconds, repeatsPerSegment]);

  // Mark start / end cues from current playhead
  const handleAddFromPlayhead = () => {
    const start = currentTime;
    const end = Math.min(duration, start + customInterval);
    onAddSegment(start, end, customRepeats, defaultPauseDelay, `Segment ${segments.length + 1}`);
  };

  const repeatsNeeded = activeSegment ? activeSegment.repeatCount : customRepeats;
  const currentRepetitionNumber = currentRepeat + 1;
  const progressRatio = Math.min(1, currentRepetitionNumber / repeatsNeeded);

  const totalCalculatedSegments = Math.ceil(duration / (customInterval || 5));

  return (
    <div className="w-full space-y-4">
      {/* 1. CONTINUOUS FULL-TRACK REPEAT CONFIGURATION (User Request: 5s x4 to the end of the file) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-blue-950/40 border border-cyan-500/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border text-cyan-300"
              style={{
                backgroundColor: 'var(--neon-color-dim)',
                borderColor: 'var(--neon-color)',
              }}
            >
              <Repeat className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Continuous File-Wide Repetition Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  Full Duration: {Math.round(duration)}s
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Chops the entire audio/video into automated repeated parts from start to finish
              </p>
            </div>
          </div>

          {/* Quick Apply Button */}
          <button
            onClick={() => onApplyIntervalAndRepeats(customInterval, customRepeats)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/30 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5" />
            Apply Across Entire File ({totalCalculatedSegments} Parts)
          </button>
        </div>

        {/* Setting Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {/* Interval Length */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300 font-semibold">Segment Length:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const val = Math.max(1, customInterval - 1);
                    setCustomInterval(val);
                    onApplyIntervalAndRepeats(val, customRepeats);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-mono text-sm font-extrabold text-cyan-300 px-2 py-0.5 bg-black/50 rounded border border-cyan-500/40">
                  {customInterval}s
                </span>
                <button
                  onClick={() => {
                    const val = Math.min(120, customInterval + 1);
                    setCustomInterval(val);
                    onApplyIntervalAndRepeats(val, customRepeats);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            {/* Quick Interval Pills */}
            <div className="flex items-center gap-1 mt-1">
              {[2, 3, 5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setCustomInterval(sec);
                    onApplyIntervalAndRepeats(sec, customRepeats);
                  }}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-all ${
                    customInterval === sec
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Count */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300 font-semibold">Repeats Per Segment:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const val = Math.max(1, customRepeats - 1);
                    setCustomRepeats(val);
                    onApplyIntervalAndRepeats(customInterval, val);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-mono text-sm font-extrabold text-cyan-300 px-2 py-0.5 bg-black/50 rounded border border-cyan-500/40">
                  {customRepeats}x
                </span>
                <button
                  onClick={() => {
                    const val = Math.min(50, customRepeats + 1);
                    setCustomRepeats(val);
                    onApplyIntervalAndRepeats(customInterval, val);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            {/* Quick Repeats Pills */}
            <div className="flex items-center gap-1 mt-1">
              {[2, 3, 4, 5, 8, 10].map((rep) => (
                <button
                  key={rep}
                  onClick={() => {
                    setCustomRepeats(rep);
                    onApplyIntervalAndRepeats(customInterval, rep);
                  }}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-all ${
                    customRepeats === rep
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {rep}x
                </button>
              ))}
            </div>
          </div>

          {/* Pause Delay & Loop All */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Pause Delay:
              </span>
              <span className="font-mono text-cyan-300 font-bold">{defaultPauseDelay.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={defaultPauseDelay}
              onChange={(e) => onSetDefaultPauseDelay(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded cursor-pointer accent-[var(--neon-color)] my-1"
            />
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
              <span>Loop whole file again at end:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={loopAll}
                  onChange={(e) => onSetLoopAll(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--neon-color)]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE REPETITION HUD & SPEED BAR */}
      <div
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b1329]/90 border border-slate-800 transition-all shadow-xl"
        style={{
          borderColor: isPlaying ? 'var(--neon-color)' : undefined,
          boxShadow: isPlaying ? '0 0 20px var(--neon-color-dim)' : undefined,
        }}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Active Segment Info Card */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Glowing Repetition Badge */}
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-lg"
              style={{
                backgroundColor: 'rgba(8, 12, 20, 0.9)',
                borderColor: 'var(--neon-color)',
                boxShadow: '0 0 16px var(--neon-color-dim)',
              }}
            >
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                REPEAT
              </span>
              <span
                className="text-2xl sm:text-3xl font-extrabold font-mono leading-none my-0.5"
                style={{ color: 'var(--neon-color)' }}
              >
                {currentRepetitionNumber}
                <span className="text-xs text-slate-400 font-normal">/{repeatsNeeded}</span>
              </span>
              <span className="text-[9px] text-cyan-300 font-mono">
                {activeSegment ? `${Math.round(progressRatio * 100)}%` : '0%'}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {playbackMode === 'step-loop' ? 'AUTO STEP-BY-STEP LOOP' : playbackMode.toUpperCase()}
                </span>
                {autoAdvance && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Auto-Step to Next Section
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1">
                {activeSegment ? activeSegment.name : 'No Segment Selected'}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span>
                  Bounds: <strong>{activeSegment ? activeSegment.startTime : 0}s</strong> →{' '}
                  <strong>{activeSegment ? activeSegment.endTime : 0}s</strong>
                </span>
                <span>•</span>
                <span>
                  Part:{' '}
                  <strong className="text-cyan-300">
                    {currentSegmentIndex + 1} of {segments.length}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Main Playback Bar Controls & PROMINENT SPEED CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-center">
            {/* Playback Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Seek -5s */}
              <button
                onClick={() => onSeek(Math.max(0, currentTime - 5))}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Seek backward 5s"
              >
                <Rewind className="w-4 h-4" />
              </button>

              {/* Prev Segment */}
              <button
                onClick={onPrevSegment}
                className="p-2.5 sm:p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Previous Segment"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Main Play/Pause Button */}
              <button
                onClick={onTogglePlay}
                className="p-3.5 sm:p-4 rounded-2xl text-slate-950 font-bold transition-all shadow-xl hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: 'var(--neon-color)',
                  boxShadow: '0 0 20px var(--neon-color-dim)',
                }}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Segment */}
              <button
                onClick={onNextSegment}
                className="p-2.5 sm:p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Next Segment"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Seek +5s */}
              <button
                onClick={() => onSeek(Math.min(duration, currentTime + 5))}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Seek forward 5s"
              >
                <FastForward className="w-4 h-4" />
              </button>

              {/* Reset Loop Count */}
              <button
                onClick={onResetRepeat}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                title="Reset repeat count to 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* 3. PROMINENT PLAYBACK SPEED CONTROL (Speed Up / Slow Down with Pitch Preservation) */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800/80 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Speed:
              </span>

              {/* Slow Down [-] */}
              <button
                onClick={onSlowDown}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
                title="Slow down (-0.25x)"
              >
                -
              </button>

              {/* Current Speed Badge */}
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border shadow-sm text-center min-w-[50px]"
                style={{
                  backgroundColor: 'var(--neon-color-dim)',
                  borderColor: 'var(--neon-color)',
                  color: '#ffffff',
                }}
              >
                {playbackRate.toFixed(2)}x
              </div>

              {/* Speed Up [+] */}
              <button
                onClick={onSpeedUp}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
                title="Speed up (+0.25x)"
              >
                +
              </button>

              {/* Quick speed presets */}
              <div className="hidden xl:flex items-center gap-1 pl-1">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onChangeSpeed(rate)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                      Math.abs(playbackRate - rate) < 0.05
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Quick Control */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2">
              <button
                onClick={onToggleMute}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                title="Mute / Unmute"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="w-14 h-1 bg-slate-800 rounded cursor-pointer accent-[var(--neon-color)]"
              />
            </div>
          </div>
        </div>

        {/* Global Sequence Progress Bar across active segment repeats */}
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${progressRatio * 100}%`,
              backgroundColor: 'var(--neon-color)',
              boxShadow: '0 0 10px var(--neon-color)',
            }}
          />
        </div>
      </div>

      {/* 4. SEGMENTS SEQUENCE LIST (All parts from 0:00 to the very end of the file) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Segment Sequences ({segments.length} Parts Total)
            <span className="text-[11px] font-normal text-slate-400">
              Plays {customInterval}s chunks with {customRepeats} repeats each to the end of the file
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Custom Auto-Slice modal button */}
          <button
            onClick={onOpenAutoSlice}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Advanced Auto-Slice Options"
          >
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Slicer</span>
          </button>

          {/* Add Segment Button */}
          <button
            onClick={handleAddFromPlayhead}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Add segment starting at current playhead"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add From Playhead</span>
          </button>
        </div>
      </div>

      {/* Segments List Cards */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {segments.map((seg, idx) => {
          const isActive = idx === currentSegmentIndex;

          return (
            <div
              key={seg.id}
              onClick={() => onSelectSegment(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-white bg-slate-900/90 shadow-lg'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
              style={
                isActive
                  ? {
                      borderColor: 'var(--neon-color)',
                      boxShadow: '0 0 12px var(--neon-color-dim)',
                    }
                  : {}
              }
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Segment Title & Range */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: isActive ? 'var(--neon-color)' : '#1e293b',
                      color: isActive ? '#080c14' : '#94a3b8',
                      borderColor: isActive ? 'var(--neon-color)' : '#334155',
                    }}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate flex items-center gap-2">
                      {seg.name}
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          ACTIVE ({currentRepetitionNumber}/{seg.repeatCount})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      From <span className="text-cyan-300 font-semibold">{seg.startTime}s</span> to{' '}
                      <span className="text-cyan-300 font-semibold">{seg.endTime}s</span> (
                      {(seg.endTime - seg.startTime).toFixed(1)}s duration)
                    </p>
                  </div>
                </div>

                {/* Inline Editing Controls */}
                <div
                  className="flex items-center gap-3 shrink-0 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Repeats counter selector */}
                  <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono">Repeats:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={seg.repeatCount}
                      onChange={(e) =>
                        onUpdateSegment(seg.id, {
                          repeatCount: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Start / End adjustments */}
                  <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                    <span className="text-slate-400">Start:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={seg.startTime}
                      onChange={(e) =>
                        onUpdateSegment(seg.id, {
                          startTime: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs text-white text-center focus:outline-none"
                    />
                    <span className="text-slate-400 ml-1">End:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={seg.endTime}
                      onChange={(e) =>
                        onUpdateSegment(seg.id, {
                          endTime: Math.max(seg.startTime + 0.1, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs text-white text-center focus:outline-none"
                    />
                  </div>

                  {/* Set from current playhead */}
                  <button
                    onClick={() =>
                      onUpdateSegment(seg.id, {
                        startTime: Number(currentTime.toFixed(2)),
                      })
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 font-mono transition-colors"
                    title="Set start to current playhead time"
                  >
                    Start=Now
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSegment(seg.id, {
                        endTime: Number(currentTime.toFixed(2)),
                      })
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 font-mono transition-colors"
                    title="Set end to current playhead time"
                  >
                    End=Now
                  </button>

                  {/* Delete segment button */}
                  {segments.length > 1 && (
                    <button
                      onClick={() => onRemoveSegment(seg.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete segment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
