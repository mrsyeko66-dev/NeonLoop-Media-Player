import React, { useState } from 'react';
import { Globe, Play, X, Film, Music, Subtitles, Volume2, Sparkles, Check } from 'lucide-react';

interface OpenUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadUrl: (mediaUrl: string, title?: string, isVideo?: boolean) => void;
  onLoadSubtitleUrl?: (subUrl: string, label: string) => void;
  onLoadAudioUrl?: (audioUrl: string, label: string) => void;
}

export const OpenUrlModal: React.FC<OpenUrlModalProps> = ({
  isOpen,
  onClose,
  onLoadUrl,
  onLoadSubtitleUrl,
  onLoadAudioUrl,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [subUrlInput, setSubUrlInput] = useState<string>('');
  const [audioUrlInput, setAudioUrlInput] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const trimmed = urlInput.trim();
    const isVid =
      /\.(mkv|mp4|webm|mov|avi|ogv)$/i.test(trimmed) ||
      !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(trimmed); // Default to video if uncertain

    const name = titleInput.trim() || trimmed.split('/').pop()?.split('?')[0] || 'Network Stream';

    onLoadUrl(trimmed, name, isVid);

    if (subUrlInput.trim() && onLoadSubtitleUrl) {
      onLoadSubtitleUrl(subUrlInput.trim(), 'Online Subtitles');
    }

    if (audioUrlInput.trim() && onLoadAudioUrl) {
      onLoadAudioUrl(audioUrlInput.trim(), 'Online Audio Track');
    }

    onClose();
  };

  // Preset demo streams for instant testing
  const sampleStreams = [
    {
      title: 'Big Buck Bunny (MKV / MP4 HD Stream)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video',
    },
    {
      title: 'Sintel Open Animation (WebM / HD)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      type: 'video',
    },
    {
      title: 'For Bigger Blazes (Action Demo)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      type: 'video',
    },
    {
      title: 'Cyberpunk Electronic Beats (Audio MP3 Stream)',
      url: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
      type: 'audio',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Open Online Network Stream
              </h2>
              <p className="text-xs text-slate-400">
                Play direct URL video (MKV, MP4, WebM) or audio with looping and subtitles
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Direct Media URL (MKV, MP4, WebM, MP3, etc.) *
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/movie.mkv"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Title / Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Action Movie MKV"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Subtitle URL (optional) */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Subtitles className="w-3.5 h-3.5 text-cyan-400" />
              Online Subtitle URL (.srt / .vtt) (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/subtitles.srt"
              value={subUrlInput}
              onChange={(e) => setSubUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
            />
          </div>

          {/* Additional Audio Dubbed URL (optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              Secondary Language / Dubbed Audio URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/farsi_dub.m4a"
              value={audioUrlInput}
              onChange={(e) => setAudioUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
            />
          </div>

          {/* Sample quick streams */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Or Try A Sample Network Stream:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleStreams.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrlInput(s.url);
                    setTitleInput(s.title);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-400/50 text-left text-xs transition-all flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  {s.type === 'video' ? (
                    <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/30 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play Online Stream
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
