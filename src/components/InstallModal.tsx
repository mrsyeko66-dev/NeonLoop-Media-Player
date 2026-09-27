import React from 'react';
import {
  Monitor,
  Smartphone,
  Download,
  CheckCircle,
  ExternalLink,
  X,
  ShieldCheck,
  Zap,
  Package,
  Layers,
  FileCode,
} from 'lucide-react';
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
                Windows & Android Downloads
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  GitHub Releases
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Download Windows Portable & Installer (.exe) or install PWA on Android & Desktop
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

        {/* 1. NEW DEDICATED GITHUB RELEASES WINDOWS EXECUTABLES SECTION */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 border border-cyan-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Windows Standalone Executables (Automated GitHub Releases)
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              CI/CD Automated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Portable Version */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Zap className="w-4 h-4 text-cyan-400" /> Portable Version (.exe)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 font-mono">
                    No Install
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Single-file executable (<code>NeonLoop-Portable-v*.exe</code>). Runs instantly on any Windows PC without installation or admin privileges.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Windows 10/11 x64</span>
                <span className="text-cyan-400 font-semibold">Self-contained</span>
              </div>
            </div>

            {/* Installer Version */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span className="flex items-center gap-1.5 text-purple-300">
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Installer Setup (.exe)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 font-mono">
                    Setup Wizard
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Full Windows setup wizard (<code>NeonLoop-Setup-v*.exe</code>). Creates Start Menu and Desktop shortcuts with clean auto-uninstaller.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">NSIS Installer</span>
                <span className="text-purple-400 font-semibold">Start Menu + Desktop</span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-400" />
              Automated builds configured in <code>.github/workflows/release-windows.yml</code>
            </span>
            <span className="text-cyan-300 font-medium">
              Versions auto-increment with every GitHub Release tag!
            </span>
          </div>
        </div>

        {/* 2. PWA Instant Install (Browser / Standalone) */}
        {isInstalled ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>NeonLoop is currently running in standalone PWA app mode!</span>
          </div>
        ) : isInstallable ? (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cyan-200">1-Click Direct Browser Installation</p>
              <p className="text-xs text-slate-400">Install immediately to your PC or mobile app launcher</p>
            </div>
            <button
              onClick={async () => {
                const res = await install();
                if (res) onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/40 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              Install PWA Now
            </button>
          </div>
        ) : null}

        {/* 3. Platform Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Windows Section */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                <Monitor className="w-5 h-5" />
                <span>Windows 10 / 11 Desktop</span>
                {isWindows && <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">Detected</span>}
              </div>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                Choose between the standalone <strong>.exe (Portable or Setup)</strong> from GitHub Releases or run as an offline PWA window.
              </p>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <li>Run <code>NeonLoop-Portable-v*.exe</code> directly from USB or drive.</li>
                <li>Or click <strong>Install</strong> in Chrome/Edge toolbar.</li>
                <li>Pin to <strong>Taskbar</strong> or <strong>Start Menu</strong>!</li>
              </ol>
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
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                Installs as a native WebAPK app with full-screen experience and hardware-accelerated playback.
              </p>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <li>Open this app in <strong>Chrome for Android</strong>.</li>
                <li>Tap <strong>three dots (⋮)</strong> → <strong>Install App</strong>.</li>
                <li>Icon appears in your Android home screen and app drawer!</li>
              </ol>
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
