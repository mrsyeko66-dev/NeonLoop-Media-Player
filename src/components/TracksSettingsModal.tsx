import React, { useRef } from 'react';
import { Subtitles, Volume2, Upload, Plus, Check, X, Sliders } from 'lucide-react';
import { useMediaTracks } from '../hooks/useMediaTracks';

interface TracksSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaTracks: ReturnType<typeof useMediaTracks>;
}

export const TracksSettingsModal: React.FC<TracksSettingsModalProps> = ({
  isOpen,
  onClose,
  mediaTracks,
}) => {
  const subFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    subtitleTracks,
    activeSubtitleTrackId,
    setActiveSubtitleTrackId,
    subtitleFontSize,
    setSubtitleFontSize,
    loadSubtitleFile,
    audioTracks,
    activeAudioTrackId,
    selectAudioTrack,
    loadExternalAudioTrack,
  } = mediaTracks;

  if (!isOpen) return null;

  const handleSubFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadSubtitleFile(file);
    }
    e.target.value = '';
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadExternalAudioTrack(file, file.name.replace(/\.[^/.]+$/, ''));
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Subtitles & Audio Tracks
              </h2>
              <p className="text-xs text-slate-400">
                MKV multi-audio language switching & subtitle display configuration
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

        {/* 1. AUDIO TRACKS / LANGUAGE SWITCHER */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Audio Languages ({audioTracks.length} Available)
              </span>
            </div>

            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg"
              onChange={handleAudioFileChange}
              className="hidden"
            />
            <button
              onClick={() => audioFileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Dubbed Track
            </button>
          </div>

          <div className="space-y-1.5">
            {audioTracks.map((track) => {
              const isSelected = activeAudioTrackId === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => selectAudioTrack(track.id)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-purple-400 bg-purple-950/40 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? '#a855f7' : '#64748b' }} />
                    <span className="truncate">{track.label}</span>
                    {track.isExternal && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                        Synced
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SUBTITLES SELECTOR */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Subtitles & Captions
              </span>
            </div>

            <input
              ref={subFileInputRef}
              type="file"
              accept=".srt,.vtt,text/vtt,application/x-subrip"
              onChange={handleSubFileChange}
              className="hidden"
            />
            <button
              onClick={() => subFileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3" /> Load Subtitle (.srt / .vtt)
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Off Option */}
            <button
              onClick={() => setActiveSubtitleTrackId(null)}
              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                activeSubtitleTrackId === null
                  ? 'border-cyan-400 bg-cyan-950/40 text-white font-bold'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Subtitles Disabled (Off)</span>
              {activeSubtitleTrackId === null && <Check className="w-4 h-4 text-cyan-400" />}
            </button>

            {subtitleTracks.map((sub) => {
              const isSelected = activeSubtitleTrackId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubtitleTrackId(sub.id)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 text-white font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? '#00f0ff' : '#64748b' }} />
                    <span className="truncate">{sub.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({sub.cues.length} cues)</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Subtitle Font Size Slider */}
          {activeSubtitleTrackId !== null && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" /> Subtitle Font Size:
                </span>
                <span className="font-mono text-cyan-400 font-bold">{subtitleFontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="36"
                step="1"
                value={subtitleFontSize}
                onChange={(e) => setSubtitleFontSize(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded cursor-pointer accent-cyan-400"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
