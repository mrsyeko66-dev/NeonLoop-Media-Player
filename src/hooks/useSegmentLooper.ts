import { useState, useRef, useEffect, useCallback } from 'react';
import { MediaSegment, PlaybackMode } from '../types/player';

export function useSegmentLooper(mediaRef: React.RefObject<HTMLMediaElement | null>) {
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

  // Generate initial segments for default 25s duration
  useEffect(() => {
    if (segments.length === 0 && duration > 0) {
      const generated = generateFullTrackSegments(duration);
      setSegments(generated);
    }
  }, [duration, generateFullTrackSegments, segments.length]);

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

    if (mediaRef.current) {
      mediaRef.current.currentTime = target.startTime;
      if (andPlay) {
        mediaRef.current.play().catch(() => {});
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

  // Accurate loop checker using requestAnimationFrame
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const checkLoopBounds = () => {
      if (!media || media.paused || isTransitioningRef.current) {
        rafRef.current = requestAnimationFrame(checkLoopBounds);
        return;
      }

      const curr = media.currentTime;
      // Note: React state currentTime is updated smoothly via timeupdate event to prevent 60fps re-rendering lag

      if (playbackMode === 'step-loop' && activeSegment) {
        if (curr >= activeSegment.endTime - 0.05) {
          isTransitioningRef.current = true;

          const requiredRepeats = Math.max(1, activeSegment.repeatCount);
          const delay = activeSegment.pauseDelay ?? defaultPauseDelay;

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
              media.currentTime = activeSegment.startTime;
              isTransitioningRef.current = false;
            }
          } else {
            // Segment finished all repeats! Auto advance to next segment
            if (autoAdvance) {
              if (currentSegmentIndex + 1 < segments.length) {
                // Advance to next segment (e.g. 5-10s -> 10-15s -> 15-20s -> ... to end of file)
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
                  media.currentTime = nextSeg.startTime;
                  isTransitioningRef.current = false;
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
                  media.currentTime = firstSeg.startTime;
                  isTransitioningRef.current = false;
                }
              } else {
                // Reached the end of the entire file: stop cleanly
                media.pause();
                isTransitioningRef.current = false;
              }
            } else {
              // Stay on current segment but repeat from 0
              setCurrentRepeat(0);
              media.currentTime = activeSegment.startTime;
              isTransitioningRef.current = false;
            }
          }
        }
      } else if (playbackMode === 'single-loop' && activeSegment) {
        if (curr >= activeSegment.endTime - 0.05) {
          media.currentTime = activeSegment.startTime;
        }
      }

      rafRef.current = requestAnimationFrame(checkLoopBounds);
    };

    rafRef.current = requestAnimationFrame(checkLoopBounds);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeSegment, currentRepeat, currentSegmentIndex, segments, playbackMode, autoAdvance, loopAll, defaultPauseDelay, mediaRef]);

  // Media event listeners
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleDurationChange = () => {
      if (media.duration && !isNaN(media.duration) && media.duration > 0) {
        setDuration(media.duration);
        // Automatically partition across the full length of the newly loaded media
        if (autoGenerateToEnd) {
          const generated = generateFullTrackSegments(media.duration, intervalSeconds, repeatsPerSegment);
          setSegments(generated);
          setCurrentSegmentIndex(0);
          setCurrentRepeat(0);
        }
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('loadedmetadata', handleDurationChange);
    media.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('loadedmetadata', handleDurationChange);
      media.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [mediaRef, autoGenerateToEnd, generateFullTrackSegments, intervalSeconds, repeatsPerSegment]);

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

    if (playbackMode === 'step-loop') {
      const foundIdx = segments.findIndex((s) => clamped >= s.startTime && clamped <= s.endTime);
      if (foundIdx !== -1) {
        setCurrentSegmentIndex(foundIdx);
        setCurrentRepeat(0);
      }
    }
  }, [mediaRef, duration, playbackMode, segments]);

  // Playback Rate / Speed Control (with Pitch Preservation)
  const changePlaybackRate = useCallback((rate: number) => {
    const media = mediaRef.current;
    const clamped = Math.max(0.25, Math.min(rate, 3.0));
    setPlaybackRate(clamped);
    if (media) {
      if ('preservesPitch' in media) {
        // Natural pitch preservation when speeding up or slowing down
        (media as unknown as { preservesPitch: boolean }).preservesPitch = true;
      }
      media.playbackRate = clamped;
    }
  }, [mediaRef]);

  const speedUp = useCallback(() => {
    changePlaybackRate(Number((playbackRate + 0.25).toFixed(2)));
  }, [playbackRate, changePlaybackRate]);

  const slowDown = useCallback(() => {
    changePlaybackRate(Number((playbackRate - 0.25).toFixed(2)));
  }, [playbackRate, changePlaybackRate]);

  const changeVolume = useCallback((vol: number) => {
    const media = mediaRef.current;
    if (!media) return;
    const clamped = Math.max(0, Math.min(vol, 1));
    media.volume = clamped;
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      media.muted = false;
      setIsMuted(false);
    }
  }, [mediaRef, isMuted]);

  const toggleMute = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    setIsMuted(media.muted);
  }, [mediaRef]);

  // Re-partition the whole file with given interval and repeats
  const applyIntervalAndRepeats = useCallback(
    (newInterval: number, newRepeats: number, newPause = defaultPauseDelay) => {
      setIntervalSeconds(newInterval);
      setRepeatsPerSegment(newRepeats);
      setDefaultPauseDelay(newPause);
      const generated = generateFullTrackSegments(duration, newInterval, newRepeats, newPause);
      setSegments(generated);
      setCurrentSegmentIndex(0);
      setCurrentRepeat(0);
    },
    [duration, defaultPauseDelay, generateFullTrackSegments]
  );

  // Segment Management
  const addSegment = useCallback((
    startTime: number,
    endTime: number,
    repeatCount = repeatsPerSegment,
    pauseDelay = defaultPauseDelay,
    name?: string
  ) => {
    const start = Math.max(0, Math.min(startTime, duration));
    const end = Math.max(start + 0.5, Math.min(endTime, duration));
    const newSeg: MediaSegment = {
      id: 'seg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name || `Segment ${segments.length + 1} (${Math.round(start)}s - ${Math.round(end)}s)`,
      startTime: Number(start.toFixed(2)),
      endTime: Number(end.toFixed(2)),
      repeatCount,
      pauseDelay,
      color: ['#00f0ff', '#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b'][segments.length % 6],
    };
    const updated = [...segments, newSeg].sort((a, b) => a.startTime - b.startTime);
    setSegments(updated);
    return newSeg;
  }, [duration, segments, repeatsPerSegment, defaultPauseDelay]);

  const updateSegment = useCallback((id: string, partial: Partial<MediaSegment>) => {
    setSegments((prev) =>
      prev
        .map((s) => (s.id === id ? { ...s, ...partial } : s))
        .sort((a, b) => a.startTime - b.startTime)
    );
  }, []);

  const removeSegment = useCallback((id: string) => {
    setSegments((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (currentSegmentIndex >= filtered.length && filtered.length > 0) {
        setCurrentSegmentIndex(filtered.length - 1);
      }
      return filtered;
    });
  }, [currentSegmentIndex]);

  return {
    segments,
    setSegments,
    activeSegment,
    currentSegmentIndex,
    currentRepeat,
    playbackMode,
    setPlaybackMode,
    autoAdvance,
    setAutoAdvance,
    loopAll,
    setLoopAll,
    defaultPauseDelay,
    setDefaultPauseDelay,
    intervalSeconds,
    setIntervalSeconds,
    repeatsPerSegment,
    setRepeatsPerSegment,
    autoGenerateToEnd,
    setAutoGenerateToEnd,
    applyIntervalAndRepeats,
    autoSlice: applyIntervalAndRepeats,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    changePlaybackRate,
    speedUp,
    slowDown,
    volume,
    isMuted,
    togglePlay,
    seekTo,
    selectSegment,
    nextSegment,
    prevSegment,
    changeVolume,
    toggleMute,
    addSegment,
    updateSegment,
    removeSegment,
    setCurrentRepeat,
  };
}
