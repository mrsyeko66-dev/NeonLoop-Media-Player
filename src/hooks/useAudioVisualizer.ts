import { useEffect, useRef, useState, useCallback } from 'react';

export interface EqualizerSettings {
  bass: number;    // -12 to +12 dB
  mid: number;     // -12 to +12 dB
  treble: number;  // -12 to +12 dB
  boost: number;   // 1.0 to 2.0 (volume multiplier)
}

export function useAudioVisualizer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isVideo = false
) {
  const [eq, setEq] = useState<EqualizerSettings>({
    bass: 0,
    mid: 0,
    treble: 0,
    boost: 1.0,
  });

  const [audioReactiveLevel, setAudioReactiveLevel] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedElementRef = useRef<HTMLMediaElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const boostGainRef = useRef<GainNode | null>(null);

  const lastReactiveUpdateRef = useRef<number>(0);

  const initWebAudio = useCallback(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media) return;

    // If media element changed, reset previous source connection
    if (connectedElementRef.current && connectedElementRef.current !== media) {
      sourceRef.current = null;
      connectedElementRef.current = null;
    }

    if (sourceRef.current) return;

    // For video, avoid createMediaElementSource unless user explicitly tuned EQ
    // because createMediaElementSource causes buffer latency (~80ms A/V desync in Chromium)
    if (isVideo && eq.bass === 0 && eq.mid === 0 && eq.treble === 0 && eq.boost === 1.0) {
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(media);
      sourceRef.current = source;
      connectedElementRef.current = media;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Bass Filter (LowShelf @ 120Hz)
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 120;
      bass.gain.value = eq.bass;
      bassFilterRef.current = bass;

      // Mid Filter (Peaking @ 1000Hz)
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;
      mid.gain.value = eq.mid;
      midFilterRef.current = mid;

      // Treble Filter (HighShelf @ 4000Hz)
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 4000;
      treble.gain.value = eq.treble;
      trebleFilterRef.current = treble;

      // Preamp Boost Gain
      const boost = ctx.createGain();
      boost.gain.value = eq.boost;
      boostGainRef.current = boost;

      // Chain: Source -> Bass -> Mid -> Treble -> Boost -> Analyser -> Destination
      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(boost);
      boost.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.warn('AudioContext initialization skipped or already connected:', e);
    }
  }, [isVideo, videoRef, audioRef, eq.bass, eq.mid, eq.treble, eq.boost]);

  // Update EQ filters
  const updateEqualizer = useCallback(
    (partial: Partial<EqualizerSettings>) => {
      // Initialize web audio if user modifies EQ
      if (!sourceRef.current) {
        initWebAudio();
      }

      setEq((prev) => {
        const next = { ...prev, ...partial };
        if (bassFilterRef.current && partial.bass !== undefined) {
          bassFilterRef.current.gain.value = partial.bass;
        }
        if (midFilterRef.current && partial.mid !== undefined) {
          midFilterRef.current.gain.value = partial.mid;
        }
        if (trebleFilterRef.current && partial.treble !== undefined) {
          trebleFilterRef.current.gain.value = partial.treble;
        }
        if (boostGainRef.current && partial.boost !== undefined) {
          boostGainRef.current.gain.value = partial.boost;
        }
        return next;
      });
    },
    [initWebAudio]
  );

  // Resume AudioContext on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (!sourceRef.current && !isVideo) {
        initWebAudio();
      }
    };

    window.addEventListener('click', handleUserInteraction, { once: false });
    window.addEventListener('keydown', handleUserInteraction, { once: false });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initWebAudio, isVideo]);

  // High performance, throttled audio reactive loop (avoids 60fps React re-renders)
  useEffect(() => {
    let animId: number;
    const updateAudioLevel = (timestamp: number) => {
      const analyser = analyserRef.current;
      if (analyser && audioCtxRef.current?.state === 'running') {
        if (timestamp - lastReactiveUpdateRef.current > 100) {
          lastReactiveUpdateRef.current = timestamp;
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);

          let sum = 0;
          const count = Math.min(24, data.length);
          for (let i = 0; i < count; i++) {
            sum += data[i];
          }
          const level = sum / (count * 255);
          setAudioReactiveLevel(level);
        }
      }
      animId = requestAnimationFrame(updateAudioLevel);
    };

    animId = requestAnimationFrame(updateAudioLevel);
    return () => cancelAnimationFrame(animId);
  }, []);

  return {
    eq,
    updateEqualizer,
    audioReactiveLevel,
    analyserRef,
    initWebAudio,
  };
}
