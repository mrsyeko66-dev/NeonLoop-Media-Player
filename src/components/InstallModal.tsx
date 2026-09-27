import React from 'react';
import { Monitor, Smartphone, Download, CheckCircle, ExternalLink, X, ShieldCheck, Zap } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isWindows, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b1120] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden neon-glow-md text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Glow header ambient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--neon-color)] to-transparent opacity-80" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Download className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Install for Windows & Android
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  PWA Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run NeonLoop as a native standalone application on your PC or phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        {isInstalled ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>NeonLoop is already installed and running in standalone mode!</span>
          </div>
        ) : isInstallable ? (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cyan-200">1-Click Direct Installation Available</p>
              <p className="text-xs text-slate-400">Install immediately to your desktop or mobile app launcher</p>
            </div>
            <button
              onClick={async () => {
                const res = await install();
                if (res) onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/40 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              Install App Now
            </button>
          </div>
        ) : null}

        {/* Platform Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Windows Section */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                <Monitor className="w-5 h-5" />
                <span>Windows 10 / 11 Desktop</span>
                {isWindows && <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">Detected</span>}
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Install as a dedicated desktop window without browser tabs or address bar. Works completely offline.
              </p>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <li>Open this app in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.</li>
                <li>Click the <strong>Install</strong> icon in the address bar (or browser menu → <em>Apps → Install NeonLoop</em>).</li>
                <li>NeonLoop will appear on your <strong>Start Menu</strong>, <strong>Desktop</strong>, and <strong>Taskbar</strong>!</li>
              </ol>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Standalone EXE/MSI
              </span>
              <a
                href="https://www.pwabuilder.com/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                Package with PWABuilder <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Android Section */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold mb-2">
                <Smartphone className="w-5 h-5" />
                <span>Android Smartphone & Tablet</span>
                {isAndroid && <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">Detected</span>}
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Installs as a native WebAPK app with full-screen experience and hardware-accelerated playback.
              </p>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <li>Open this app in <strong>Chrome for Android</strong>.</li>
                <li>Tap the <strong>three dots menu (⋮)</strong> at top-right.</li>
                <li>Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm install; the NeonLoop app icon will appear in your app drawer!</li>
              </ol>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Google Play APK
              </span>
              <a
                href="https://www.pwabuilder.com/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                Generate APK <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* iOS Notice if detected */}
        {isIOS && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
            <strong>iOS / iPadOS note:</strong> Tap the <strong>Share</strong> button in Safari, scroll down, and tap <strong>Add to Home Screen</strong>.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
