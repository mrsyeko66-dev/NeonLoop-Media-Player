import React, { useRef } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  Bookmark,
  SlidersHorizontal,
  FolderOpen,
  Monitor,
  Music,
  Film,
  Globe,
  Subtitles,
  Zap,
} from 'lucide-react';
import { NeonThemeSettings } from '../types/player';

interface HeaderProps {
  currentFileName: string;
  isVideo: boolean;
  segmentCount: number;
  neonSettings: NeonThemeSettings;
  onSelectFile: (file: File) => void;
  onOpenUrl: () => void;
  onLoadDemoTrack: () => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
  onOpenLighting: () => void;
  onOpenEqualizer: () => void;
  onOpenInstall: () => void;
  onOpenTracksSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFileName,
  isVideo,
  segmentCount,
  neonSettings,
  onSelectFile,
  onOpenUrl,
  onLoadDemoTrack,
  onOpenPresets,
  onOpenExport,
  onOpenLighting,
  onOpenEqualizer,
  onOpenInstall,
  onOpenTracksSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-md"
            style={{
              backgroundColor: 'var(--neon-color-dim)',
              borderColor: 'var(--neon-color)',
              boxShadow: '0 0 12px var(--neon-color-dim)',
            }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                NEON<span style={{ color: 'var(--neon-color)' }}>LOOP</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                PRO PLAYER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
              {currentFileName ? (
                <span className="text-slate-300 flex items-center gap-1">
                  {isVideo ? <Film className="w-3 h-3 text-cyan-400" /> : <Music className="w-3 h-3 text-cyan-400" />}
                  {currentFileName}
                </span>
              ) : (
                'Automated Segment Looper & Media Exporter'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.webm,.mkv,.mov,.avi"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Open Local File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Open Local Audio or Video file"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Open File</span>
          </button>

          {/* Open Network Stream URL */}
          <button
            onClick={onOpenUrl}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-400/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Play Online Network Stream URL (MKV, MP4, WebM, MP3)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Open URL</span>
          </button>

          {/* Demo Track */}
          <button
            onClick={onLoadDemoTrack}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Load demo audio track"
          >
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Demo Beat</span>
          </button>

          {/* Subtitles & Audio Languages Button */}
          <button
            onClick={onOpenTracksSettings}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Subtitles (.srt/.vtt) & MKV Audio Languages"
          >
            <Subtitles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Audio & Subs</span>
          </button>

          {/* Presets Button */}
          <button
            onClick={onOpenPresets}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Saved Loop Presets"
          >
            <Bookmark className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Presets</span>
            <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 text-[10px] flex items-center justify-center font-mono">
              {segmentCount}
            </span>
          </button>

          {/* Audio EQ */}
          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400/50 text-xs transition-all cursor-pointer"
            title="Equalizer & Speed"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Export Repeated Media Button */}
          <button
            onClick={onOpenExport}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-cyan-500/30 cursor-pointer"
            title="Export Repeated Audio/Video file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Media</span>
          </button>

          {/* Lighting Settings Button */}
          <button
            onClick={onOpenLighting}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 transition-all cursor-pointer relative"
            title="Lighting & Neon Theme Settings"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900"
              style={{ backgroundColor: 'var(--neon-color)' }}
            />
          </button>

          {/* Cross-Platform Windows & Android Install Hub Button */}
          <button
            onClick={onOpenInstall}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all hover:neon-glow-sm cursor-pointer"
            title="Install for Windows Desktop & Android"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Install App</span>
          </button>
        </div>
      </div>
    </header>
  );
};
