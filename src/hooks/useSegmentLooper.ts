import { useState, useRef, useEffect, useCallback } from 'react';
import { MediaSegment, PlaybackMode } from '../types/player';

export function useSegmentLooper(
  mediaRef: React.RefObject<HTMLMediaElement | null>,
  mediaSrc?: string | null,
  isVideo?: boolean
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
  const [loopAll, setLoopAll] = useState<boolean>(false); // Loop entire file once reached the end
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(25);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const isTransitioningRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);

  // Helper to generate segments across the entire file from 0 to totalDuration
  const generateFullTrackSegments = useCallback(
    (totalDuration: number, interval = intervalSeconds, repeats = repeatsPerSegment, pause = defaultPauseDelay) => {
      if (totalDuration <= 0 || interval <= 0) return [];
      const newSegments: MediaSegment[] = [];
      const colors = ['#00f0ff', '#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

      let start = 0;
      let idx = 1;
      while (start < totalDuration) {
        const end = Math.min(start + interval, totalDuration);
        if (end - start < 0.2 && newSegments.length > 0) break; // Avoid negligible sliver at end
        newSegments.push({
          id: `seg_auto_${idx}_${Date.now()}`,
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
  const selectSegment = useCallback((index: number, andPlay = false) => {
    if (index < 0 || index >= segments.length) return;
    const target = segments[index];
    setCurrentSegmentIndex(index);
    setCurrentRepeat(0);

    const media = mediaRef.current;
    if (media) {
      media.currentTime = target.startTime;
      if (andPlay) {
        media.play().catch(() => {});
      }
    }
  }, [segments, mediaRef]);

  // Next / Previous Segment
  const nextSegment = useCallback(() => {
    if (segments.length === 0) return;
    const nextIdx = (currentSegmentIndex + 1) % segments.length;
    selectSegment(nextIdx, isPlaying);
  }, [currentSegmentIndex, segments.length, selectSegment, isPlaying]);

  const prevSegment = useCallback(() => {
    if (segments.length === 0) return;
    const prevIdx = (currentSegmentIndex - 1 + segments.length) % segments.length;
    selectSegment(prevIdx, isPlaying);
  }, [currentSegmentIndex, segments.length, selectSegment, isPlaying]);

  // High performance loop checker using requestAnimationFrame
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const checkLoopBounds = () => {
      if (!media || media.paused || isTransitioningRef.current) {
        rafRef.current = requestAnimationFrame(checkLoopBounds);
        return;
      }

      const curr = media.currentTime;

      if (playbackMode === 'step-loop' && activeSegment) {
        if (curr >= activeSegment.endTime - 0.04) {
          isTransitioningRef.current = true;

          const requiredRepeats = Math.max(1, activeSegment.repeatCount);
          const delay = activeSegment.pauseDelay ?? defaultPauseDelay;

          const doSmoothSeek = (targetTime: number) => {
            if (!media) return;
            media.currentTime = targetTime;
            const onSeeked = () => {
              media.removeEventListener('seeked', onSeeked);
              isTransitioningRef.current = false;
            };
            media.addEventListener('seeked', onSeeked, { once: true });
          };

          if (currentRepeat + 1 < requiredRepeats) {
            // Repeat current segment again
            const nextRep = currentRepeat + 1;
            setCurrentRepeat(nextRep);

            if (delay > 0.05) {
              media.pause();
              setTimeout(() => {
                if (media) {
                  media.currentTime = activeSegment.startTime;
                  media.play().catch(() => {});
                  isTransitioningRef.current = false;
                }
              }, delay * 1000);
            } else {
              doSmoothSeek(activeSegment.startTime);
            }
          } else {
            // Segment finished all repeats! Auto advance to next segment
            if (autoAdvance) {
              if (currentSegmentIndex + 1 < segments.length) {
                const nextSegIndex = currentSegmentIndex + 1;
                const nextSeg = segments[nextSegIndex];
                setCurrentSegmentIndex(nextSegIndex);
                setCurrentRepeat(0);

                if (delay > 0.05) {
                  media.pause();
                  setTimeout(() => {
                    if (media) {
                      media.currentTime = nextSeg.startTime;
                      media.play().catch(() => {});
                      isTransitioningRef.current = false;
                    }
                  }, delay * 1000);
                } else {
                  doSmoothSeek(nextSeg.startTime);
                }
              } else if (loopAll) {
                // Reached the very end of the file; loop back to start
                const firstSeg = segments[0];
                setCurrentSegmentIndex(0);
                setCurrentRepeat(0);
                if (delay > 0.05) {
                  media.pause();
                  setTimeout(() => {
                    if (media) {
                      media.currentTime = firstSeg.startTime;
                      media.play().catch(() => {});
                      isTransitioningRef.current = false;
                    }
                  }, delay * 1000);
                } else {
                  doSmoothSeek(firstSeg.startTime);
                }
              } else {
                // Reached the end of the entire file: stop cleanly
                media.pause();
                isTransitioningRef.current = false;
              }
            } else {
              // Stay on current segment but repeat from 0
              setCurrentRepeat(0);
              doSmoothSeek(activeSegment.startTime);
            }
          }
        }
      } else if (playbackMode === 'single-loop' && activeSegment) {
        if (curr >= activeSegment.endTime - 0.04) {
          media.currentTime = activeSegment.startTime;
        }
      }

      rafRef.current = requestAnimationFrame(checkLoopBounds);
    };

    rafRef.current = requestAnimationFrame(checkLoopBounds);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    activeSegment,
    currentRepeat,
    currentSegmentIndex,
    segments,
    playbackMode,
    autoAdvance,
    loopAll,
    defaultPauseDelay,
    mediaRef,
  ]);

  // Media event listeners & Full Track Duration Binding
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    // Preserve natural pitch across all speeds (0.25x - 3.0x)
    if ('preservesPitch' in media) {
      (media as HTMLMediaElement).preservesPitch = true;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleDurationChange = () => {
      const dur = media.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
        // Automatically partition across the full real length of the newly loaded video/audio!
        if (autoGenerateToEnd) {
          const generated = generateFullTrackSegments(
            dur,
            intervalSeconds,
            repeatsPerSegment,
            defaultPauseDelay
          );
          setSegments(generated);
          setCurrentSegmentIndex(0);
          setCurrentRepeat(0);
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    // If metadata was ALREADY loaded before effect ran (common with local files and fast video decoders):
    if (media.duration && !isNaN(media.duration) && isFinite(media.duration) && media.duration > 0) {
      handleDurationChange();
    }

    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('loadedmetadata', handleDurationChange);
    media.addEventListener('canplay', handleDurationChange);
    media.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('loadedmetadata', handleDurationChange);
      media.removeEventListener('canplay', handleDurationChange);
      media.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [
    mediaRef,
    mediaSrc,
    isVideo,
    autoGenerateToEnd,
    generateFullTrackSegments,
    intervalSeconds,
    repeatsPerSegment,
    defaultPauseDelay,
  ]);

  // Controls
  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (media.paused) {
      if (
        playbackMode === 'step-loop' &&
        activeSegment &&
        (media.currentTime < activeSegment.startTime || media.currentTime >= activeSegment.endTime)
      ) {
        media.currentTime = activeSegment.startTime;
      }
      media.play().catch(() => {});
    } else {
      media.pause();
    }
  }, [mediaRef, playbackMode, activeSegment]);

  const seekTo = useCallback((time: number) => {
    const media = mediaRef.current;
    if (!media) return;
    const clamped = Math.max(0, Math.min(time, duration));
    media.currentTime = clamped;
    setCurrentTime(clamped);

    // If step-loop mode, find which segment this time belongs to
    if (segments.length > 0) {
      const foundIdx = segments.findIndex(
        (seg) => clamped >= seg.startTime && clamped <= seg.endTime
      );
      if (foundIdx !== -1) {
        setCurrentSegmentIndex(foundIdx);
        setCurrentRepeat(0);
      }
    }
  }, [mediaRef, duration, segments]);

  const changePlaybackRate = useCallback((rate: number) => {
    const clamped = Math.max(0.25, Math.min(rate, 3.0));
    setPlaybackRate(clamped);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = clamped;
    }
  }, [mediaRef]);

  const speedUp = useCallback(() => {
    changePlaybackRate(Number((playbackRate + 0.25).toFixed(2)));
  }, [playbackRate, changePlaybackRate]);

  const slowDown = useCallback(() => {
    changePlaybackRate(Number((playbackRate - 0.25).toFixed(2)));
  }, [playbackRate, changePlaybackRate]);

  const changeVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(vol, 1));
    setVolume(clamped);
    if (mediaRef.current) {
      mediaRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        mediaRef.current.muted = false;
        setIsMuted(false);
      }
    }
  }, [mediaRef, isMuted]);

  const toggleMute = useCallback(() => {
    if (!mediaRef.current) return;
    const nextMuted = !isMuted;
    mediaRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [mediaRef, isMuted]);

  // Segment Management
  const addSegment = useCallback(
    (start: number, end: number, repeats = 4, pause = defaultPauseDelay, name?: string) => {
      const idx = segments.length + 1;
      const colors = ['#00f0ff', '#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];
      const newSeg: MediaSegment = {
        id: `seg_manual_${idx}_${Date.now()}`,
        name: name || `Section ${idx} (${Math.round(start)}s - ${Math.round(end)}s)`,
        startTime: Number(start.toFixed(2)),
        endTime: Number(end.toFixed(2)),
        repeatCount: repeats,
        pauseDelay: pause,
        color: colors[(idx - 1) % colors.length],
      };
      setSegments((prev) => [...prev, newSeg].sort((a, b) => a.startTime - b.startTime));
    },
    [segments.length, defaultPauseDelay]
  );

  const updateSegment = useCallback((id: string, updates: Partial<MediaSegment>) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  }, []);

  const removeSegment = useCallback((id: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id));
  }, []);

  // Auto-slice entire video or audio track
  const autoSlice = useCallback(
    (interval: number, repeats: number, pause = defaultPauseDelay) => {
      const dur = mediaRef.current?.duration || duration;
      if (dur > 0) {
        setIntervalSeconds(interval);
        setRepeatsPerSegment(repeats);
        setDefaultPauseDelay(pause);
        const generated = generateFullTrackSegments(dur, interval, repeats, pause);
        setSegments(generated);
        setCurrentSegmentIndex(0);
        setCurrentRepeat(0);
      }
    },
    [mediaRef, duration, generateFullTrackSegments, defaultPauseDelay]
  );

  const applyIntervalAndRepeats = useCallback(
    (interval: number, repeats: number, pause = defaultPauseDelay) => {
      setIntervalSeconds(interval);
      setRepeatsPerSegment(repeats);
      setDefaultPauseDelay(pause);
      const dur = mediaRef.current?.duration || duration;
      if (dur > 0) {
        const generated = generateFullTrackSegments(dur, interval, repeats, pause);
        setSegments(generated);
        setCurrentSegmentIndex(0);
        setCurrentRepeat(0);
      }
    },
    [mediaRef, duration, generateFullTrackSegments, defaultPauseDelay]
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
