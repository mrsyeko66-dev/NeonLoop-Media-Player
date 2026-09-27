import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  PictureInPicture2,
  Music,
  Film,
  Volume2,
  VolumeX,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { MediaSegment, NeonThemeSettings, PlaybackMode } from '../types/player';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';

interface PlayerViewProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  mediaSrc: string | null;
  isVideo: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeSegment: MediaSegment | null;
  currentRepeat: number;
  playbackMode: PlaybackMode;
  neonSettings: NeonThemeSettings;
  audioReactiveLevel: number;
  analyserRef: React.RefObject<AnalyserNode | null>;
  currentSegmentIndex: number;
  totalSegments: number;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  videoRef,
  audioRef,
  mediaSrc,
  isVideo,
  isPlaying,
  onTogglePlay,
  activeSegment,
  currentRepeat,
  playbackMode,
  neonSettings,
  audioReactiveLevel,
  analyserRef,
  currentSegmentIndex,
  totalSegments,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle Picture-in-Picture
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  // Dynamic reactive glow calculation
  const reactiveScale = neonSettings.reactiveAudioGlow && isPlaying
    ? 1 + audioReactiveLevel * 1.2
    : 1;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 transition-all duration-300 group shadow-2xl"
      style={{
        boxShadow: neonSettings.ambientBacklight
          ? `0 0 ${Math.round(30 * neonSettings.intensity * reactiveScale)}px var(--neon-color-dim)`
          : undefined,
        borderColor: isPlaying ? 'var(--neon-color)' : undefined,
      }}
    >
      {/* Ambient Halo Behind Media */}
      {neonSettings.ambientBacklight && (
        <div
          className="absolute -inset-10 opacity-30 pointer-events-none blur-3xl transition-opacity duration-300 -z-10"
          style={{
            background: `radial-gradient(circle, var(--neon-color) 0%, transparent 70%)`,
            transform: `scale(${reactiveScale})`,
          }}
        />
      )}

      {/* Media Rendering Stage */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-[#070b12] overflow-hidden select-none">
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaSrc || undefined}
            playsInline
            onClick={onTogglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />
        ) : (
          <div
            onClick={onTogglePlay}
            className="w-full h-full flex flex-col items-center justify-center p-6 cursor-pointer relative"
          >
            <audio ref={audioRef} src={mediaSrc || undefined} />

            {/* Glowing Center Ring */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 flex items-center justify-center transition-all duration-300"
              style={{
                borderColor: 'var(--neon-color)',
                backgroundColor: 'rgba(11, 19, 41, 0.7)',
                boxShadow: `0 0 ${Math.round(25 * neonSettings.intensity * reactiveScale)}px var(--neon-color-dim)`,
                transform: `scale(${reactiveScale})`,
              }}
            >
              <Music
                className="w-10 h-10 sm:w-14 sm:h-14 transition-colors duration-300"
                style={{ color: 'var(--neon-color)' }}
              />
            </div>

            {/* In-Stage Audio Visualizer Spectrum */}
            <div className="w-full max-w-lg h-20 mt-6 px-4">
              <AudioVisualizerCanvas
                analyserRef={analyserRef}
                isPlaying={isPlaying}
                neonSettings={neonSettings}
              />
            </div>
          </div>
        )}

        {/* Live Active Segment & Repetition HUD Overlay */}
        {playbackMode === 'step-loop' && activeSegment && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
            <div
              className="px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 shadow-lg"
              style={{
                backgroundColor: 'rgba(8, 12, 20, 0.85)',
                borderColor: 'var(--neon-color)',
                color: '#ffffff',
                boxShadow: `0 0 14px var(--neon-color-dim)`,
              }}
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--neon-color)' }} />
              <span className="text-slate-300 text-[11px]">
                PART {currentSegmentIndex + 1}/{totalSegments}:
              </span>
              <span className="font-bold text-white tracking-wide">
                REPEAT {currentRepeat + 1} / {activeSegment.repeatCount}
              </span>
            </div>
          </div>
        )}

        {/* Mode Badge (Top-Right) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {isVideo && (
            <button
              onClick={togglePip}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-all shadow-md cursor-pointer"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-all shadow-md cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Big Play Button Overlay on Pause */}
        {!isPlaying && (
          <div
            onClick={onTogglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 backdrop-blur-[2px] cursor-pointer group-hover:bg-black/25 transition-all"
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all transform group-hover:scale-110 shadow-2xl"
              style={{
                backgroundColor: 'rgba(8, 12, 20, 0.85)',
                borderColor: 'var(--neon-color)',
                boxShadow: `0 0 25px var(--neon-color-dim)`,
              }}
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1 fill-current" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
