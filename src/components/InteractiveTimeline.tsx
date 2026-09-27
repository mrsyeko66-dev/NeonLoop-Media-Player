import React, { useRef, useState, useMemo } from 'react';
import { MediaSegment } from '../types/player';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InteractiveTimelineProps {
  currentTime: number;
  duration: number;
  segments: MediaSegment[];
  currentSegmentIndex: number;
  onSeek: (time: number) => void;
  onSelectSegment: (index: number) => void;
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({
  currentTime,
  duration,
  segments,
  currentSegmentIndex,
  onSeek,
  onSelectSegment,
}) => {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverX(e.clientX - rect.left);
  };

  const handlePointerLeave = () => {
    setHoverTime(null);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Performance Optimization: If more than 60 segments, render segments via high-speed SVG overlay
  const isLargeSegmentCount = segments.length > 50;

  // Windowed visible segment chips under timeline
  const windowedChips = useMemo(() => {
    if (segments.length <= 30) {
      return { items: segments, offset: 0 };
    }
    const windowSize = 25;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(0, currentSegmentIndex - half);
    let end = Math.min(segments.length, start + windowSize);
    if (end - start < windowSize) {
      start = Math.max(0, end - windowSize);
    }
    return {
      items: segments.slice(start, end),
      offset: start,
    };
  }, [segments, currentSegmentIndex]);

  return (
    <div className="w-full select-none mt-2">
      {/* Time indicators */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5 px-0.5">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--neon-color)' }} />
          {formatTime(currentTime)}
        </span>
        <span className="text-slate-400 font-mono">
          {formatTime(duration)} ({segments.length} Parts Total)
        </span>
      </div>

      {/* Main Track Bar with Segments */}
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-full h-8 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer overflow-hidden p-0.5 transition-all shadow-inner hover:border-slate-700"
      >
        {/* Subtle grid ticks along timeline */}
        <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-slate-400" />
          ))}
        </div>

        {/* High performance SVG layer when segments > 50 */}
        {isLargeSegmentCount && duration > 0 ? (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {segments.map((seg, idx) => {
              const leftPct = (Math.max(0, seg.startTime) / duration) * 100;
              const widthPct = (Math.max(0.1, seg.endTime - seg.startTime) / duration) * 100;
              const isActive = idx === currentSegmentIndex;
              return (
                <rect
                  key={seg.id}
                  x={`${leftPct}%`}
                  y="2"
                  width={`${widthPct}%`}
                  height="28"
                  rx="3"
                  fill={isActive ? 'rgba(0, 240, 255, 0.35)' : 'rgba(30, 41, 59, 0.45)'}
                  stroke={isActive ? 'var(--neon-color)' : 'rgba(51, 65, 85, 0.6)'}
                  strokeWidth={isActive ? '1.5' : '0.5'}
                />
              );
            })}
          </svg>
        ) : (
          /* Interactive DOM Segments for normal sizes */
          duration > 0 &&
          segments.map((seg, idx) => {
            const leftPct = (Math.max(0, seg.startTime) / duration) * 100;
            const widthPct = (Math.max(0.1, seg.endTime - seg.startTime) / duration) * 100;
            const isActive = idx === currentSegmentIndex;

            return (
              <div
                key={seg.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSegment(idx);
                }}
                className={`absolute top-0.5 bottom-0.5 rounded-lg border transition-all flex items-center justify-between px-1.5 overflow-hidden ${
                  isActive
                    ? 'border-white z-10 shadow-lg'
                    : 'border-slate-700 hover:border-cyan-400/80 z-0'
                }`}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: isActive
                    ? 'rgba(0, 240, 255, 0.25)'
                    : 'rgba(30, 41, 59, 0.6)',
                  borderColor: isActive ? 'var(--neon-color)' : undefined,
                  boxShadow: isActive ? '0 0 12px var(--neon-color-dim)' : undefined,
                }}
                title={`${seg.name}: ${seg.startTime}s - ${seg.endTime}s (${seg.repeatCount}x)`}
              >
                <span className="text-[10px] font-mono font-bold truncate text-white leading-none">
                  {idx + 1}
                </span>
                <span className="text-[9px] font-mono text-cyan-300 font-semibold px-1 py-0.2 rounded bg-black/40 hidden sm:inline">
                  {seg.repeatCount}x
                </span>
              </div>
            );
          })
        )}

        {/* Current Playhead Scrubber */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white z-20 pointer-events-none shadow-[0_0_8px_#ffffff]"
          style={{
            left: `${progressPercent}%`,
          }}
        >
          <div
            className="w-3.5 h-3.5 -ml-[5px] -mt-1 rounded-full border-2 border-white shadow-lg pointer-events-none"
            style={{
              backgroundColor: 'var(--neon-color)',
              boxShadow: '0 0 10px var(--neon-color)',
            }}
          />
        </div>

        {/* Hover Time Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-7 px-2 py-0.5 rounded bg-black/90 border border-slate-700 text-[10px] font-mono text-cyan-300 pointer-events-none -translate-x-1/2 shadow-md z-30"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Windowed Segment Chip Badges under timeline */}
      <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
        {windowedChips.offset > 0 && (
          <button
            onClick={() => onSelectSegment(Math.max(0, windowedChips.offset - 15))}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-mono flex items-center shrink-0 hover:bg-slate-800"
            title="Previous segment batch"
          >
            <ChevronLeft className="w-3 h-3" /> Earlier Parts
          </button>
        )}

        {windowedChips.items.map((seg, relIdx) => {
          const actualIdx = windowedChips.offset + relIdx;
          const isActive = actualIdx === currentSegmentIndex;
          return (
            <button
              key={seg.id}
              onClick={() => onSelectSegment(actualIdx)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'border-white text-white shadow-md'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--neon-color-dim)',
                      borderColor: 'var(--neon-color)',
                      boxShadow: '0 0 8px var(--neon-color-dim)',
                    }
                  : {}
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color || 'var(--neon-color)' }}
              />
              <span>P{actualIdx + 1}</span>
              <span className="text-[10px] text-slate-400">
                ({seg.startTime}s - {seg.endTime}s)
              </span>
              <span className="text-[10px] px-1 rounded bg-black/40 text-cyan-300 font-bold">
                {seg.repeatCount}x
              </span>
            </button>
          );
        })}

        {windowedChips.offset + windowedChips.items.length < segments.length && (
          <button
            onClick={() =>
              onSelectSegment(
                Math.min(segments.length - 1, windowedChips.offset + windowedChips.items.length)
              )
            }
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-mono flex items-center shrink-0 hover:bg-slate-800"
            title="Later segment batch"
          >
            Later Parts <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
