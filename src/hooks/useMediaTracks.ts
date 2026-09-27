import { useState, useEffect, useRef, useCallback } from 'react';
import { SubtitleCue, SubtitleTrack, AudioLanguageTrack } from '../types/subtitles';
import { parseSrtOrVtt } from '../utils/subtitleParser';

export function useMediaTracks(videoRef: React.RefObject<HTMLVideoElement | null>, currentTime: number) {
  // Subtitles
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleTrackId, setActiveSubtitleTrackId] = useState<string | null>(null);
  const [currentCueText, setCurrentCueText] = useState<string | null>(null);
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(18); // px

  // Audio Tracks (MKV multi-audio language switching)
  const [audioTracks, setAudioTracks] = useState<AudioLanguageTrack[]>([
    { id: 'default', label: 'Track 1 (Default / Original)', language: 'orig', isExternal: false },
  ]);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState<string>('default');
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);

  // Detect embedded HTML5 audioTracks on video load
  const scanEmbeddedAudioTracks = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if browser supports video.audioTracks (Chromium, Safari)
    const mediaWithAudioTracks = video as unknown as {
      audioTracks?: {
        length: number;
        [index: number]: { id: string; label: string; language: string; enabled: boolean };
      };
    };

    if (mediaWithAudioTracks.audioTracks && mediaWithAudioTracks.audioTracks.length > 1) {
      const list: AudioLanguageTrack[] = [];
      for (let i = 0; i < mediaWithAudioTracks.audioTracks.length; i++) {
        const tr = mediaWithAudioTracks.audioTracks[i];
        list.push({
          id: tr.id || `track_${i}`,
          label: tr.label || `Audio Track ${i + 1} (${tr.language || 'und'})`,
          language: tr.language || 'und',
          isExternal: false,
        });
      }
      setAudioTracks(list);
      setActiveAudioTrackId(list[0].id);
    }
  }, [videoRef]);

  // Synchronize external audio track (e.g. Farsi dubbing track) with video
  useEffect(() => {
    const video = videoRef.current;
    const extAudio = externalAudioRef.current;
    if (!video || !extAudio) return;

    const isExternalActive = audioTracks.find((t) => t.id === activeAudioTrackId)?.isExternal;

    if (isExternalActive) {
      video.muted = true; // mute video original sound
      extAudio.muted = false;

      // Sync position if drifted > 0.15s
      if (Math.abs(extAudio.currentTime - video.currentTime) > 0.15) {
        extAudio.currentTime = video.currentTime;
      }

      if (video.paused && !extAudio.paused) {
        extAudio.pause();
      } else if (!video.paused && extAudio.paused) {
        extAudio.play().catch(() => {});
      }
    } else {
      video.muted = false;
      if (!extAudio.paused) extAudio.pause();
    }
  }, [currentTime, activeAudioTrackId, audioTracks, videoRef]);

  // Update active subtitle cue based on currentTime
  useEffect(() => {
    if (!activeSubtitleTrackId) {
      setCurrentCueText(null);
      return;
    }

    const track = subtitleTracks.find((t) => t.id === activeSubtitleTrackId);
    if (!track) {
      setCurrentCueText(null);
      return;
    }

    const foundCue = track.cues.find(
      (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
    );

    setCurrentCueText(foundCue ? foundCue.text : null);
  }, [currentTime, activeSubtitleTrackId, subtitleTracks]);

  // Load Subtitle file (.srt, .vtt)
  const loadSubtitleFile = useCallback(async (file: File) => {
    const text = await file.text();
    const cues = parseSrtOrVtt(text);
    const newTrack: SubtitleTrack = {
      id: `sub_${Date.now()}`,
      label: file.name.replace(/\.[^/.]+$/, ''),
      language: file.name.toLowerCase().includes('fa') || file.name.toLowerCase().includes('per') ? 'fa' : 'en',
      cues,
    };
    setSubtitleTracks((prev) => [...prev, newTrack]);
    setActiveSubtitleTrackId(newTrack.id);
  }, []);

  // Load Subtitle from URL
  const loadSubtitleUrl = useCallback(async (url: string, label: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const cues = parseSrtOrVtt(text);
      const newTrack: SubtitleTrack = {
        id: `sub_url_${Date.now()}`,
        label: label || 'Online Subtitle',
        language: 'en',
        cues,
      };
      setSubtitleTracks((prev) => [...prev, newTrack]);
      setActiveSubtitleTrackId(newTrack.id);
    } catch (e) {
      console.error('Failed to load subtitle from URL', e);
    }
  }, []);

  // Load External Audio (e.g. Persian/Farsi dubbing track or commentary)
  const loadExternalAudioTrack = useCallback((fileOrUrl: File | string, label: string) => {
    let url: string;
    let name: string;
    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
      name = label || 'Online Dub Audio';
    } else {
      url = URL.createObjectURL(fileOrUrl);
      name = label || fileOrUrl.name;
    }

    if (!externalAudioRef.current) {
      externalAudioRef.current = new Audio();
    }
    externalAudioRef.current.src = url;

    const newTrack: AudioLanguageTrack = {
      id: `audio_ext_${Date.now()}`,
      label: name,
      language: name.toLowerCase().includes('fa') || name.toLowerCase().includes('persian') ? 'fa' : 'ext',
      isExternal: true,
      src: url,
    };

    setAudioTracks((prev) => [...prev, newTrack]);
    setActiveAudioTrackId(newTrack.id);
  }, []);

  // Switch Audio Track
  const selectAudioTrack = useCallback((trackId: string) => {
    setActiveAudioTrackId(trackId);
    const video = videoRef.current;
    if (!video) return;

    const targetTrack = audioTracks.find((t) => t.id === trackId);
    if (!targetTrack) return;

    if (targetTrack.isExternal) {
      video.muted = true;
      if (externalAudioRef.current) {
        externalAudioRef.current.currentTime = video.currentTime;
        if (!video.paused) externalAudioRef.current.play().catch(() => {});
      }
    } else {
      video.muted = false;
      if (externalAudioRef.current) {
        externalAudioRef.current.pause();
      }
      // HTML5 audioTracks switching if supported
      const mediaWithAudio = video as unknown as {
        audioTracks?: {
          length: number;
          [index: number]: { id: string; enabled: boolean };
        };
      };
      if (mediaWithAudio.audioTracks) {
        for (let i = 0; i < mediaWithAudio.audioTracks.length; i++) {
          const at = mediaWithAudio.audioTracks[i];
          at.enabled = at.id === trackId;
        }
      }
    }
  }, [audioTracks, videoRef]);

  return {
    subtitleTracks,
    activeSubtitleTrackId,
    setActiveSubtitleTrackId,
    currentCueText,
    subtitleFontSize,
    setSubtitleFontSize,
    loadSubtitleFile,
    loadSubtitleUrl,
    audioTracks,
    activeAudioTrackId,
    selectAudioTrack,
    loadExternalAudioTrack,
    scanEmbeddedAudioTracks,
    externalAudioRef,
  };
}
