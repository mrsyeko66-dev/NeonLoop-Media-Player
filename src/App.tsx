/**
 * NeonLoop Media Player
 * Professional Audio & Video Player with Automated Step-by-Step Segment Looping,
 * Media Exporter, Online Streams, Subtitles & Audio Tracks, and Dark Neon Aesthetics.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PlayerView } from './components/PlayerView';
import { InteractiveTimeline } from './components/InteractiveTimeline';
import { LoopControllerPanel } from './components/LoopControllerPanel';
import { InstallModal } from './components/InstallModal';
import { LightingSettingsModal } from './components/LightingSettingsModal';
import { PresetsModal } from './components/PresetsModal';
import { ExportMediaModal } from './components/ExportMediaModal';
import { EqualizerModal } from './components/EqualizerModal';
import { AutoSliceModal } from './components/AutoSliceModal';
import { OpenUrlModal } from './components/OpenUrlModal';
import { TracksSettingsModal } from './components/TracksSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { useSegmentLooper } from './hooks/useSegmentLooper';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import { useNeonTheme } from './hooks/useNeonTheme';
import { useMediaTracks } from './hooks/useMediaTracks';
import { generateDemoCyberAudio } from './utils/demoMedia';
import { LoopPreset } from './types/player';

export default function App() {
  // Theme and Neon lighting customization
  const neonHook = useNeonTheme();
  const { settings: neonSettings } = neonHook;

  // Media references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // File and media state
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState<string>('Neon_Cyber_Demo_25s.wav');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isDemoLoaded, setIsDemoLoaded] = useState<boolean>(false);

  // Modal visibility states
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [isLightingOpen, setIsLightingOpen] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isAutoSliceOpen, setIsAutoSliceOpen] = useState<boolean>(false);
  const [isOpenUrlOpen, setIsOpenUrlOpen] = useState<boolean>(false);
  const [isTracksOpen, setIsTracksOpen] = useState<boolean>(false);

  // Step looper engine hook - with direct video & audio references and live source awareness
  const looper = useSegmentLooper(videoRef, audioRef, mediaSrc, isVideo);

  // Subtitles & Audio Track Switcher hook
  const mediaTracks = useMediaTracks(videoRef, looper.currentTime);

  // Audio equalizer and frequency visualizer hook - with direct video & audio references
  const audioVis = useAudioVisualizer(videoRef, audioRef, isVideo);

  // Scan embedded audio tracks when video metadata loads
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const handleLoaded = () => mediaTracks.scanEmbeddedAudioTracks();
      videoRef.current.addEventListener('loadedmetadata', handleLoaded);
      return () => videoRef.current?.removeEventListener('loadedmetadata', handleLoaded);
    }
  }, [isVideo, mediaTracks]);

  // Load Built-in Demo Cyber Audio Track
  const handleLoadDemo = useCallback(async () => {
    try {
      const demo = await generateDemoCyberAudio();
      setMediaSrc(demo.url);
      setMediaFile(demo.blob);
      setFileName(demo.fileName);
      setIsVideo(false);
      setIsDemoLoaded(true);
      looper.applyIntervalAndRepeats(5, 4, 0.2);
    } catch (err) {
      console.error('Failed to generate demo track:', err);
    }
  }, [looper]);

  // Load demo automatically on initial mount
  useEffect(() => {
    handleLoadDemo();
  }, []);

  // Handle user file upload (Audio or Video)
  const handleSelectFile = useCallback((file: File) => {
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi|ogv)$/i.test(file.name);
    const url = URL.createObjectURL(file);

    setMediaSrc(url);
    setMediaFile(file);
    setFileName(file.name);
    setIsVideo(isVid);
  }, []);

  // Handle direct online network stream URL (MKV, MP4, WebM, MP3, etc.)
  const handleLoadOnlineUrl = useCallback((url: string, title?: string, isVid = true) => {
    setMediaSrc(url);
    setMediaFile(null); // Network URL
    setFileName(title || url.split('/').pop()?.split('?')[0] || 'Online Media Stream');
    setIsVideo(isVid);
  }, []);

  // Drag and drop file support
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Check if dropped file is subtitle
      if (/\.(srt|vtt)$/i.test(file.name)) {
        mediaTracks.loadSubtitleFile(file);
      } else {
        handleSelectFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Preset load handler
  const handleLoadPreset = (preset: LoopPreset) => {
    looper.setSegments(preset.segments);
    looper.setAutoAdvance(preset.autoAdvance);
    looper.setLoopAll(preset.loopAll);
    looper.setDefaultPauseDelay(preset.defaultDelay);
    looper.selectSegment(0);
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          looper.togglePlay();
          break;
        case 'BracketLeft': // [
          e.preventDefault();
          if (looper.activeSegment) {
            looper.updateSegment(looper.activeSegment.id, {
              startTime: Number(looper.currentTime.toFixed(2)),
            });
          }
          break;
        case 'BracketRight': // ]
          e.preventDefault();
          if (looper.activeSegment) {
            looper.updateSegment(looper.activeSegment.id, {
              endTime: Number(looper.currentTime.toFixed(2)),
            });
          }
          break;
        case 'KeyL':
          e.preventDefault();
          looper.setPlaybackMode(
            looper.playbackMode === 'step-loop'
              ? 'single-loop'
              : looper.playbackMode === 'single-loop'
              ? 'normal'
              : 'step-loop'
          );
          break;
        case 'KeyN':
          e.preventDefault();
          looper.nextSegment();
          break;
        case 'KeyP':
          e.preventDefault();
          looper.prevSegment();
          break;
        case 'KeyR':
          e.preventDefault();
          looper.setCurrentRepeat(0);
          break;
        case 'KeyM':
          e.preventDefault();
          looper.toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          looper.seekTo(Math.max(0, looper.currentTime - (e.shiftKey ? 1 : 5)));
          break;
        case 'ArrowRight':
          e.preventDefault();
          looper.seekTo(Math.min(looper.duration, looper.currentTime + (e.shiftKey ? 1 : 5)));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [looper]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`min-h-screen flex flex-col bg-[#080c14] text-slate-100 ${
        neonSettings.showCyberGrid ? 'cyber-grid' : ''
      }`}
    >
      {/* Top Header */}
      <Header
        currentFileName={fileName}
        isVideo={isVideo}
        segmentCount={looper.segments.length}
        neonSettings={neonSettings}
        onSelectFile={handleSelectFile}
        onOpenUrl={() => setIsOpenUrlOpen(true)}
        onLoadDemoTrack={handleLoadDemo}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenLighting={() => setIsLightingOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
        onOpenTracksSettings={() => setIsTracksOpen(true)}
      />

      {/* Main Player Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-5">
        {/* Top Player Stage */}
        <section className="w-full">
          <PlayerView
            videoRef={videoRef}
            audioRef={audioRef}
            mediaSrc={mediaSrc}
            isVideo={isVideo}
            isPlaying={looper.isPlaying}
            onTogglePlay={looper.togglePlay}
            activeSegment={looper.activeSegment}
            currentRepeat={looper.currentRepeat}
            playbackMode={looper.playbackMode}
            neonSettings={neonSettings}
            audioReactiveLevel={audioVis.audioReactiveLevel}
            analyserRef={audioVis.analyserRef}
            currentSegmentIndex={looper.currentSegmentIndex}
            totalSegments={looper.segments.length}
            currentCueText={mediaTracks.currentCueText}
            subtitleFontSize={mediaTracks.subtitleFontSize}
            onOpenTracksSettings={() => setIsTracksOpen(true)}
            hasAudioLanguages={mediaTracks.audioTracks.length > 1}
          />

          {/* Interactive Timeline with Segment Blocks */}
          <InteractiveTimeline
            currentTime={looper.currentTime}
            duration={looper.duration}
            segments={looper.segments}
            currentSegmentIndex={looper.currentSegmentIndex}
            onSeek={looper.seekTo}
            onSelectSegment={(idx) => looper.selectSegment(idx, true)}
          />
        </section>

        {/* Step-by-Step Looper Controller Panel */}
        <section className="w-full">
          <LoopControllerPanel
            segments={looper.segments}
            activeSegment={looper.activeSegment}
            currentSegmentIndex={looper.currentSegmentIndex}
            currentRepeat={looper.currentRepeat}
            playbackMode={looper.playbackMode}
            autoAdvance={looper.autoAdvance}
            loopAll={looper.loopAll}
            defaultPauseDelay={looper.defaultPauseDelay}
            intervalSeconds={looper.intervalSeconds}
            repeatsPerSegment={looper.repeatsPerSegment}
            isPlaying={looper.isPlaying}
            currentTime={looper.currentTime}
            duration={looper.duration}
            playbackRate={looper.playbackRate}
            volume={looper.volume}
            isMuted={looper.isMuted}
            onTogglePlay={looper.togglePlay}
            onSeek={looper.seekTo}
            onSelectSegment={(idx) => looper.selectSegment(idx, looper.isPlaying)}
            onNextSegment={looper.nextSegment}
            onPrevSegment={looper.prevSegment}
            onResetRepeat={() => looper.setCurrentRepeat(0)}
            onSetPlaybackMode={looper.setPlaybackMode}
            onSetAutoAdvance={looper.setAutoAdvance}
            onSetLoopAll={looper.setLoopAll}
            onSetDefaultPauseDelay={looper.setDefaultPauseDelay}
            onApplyIntervalAndRepeats={looper.applyIntervalAndRepeats}
            onAddSegment={looper.addSegment}
            onUpdateSegment={looper.updateSegment}
            onRemoveSegment={looper.removeSegment}
            onOpenAutoSlice={() => setIsAutoSliceOpen(true)}
            onChangeSpeed={looper.changePlaybackRate}
            onSpeedUp={looper.speedUp}
            onSlowDown={looper.slowDown}
            onChangeVolume={looper.changeVolume}
            onToggleMute={looper.toggleMute}
          />
        </section>
      </main>

      {/* Keyboard Shortcuts Hint Bar */}
      <footer className="w-full border-t border-slate-800/80 bg-[#070a12]/80 backdrop-blur-md px-4 py-2.5 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-slate-300">Hotkeys:</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">Space</kbd> Play/Pause
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">[</kbd> Mark Start
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">]</kbd> Mark End
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">L</kbd> Loop Mode
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">N</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">P</kbd> Next/Prev Segment
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">R</kbd> Reset Loop
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Windows & Android Ready (PWA)</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--neon-color)' }} />
          </div>
        </div>
      </footer>

      {/* Modals */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      <LightingSettingsModal
        isOpen={isLightingOpen}
        onClose={() => setIsLightingOpen(false)}
        neonHook={neonHook}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentSegments={looper.segments}
        currentFileName={fileName}
        mediaType={isVideo ? 'video' : 'audio'}
        mediaDuration={looper.duration}
        autoAdvance={looper.autoAdvance}
        loopAll={looper.loopAll}
        defaultDelay={looper.defaultPauseDelay}
        onLoadPreset={handleLoadPreset}
      />

      <ExportMediaModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        mediaFile={mediaFile}
        mediaSrc={mediaSrc}
        videoElement={videoRef.current}
        isVideo={isVideo}
        segments={looper.segments}
        mediaDuration={looper.duration}
      />

      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        eq={audioVis.eq}
        updateEqualizer={audioVis.updateEqualizer}
        playbackRate={looper.playbackRate}
        changePlaybackRate={looper.changePlaybackRate}
      />

      <AutoSliceModal
        isOpen={isAutoSliceOpen}
        onClose={() => setIsAutoSliceOpen(false)}
        mediaDuration={looper.duration}
        onApplySlice={(interval, repeats, pause) => {
          looper.autoSlice(interval, repeats, pause);
        }}
      />

      {/* Online Network Stream URL Modal */}
      <OpenUrlModal
        isOpen={isOpenUrlOpen}
        onClose={() => setIsOpenUrlOpen(false)}
        onLoadUrl={handleLoadOnlineUrl}
        onLoadSubtitleUrl={(url, label) => mediaTracks.loadSubtitleUrl(url, label)}
        onLoadAudioUrl={(url, label) => mediaTracks.loadExternalAudioTrack(url, label)}
      />

      {/* Subtitles & Audio Track Switcher Modal */}
      <TracksSettingsModal
        isOpen={isTracksOpen}
        onClose={() => setIsTracksOpen(false)}
        mediaTracks={mediaTracks}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
