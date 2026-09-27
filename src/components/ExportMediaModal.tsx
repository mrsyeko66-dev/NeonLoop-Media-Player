import React, { useState } from 'react';
import { Download, Film, Music, CheckCircle, AlertTriangle, Loader2, X, Clock, Play } from 'lucide-react';
import { MediaSegment } from '../types/player';
import { exportRepeatedAudio, exportRepeatedVideo } from '../utils/mediaExporter';

interface ExportMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFile: File | Blob | null;
  videoElement: HTMLVideoElement | null;
  isVideo: boolean;
  segments: MediaSegment[];
  mediaDuration: number;
}

export const ExportMediaModal: React.FC<ExportMediaModalProps> = ({
  isOpen,
  onClose,
  mediaFile,
  videoElement,
  isVideo,
  segments,
  mediaDuration,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [downloadResult, setDownloadResult] = useState<{ url: string; fileName: string; sizeMb?: number } | null>(null);
  const [exportError, setExportError] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'audio-wav' | 'video-webm'>(isVideo ? 'video-webm' : 'audio-wav');

  if (!isOpen) return null;

  // Calculate estimated total duration
  const totalLoopedDuration = segments.reduce((acc, seg) => {
    const dur = Math.max(0, seg.endTime - seg.startTime);
    const delay = seg.pauseDelay || 0;
    return acc + (dur + delay) * seg.repeatCount;
  }, 0);

  const totalSteps = segments.reduce((acc, s) => acc + s.repeatCount, 0);

  const handleStartExport = async () => {
    if (!mediaFile) {
      setExportError('Please load an audio or video file first.');
      return;
    }
    if (segments.length === 0) {
      setExportError('Add at least one segment to export.');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setStatusText('Initializing repetition engine...');
    setDownloadResult(null);
    setExportError('');

    try {
      if (selectedFormat === 'audio-wav') {
        const result = await exportRepeatedAudio(mediaFile, segments, (pct, status) => {
          setProgress(pct);
          setStatusText(status);
        });

        const url = URL.createObjectURL(result.blob);
        const sizeMb = Number((result.blob.size / (1024 * 1024)).toFixed(2));
        setDownloadResult({
          url,
          fileName: result.fileName,
          sizeMb,
        });
      } else {
        // Video export
        if (!videoElement) {
          throw new Error('Video player element is not ready.');
        }

        const result = await exportRepeatedVideo(videoElement, segments, (pct, status) => {
          setProgress(pct);
          setStatusText(status);
        });

        const url = URL.createObjectURL(result.blob);
        const sizeMb = Number((result.blob.size / (1024 * 1024)).toFixed(2));
        setDownloadResult({
          url,
          fileName: result.fileName,
          sizeMb,
        });
      }
    } catch (err: unknown) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Export Repeated Media
              </h2>
              <p className="text-xs text-slate-400">
                Render and save the final audio or video with all segment loops stitched
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Total Segments:</span>
            <span className="font-semibold text-white">{segments.length} segment(s)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Total Repetition Loops:</span>
            <span className="font-semibold text-cyan-400">{totalSteps} total play repetitions</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Estimated Output Length:</span>
            <span className="font-mono font-bold text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {Math.floor(totalLoopedDuration / 60)}m {Math.round(totalLoopedDuration % 60)}s
            </span>
          </div>
        </div>

        {/* Export Format Chooser */}
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
            Choose Output Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFormat('audio-wav')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                selectedFormat === 'audio-wav'
                  ? 'border-cyan-400 bg-cyan-950/40 text-white neon-glow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Music className={`w-5 h-5 mt-0.5 ${selectedFormat === 'audio-wav' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold text-white">High-Res WAV Audio</p>
                <p className="text-[11px] text-slate-400">Lossless 16-bit PCM audio, instant offline render</p>
              </div>
            </button>

            {isVideo && (
              <button
                type="button"
                onClick={() => setSelectedFormat('video-webm')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  selectedFormat === 'video-webm'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white neon-glow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Film className={`w-5 h-5 mt-0.5 ${selectedFormat === 'video-webm' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <p className="text-xs font-bold text-white">Full Video (WebM)</p>
                  <p className="text-[11px] text-slate-400">High-bitrate video + audio stitched frames</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Progress or Error */}
        {isExporting && (
          <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/50 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-300 flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {statusText || 'Rendering...'}
              </span>
              <span className="font-mono text-cyan-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {exportError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Result Download Box */}
        {downloadResult && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">{downloadResult.fileName}</p>
                <p className="text-[11px] text-emerald-400 font-mono">
                  {downloadResult.sizeMb ? `${downloadResult.sizeMb} MB • ` : ''}Ready to save!
                </p>
              </div>
            </div>
            <a
              href={downloadResult.url}
              download={downloadResult.fileName}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </a>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleStartExport}
            disabled={isExporting || segments.length === 0}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing Output...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Render & Export Final Media
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
