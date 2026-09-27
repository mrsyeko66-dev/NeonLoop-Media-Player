import { useState, useRef, useEffect, useCallback } from 'react';
import { MediaSegment, PlaybackMode } from '../types/player';

export function useSegmentLooper(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  mediaSrc?: string | null,
  isVideo = false
) {
  // Interval & Repeat configuration
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const [repeatsPerSegment, setRepeatsPerSegment] = useState<number>(4);
  const [defaultPauseDelay, setDefaultPauseDelay] = useState<number>(0.2);
  const [autoGenerateToEnd, setAutoGenerateToEnd] = useState<boolean>(true);

  const [segments, setSegments] = useState<MediaSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('step-loop');
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [loopAll, setLoopAll] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(25);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Synchronous references to eliminate React closure lag in high-frequency animation frames
  const segmentsRef = useRef<MediaSegment[]>([]);
  const currentSegmentIndexRef = useRef<number>(0);
  const currentRepeatRef = useRef<number>(0);
  const playbackModeRef = useRef<PlaybackMode>('step-loop');
  const autoAdvanceRef = useRef<boolean>(true);
  const loopAllRef = useRef<boolean>(false);
  const defaultPauseDelayRef = useRef<number>(0.2);

  const isTransitioningRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const lastLoadedSrcRef = useRef<string | null>(null);

  // Dynamic getter for the current active media element (Video or Audio)
  const getActiveMedia = useCallback((): HTMLMediaElement | null => {
    return isVideo ? videoRef.current : audioRef.current;
  }, [isVideo, videoRef, audioRef]);

  // Keep references in sync with state
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    currentSegmentIndexRef.current = currentSegmentIndex;
  }, [currentSegmentIndex]);

  useEffect(() => {
    currentRepeatRef.current = currentRepeat;
  }, [currentRepeat]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  useEffect(() => {
    autoAdvanceRef.current = autoAdvance;
  }, [autoAdvance]);

  useEffect(() => {
    loopAllRef.current = loopAll;
  }, [loopAll]);

  useEffect(() => {
    defaultPauseDelayRef.current = defaultPauseDelay;
  }, [defaultPauseDelay]);

  // Helper to generate segments across the entire file from 0 to totalDuration
  const generateFullTrackSegments = useCallback(
    (
      totalDuration: number,
      interval = intervalSeconds,
      repeats = repeatsPerSegment,
      pause = defaultPauseDelay
    ) => {
      if (totalDuration <= 0 || interval <= 0) return [];
      const newSegments: MediaSegment[] = [];
      const colors = [
        '#00f0ff',
        '#3b82f6',
        '#a855f7',
        '#ec4899',
        '#10b981',
        '#f59e0b',
        '#06b6d4',
        '#8b5cf6',
      ];

      let start = 0;
      let idx = 1;
      while (start < totalDuration) {
        const end = Math.min(start + interval, totalDuration);
        if (end - start < 0.2 && newSegments.length > 0) break;
        newSegments.push({
          id: `seg_auto_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: `Section ${idx} (${Math.round(start)}s - ${Math.round(end)}s)`,
          startTime: Number(start.toFixed(2)),
          endTime: Number(end.toFixed(2)),
          repeatCount: repeats,
          pauseDelay: pause,
          color: colors[(idx - 1) % colors.length],
        });
        start = end;
        idx++;
      }
      return newSegments;
    },
    [intervalSeconds, repeatsPerSegment, defaultPauseDelay]
  );

  // Active segment
  const activeSegment: MediaSegment | null =
    segments.length > 0 && currentSegmentIndex < segments.length
      ? segments[currentSegmentIndex]
      : null;

  // Jump to specific segment
  const selectSegment = useCallback(
    (index: number, andPlay = false) => {
      const segs = segmentsRef.current;
      if (index < 0 || index >= segs.length) return;
      const target = segs[index];

      currentSegmentIndexRef.current = index;
      currentRepeatRef.current = 0;
      setCurrentSegmentIndex(index);
      setCurrentRepeat(0);

      const media = getActiveMedia();
      if (media) {
        isTransitioningRef.current = true;
        media.currentTime = target.startTime;
        setTimeout(() => {
          isTransitioningRef.current = false;
          if (andPlay) {
            media.play().catch(() => {});
          }
        }, 60);
      }
    },
    [getActiveMedia]
  );

  // Next / Previous Segment
  const nextSegment = useCallback(() => {
    const segs = segmentsRef.current;
    if (segs.length === 0) return;
    const nextIdx = (currentSegmentIndexRef.current + 1) % segs.length;
    selectSegment(nextIdx, isPlaying);
  }, [selectSegment, isPlaying]);

  const prevSegment = useCallback(() => {
    const segs = segmentsRef.current;
    if (segs.length === 0) return;
    const prevIdx = (currentSegmentIndexRef.current - 1 + segs.length) % segs.length;
    selectSegment(prevIdx, isPlaying);
  }, [selectSegment, isPlaying]);

  // Robust loop checker that dynamically queries active media (video or audio) on every frame
  useEffect(() => {
    const checkLoopBounds = () => {
      const media = isVideo ? videoRef.current : audioRef.current;
      if (!media || media.paused || isTransitioningRef.current) {
        rafRef.current = requestAnimationFrame(checkLoopBounds);
        return;
      }

      const curr = media.currentTime;
      const mode = playbackModeRef.current;
      const segs = segmentsRef.current;
      const cIdx = currentSegmentIndexRef.current;
      const cRep = currentRepeatRef.current;
      const seg = segs[cIdx];

      if (!seg) {
        rafRef.current = requestAnimationFrame(checkLoopBounds);
        return;
      }

      // Check if playback has reached the end threshold of the current segment
      if (curr >= seg.endTime - 0.04) {
        isTransitioningRef.current = true;

        if (mode === 'step-loop') {
          const requiredRepeats = Math.max(1, seg.repeatCount);
          const delay = seg.pauseDelay ?? defaultPauseDelayRef.current;

          if (cRep + 1 < requiredRepeats) {
            // Repeat current segment again
            const nextRep = cRep + 1;
            currentRepeatRef.current = nextRep;
            setCurrentRepeat(nextRep);

            if (delay > 0.04) {
              media.pause();
              setTimeout(() => {
                const targetMedia = isVideo ? videoRef.current : audioRef.current;
                if (targetMedia) {
                  targetMedia.currentTime = seg.startTime;
                  targetMedia.play().catch(() => {});
                  isTransitioningRef.current = false;
                }
              }, delay * 1000);
            } else {
              media.currentTime = seg.startTime;
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 60);
            }
          } else {
            // Finished all repeats for this segment! Advance to next section
            if (autoAdvanceRef.current) {
              if (cIdx + 1 < segs.length) {
                const nextIdx = cIdx + 1;
                const nextSeg = segs[nextIdx];

                currentSegmentIndexRef.current = nextIdx;
                currentRepeatRef.current = 0;
                setCurrentSegmentIndex(nextIdx);
                setCurrentRepeat(0);

                if (delay > 0.04) {
                  media.pause();
                  setTimeout(() => {
                    const targetMedia = isVideo ? videoRef.current : audioRef.current;
                    if (targetMedia) {
                      targetMedia.currentTime = nextSeg.startTime;
                      targetMedia.play().catch(() => {});
                      isTransitioningRef.current = false;
                    }
                  }, delay * 1000);
                } else {
                  media.currentTime = nextSeg.startTime;
                  setTimeout(() => {
                    isTransitioningRef.current = false;
                  }, 60);
                }
              } else if (loopAllRef.current) {
                // Reached the end of the entire track and loopAll is enabled: jump back to section 1
                const firstSeg = segs[0];
                currentSegmentIndexRef.current = 0;
                currentRepeatRef.current = 0;
                setCurrentSegmentIndex(0);
                setCurrentRepeat(0);

                if (delay > 0.04) {
                  media.pause();
                  setTimeout(() => {
                    const targetMedia = isVideo ? videoRef.current : audioRef.current;
                    if (targetMedia) {
                      targetMedia.currentTime = firstSeg.startTime;
                      targetMedia.play().catch(() => {});
                      isTransitioningRef.current = false;
                    }
                  }, delay * 1000);
                } else {
                  media.currentTime = firstSeg.startTime;
                  setTimeout(() => {
                    isTransitioningRef.current = false;
                  }, 60);
                }
              } else {
                // Completed the entire file: stop cleanly
                media.pause();
                isTransitioningRef.current = false;
              }
            } else {
              // Stay on current segment, repeat from 0
              currentRepeatRef.current = 0;
              setCurrentRepeat(0);
              media.currentTime = seg.startTime;
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 60);
            }
          }
        } else if (mode === 'single-loop') {
          // Loop current single section endlessly
          media.currentTime = seg.startTime;
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 60);
        }
      }

      rafRef.current = requestAnimationFrame(checkLoopBounds);
    };

    rafRef.current = requestAnimationFrame(checkLoopBounds);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVideo, videoRef, audioRef]);

  // Media event listeners & Full Track Duration Binding (Updates whenever isVideo or mediaSrc changes)
  useEffect(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media) return;

    if ('preservesPitch' in media) {
      (media as HTMLMediaElement).preservesPitch = true;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleDurationOrMetadata = () => {
      const dur = media.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);

        // ONLY generate segments if this is a newly loaded track or source changed!
        const currentSrcKey = mediaSrc || media.currentSrc || media.src;
        if (currentSrcKey && currentSrcKey !== lastLoadedSrcRef.current) {
          lastLoadedSrcRef.current = currentSrcKey;

          if (autoGenerateToEnd) {
            const generated = generateFullTrackSegments(
              dur,
              intervalSeconds,
              repeatsPerSegment,
              defaultPauseDelay
            );
            segmentsRef.current = generated;
            currentSegmentIndexRef.current = 0;
            currentRepeatRef.current = 0;
            setSegments(generated);
            setCurrentSegmentIndex(0);
            setCurrentRepeat(0);
          }
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    // If metadata was already loaded for a new source:
    if (media.duration && !isNaN(media.duration) && isFinite(media.duration) && media.duration > 0) {
      handleDurationOrMetadata();
    }

    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('loadedmetadata', handleDurationOrMetadata);
    media.addEventListener('durationchange', handleDurationOrMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('loadedmetadata', handleDurationOrMetadata);
      media.removeEventListener('durationchange', handleDurationOrMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [
    isVideo,
    mediaSrc,
    videoRef,
    audioRef,
    autoGenerateToEnd,
    generateFullTrackSegments,
    intervalSeconds,
    repeatsPerSegment,
    defaultPauseDelay,
  ]);

  // Reset lastLoadedSrcRef when user unloads or switches mediaSrc completely
  useEffect(() => {
    if (!mediaSrc) {
      lastLoadedSrcRef.current = null;
    }
  }, [mediaSrc]);

  // Controls
  const togglePlay = useCallback(() => {
    const media = getActiveMedia();
    if (!media) return;

    if (media.paused) {
      const seg = segmentsRef.current[currentSegmentIndexRef.current];
      if (
        playbackModeRef.current === 'step-loop' &&
        seg &&
        (media.currentTime < seg.startTime || media.currentTime >= seg.endTime)
      ) {
        media.currentTime = seg.startTime;
      }
      media.play().catch(() => {});
    } else {
      media.pause();
    }
  }, [getActiveMedia]);

  const seekTo = useCallback(
    (time: number) => {
      const media = getActiveMedia();
      if (!media) return;
      const clamped = Math.max(0, Math.min(time, duration));
      media.currentTime = clamped;
      setCurrentTime(clamped);

      // Find which segment this time belongs to and update current segment
      const segs = segmentsRef.current;
      if (segs.length > 0) {
        const foundIdx = segs.findIndex(
          (seg) => clamped >= seg.startTime && clamped <= seg.endTime
        );
        if (foundIdx !== -1) {
          currentSegmentIndexRef.current = foundIdx;
          currentRepeatRef.current = 0;
          setCurrentSegmentIndex(foundIdx);
          setCurrentRepeat(0);
        }
      }
    },
    [getActiveMedia, duration]
  );

  const changePlaybackRate = useCallback(
    (rate: number) => {
      const clamped = Math.max(0.25, Math.min(rate, 3.0));
      setPlaybackRate(clamped);
      const media = getActiveMedia();
      if (media) {
        media.playbackRate = clamped;
      }
    },
    [getActiveMedia]
  );

  const speedUp = useCallback(() => {
    changePlaybackRate(Number((playbackRate + 0.25).toFixed(2)));
  }, [playbackRate, changePlaybackRate]);

  const slowDown = useCallback(() => {
    changePlaybackRate(Number((playbackRate - 0.25).toFixed(2)));
  }, [playbackRate, changePlaybackRate]);

  const changeVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(vol, 1));
      setVolume(clamped);
      const media = getActiveMedia();
      if (media) {
        media.volume = clamped;
        if (clamped > 0 && isMuted) {
          media.muted = false;
          setIsMuted(false);
        }
      }
    },
    [getActiveMedia, isMuted]
  );

  const toggleMute = useCallback(() => {
    const media = getActiveMedia();
    if (!media) return;
    const nextMuted = !isMuted;
    media.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [getActiveMedia, isMuted]);

  // Segment Management
  const addSegment = useCallback(
    (start: number, end: number, repeats = 4, pause = defaultPauseDelay, name?: string) => {
      const currentSegments = segmentsRef.current;
      const idx = currentSegments.length + 1;
      const colors = [
        '#00f0ff',
        '#3b82f6',
        '#a855f7',
        '#ec4899',
        '#10b981',
        '#f59e0b',
        '#06b6d4',
        '#8b5cf6',
      ];
      const newSeg: MediaSegment = {
        id: `seg_manual_${idx}_${Date.now()}`,
        name: name || `Section ${idx} (${Math.round(start)}s - ${Math.round(end)}s)`,
        startTime: Number(start.toFixed(2)),
        endTime: Number(end.toFixed(2)),
        repeatCount: repeats,
        pauseDelay: pause,
        color: colors[(idx - 1) % colors.length],
      };
      const updated = [...currentSegments, newSeg].sort((a, b) => a.startTime - b.startTime);
      segmentsRef.current = updated;
      setSegments(updated);
    },
    [defaultPauseDelay]
  );

  const updateSegment = useCallback((id: string, updates: Partial<MediaSegment>) => {
    const updated = segmentsRef.current.map((seg) =>
      seg.id === id ? { ...seg, ...updates } : seg
    );
    segmentsRef.current = updated;
    setSegments(updated);
  }, []);

  const removeSegment = useCallback((id: string) => {
    const updated = segmentsRef.current.filter((seg) => seg.id !== id);
    segmentsRef.current = updated;
    setSegments(updated);
  }, []);

  // Explicit user auto-slice
  const autoSlice = useCallback(
    (interval: number, repeats: number, pause = defaultPauseDelay) => {
      const media = getActiveMedia();
      const dur = media?.duration || duration;
      if (dur > 0) {
        setIntervalSeconds(interval);
        setRepeatsPerSegment(repeats);
        setDefaultPauseDelay(pause);
        const generated = generateFullTrackSegments(dur, interval, repeats, pause);
        segmentsRef.current = generated;
        currentSegmentIndexRef.current = 0;
        currentRepeatRef.current = 0;
        setSegments(generated);
        setCurrentSegmentIndex(0);
        setCurrentRepeat(0);
      }
    },
    [getActiveMedia, duration, generateFullTrackSegments, defaultPauseDelay]
  );

  const applyIntervalAndRepeats = useCallback(
    (interval: number, repeats: number, pause = defaultPauseDelay) => {
      setIntervalSeconds(interval);
      setRepeatsPerSegment(repeats);
      setDefaultPauseDelay(pause);
      const media = getActiveMedia();
      const dur = media?.duration || duration;
      if (dur > 0) {
        const generated = generateFullTrackSegments(dur, interval, repeats, pause);
        segmentsRef.current = generated;
        currentSegmentIndexRef.current = 0;
        currentRepeatRef.current = 0;
        setSegments(generated);
        setCurrentSegmentIndex(0);
        setCurrentRepeat(0);
      }
    },
    [getActiveMedia, duration, generateFullTrackSegments, defaultPauseDelay]
  );

  return {
    segments,
    setSegments,
    currentSegmentIndex,
    currentRepeat,
    setCurrentRepeat,
    activeSegment,
    playbackMode,
    setPlaybackMode,
    autoAdvance,
    setAutoAdvance,
    loopAll,
    setLoopAll,
    intervalSeconds,
    repeatsPerSegment,
    defaultPauseDelay,
    setDefaultPauseDelay,
    autoGenerateToEnd,
    setAutoGenerateToEnd,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    togglePlay,
    seekTo,
    selectSegment,
    nextSegment,
    prevSegment,
    changePlaybackRate,
    speedUp,
    slowDown,
    changeVolume,
    toggleMute,
    addSegment,
    updateSegment,
    removeSegment,
    autoSlice,
    applyIntervalAndRepeats,
  };
}
