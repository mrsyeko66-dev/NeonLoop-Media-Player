import React, { useState, useEffect } from 'react';
import { Bookmark, Save, Trash2, FolderOpen, Download, Upload, Check, AlertCircle, X, Plus } from 'lucide-react';
import { LoopPreset, MediaSegment } from '../types/player';
import {
  getStoredPresets,
  savePreset,
  deletePreset,
  exportPresetsToJson,
  importPresetsFromJson,
} from '../utils/presetStorage';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSegments: MediaSegment[];
  currentFileName: string;
  mediaType: 'audio' | 'video';
  mediaDuration: number;
  autoAdvance: boolean;
  loopAll: boolean;
  defaultDelay: number;
  onLoadPreset: (preset: LoopPreset) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  currentSegments,
  currentFileName,
  mediaType,
  mediaDuration,
  autoAdvance,
  loopAll,
  defaultDelay,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState<LoopPreset[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  const refreshPresets = () => {
    setPresets(getStoredPresets());
  };

  useEffect(() => {
    if (isOpen) {
      refreshPresets();
      setNewTitle(currentFileName ? `Setup: ${currentFileName.replace(/\.[^/.]+$/, '')}` : 'My Loop Preset');
      setSaveSuccessMsg('');
      setImportError('');
    }
  }, [isOpen, currentFileName]);

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    savePreset({
      title: newTitle.trim(),
      fileIdentifier: currentFileName || 'unknown_media',
      mediaType,
      duration: mediaDuration,
      segments: currentSegments,
      autoAdvance,
      loopAll,
      defaultDelay,
    });

    setSaveSuccessMsg('Preset saved successfully!');
    refreshPresets();
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this saved preset?')) {
      deletePreset(id);
      refreshPresets();
    }
  };

  const handleExportJson = () => {
    const data = exportPresetsToJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neonloop_presets_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importPresetsFromJson(content);
      if (res.success) {
        refreshPresets();
        setSaveSuccessMsg(`Imported ${res.count} presets!`);
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } else {
        setImportError(res.error || 'Failed to import JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0b1120] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Repetition Presets Library
              </h2>
              <p className="text-xs text-slate-400">
                Save & load custom segment loops for any audio or video file
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

        {/* Save Current Preset Form */}
        <form onSubmit={handleSaveCurrent} className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Save Current Loops ({currentSegments.length} segments defined)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter preset title..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          {saveSuccessMsg && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {saveSuccessMsg}
            </p>
          )}
        </form>

        {/* Saved Presets List */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saved Presets ({presets.length})
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <Upload className="w-3 h-3" /> Import JSON
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
              <button
                onClick={handleExportJson}
                disabled={presets.length === 0}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 disabled:opacity-40"
              >
                <Download className="w-3 h-3" /> Backup JSON
              </button>
            </div>
          </div>

          {importError && (
            <p className="text-xs text-rose-400 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {importError}
            </p>
          )}

          {presets.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
              No saved presets yet. Configure your segments and click Save above!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{preset.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{preset.segments.length} segments</span>
                      <span>•</span>
                      <span className="truncate text-cyan-400">{preset.fileIdentifier}</span>
                      <span>•</span>
                      <span>{new Date(preset.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadPreset(preset);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-semibold text-xs flex items-center gap-1 border border-cyan-500/40 transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Load
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
