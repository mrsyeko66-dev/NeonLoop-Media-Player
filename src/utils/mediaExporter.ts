import { MediaSegment } from '../types/player';

/**
 * Converts an AudioBuffer into a WAV Blob (16-bit PCM)
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // SubChunk1Size (16 for PCM)
  setUint16(1);  // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2);              // BlockAlign
  setUint16(16);                         // BitsPerSample
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Automatically triggers an instant file download in the browser
 */
export function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Exports repeated audio segments into a clean WAV audio file
 */
export async function exportRepeatedAudio(
  fileOrBlob: Blob | File | string,
  segments: MediaSegment[],
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; duration: number }> {
  if (segments.length === 0) {
    throw new Error('No segments defined for export.');
  }

  onProgress?.(5, 'Loading media data...');

  let arrayBuffer: ArrayBuffer;
  let baseName = 'repeated_audio';

  if (typeof fileOrBlob === 'string') {
    const res = await fetch(fileOrBlob);
    arrayBuffer = await res.arrayBuffer();
    baseName = fileOrBlob.split('/').pop()?.split('?')[0]?.replace(/\.[^/.]+$/, '') || 'stream_audio';
  } else {
    arrayBuffer = await fileOrBlob.arrayBuffer();
    if ('name' in fileOrBlob) {
      baseName = (fileOrBlob as File).name.replace(/\.[^/.]+$/, '');
    }
  }

  onProgress?.(15, 'Decoding audio track...');
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();

  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch (err) {
    // If standard decodeAudioData fails (e.g. video container like MP4/MKV), extract audio via HTML media element
    onProgress?.(20, 'Extracting audio from container...');
    decodedBuffer = await extractAudioFromMediaElement(fileOrBlob, onProgress);
  } finally {
    await audioCtx.close().catch(() => {});
  }

  const sampleRate = decodedBuffer.sampleRate;
  const numberOfChannels = decodedBuffer.numberOfChannels;
  const originalDuration = decodedBuffer.duration;

  // Calculate total duration
  let totalDuration = 0;
  for (const seg of segments) {
    const start = Math.max(0, Math.min(seg.startTime, originalDuration));
    const end = Math.max(start, Math.min(seg.endTime, originalDuration));
    const segDur = end - start;
    const repeats = Math.max(1, seg.repeatCount);
    const delay = Math.max(0, seg.pauseDelay || 0);
    totalDuration += (segDur + delay) * repeats;
  }

  if (totalDuration <= 0) {
    throw new Error('Total looped duration is 0 seconds.');
  }

  onProgress?.(35, `Synthesizing looped sequence (${Math.round(totalDuration)}s)...`);
  const offlineCtx = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  let currentTimelinePos = 0;
  const totalSteps = segments.reduce((acc, s) => acc + s.repeatCount, 0);
  let currentStep = 0;

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const start = Math.max(0, Math.min(seg.startTime, originalDuration));
    const end = Math.max(start, Math.min(seg.endTime, originalDuration));
    const segDur = end - start;
    const repeats = Math.max(1, seg.repeatCount);
    const delay = Math.max(0, seg.pauseDelay || 0);

    for (let r = 0; r < repeats; r++) {
      currentStep++;
      const progressPercent = Math.min(85, 35 + Math.floor((currentStep / totalSteps) * 50));
      onProgress?.(progressPercent, `Stitching segment ${sIdx + 1}/${segments.length} (repeat ${r + 1}/${repeats})...`);

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start(currentTimelinePos, start, segDur);

      currentTimelinePos += segDur + delay;
    }
  }

  onProgress?.(88, 'Rendering master audio output...');
  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(95, 'Encoding WAV container...');
  const wavBlob = audioBufferToWav(renderedBuffer);
  const outFileName = `${baseName}_repeated_${Date.now()}.wav`;

  onProgress?.(100, 'Export complete!');
  return {
    blob: wavBlob,
    fileName: outFileName,
    duration: totalDuration,
  };
}

/**
 * Fallback audio extractor for video files that fail decodeAudioData
 */
async function extractAudioFromMediaElement(
  fileOrBlob: Blob | File | string,
  onProgress?: (percent: number, status: string) => void
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = false;
    video.crossOrigin = 'anonymous';

    const url = typeof fileOrBlob === 'string' ? fileOrBlob : URL.createObjectURL(fileOrBlob);
    video.src = url;

    video.onloadedmetadata = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const dest = ctx.createMediaStreamDestination();
        const source = ctx.createMediaElementSource(video);
        source.connect(dest);

        const recorder = new MediaRecorder(dest.stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          const recordedBlob = new Blob(chunks, { type: 'audio/webm' });
          const ab = await recordedBlob.arrayBuffer();
          const decoded = await ctx.decodeAudioData(ab);
          await ctx.close();
          if (typeof fileOrBlob !== 'string') URL.revokeObjectURL(url);
          resolve(decoded);
        };

        recorder.start();
        video.playbackRate = 4.0; // Fast-forward audio recording
        await video.play();

        video.ontimeupdate = () => {
          const pct = Math.min(30, Math.floor((video.currentTime / video.duration) * 30));
          onProgress?.(pct, `Fast decoding audio stream (${Math.round(video.currentTime)}s)...`);
        };

        video.onended = () => {
          recorder.stop();
        };
      } catch (err) {
        if (typeof fileOrBlob !== 'string') URL.revokeObjectURL(url);
        reject(new Error('Audio decoding failed for this video format.'));
      }
    };

    video.onerror = () => {
      if (typeof fileOrBlob !== 'string') URL.revokeObjectURL(url);
      reject(new Error('Could not load media to extract audio.'));
    };
  });
}

/**
 * Exports video with repeated segments by capturing frames and audio into a WebM video file
 * using an offscreen video element for 100% stability, accurate cuts, and zero player lag!
 */
export async function exportRepeatedVideo(
  mediaSrc: string,
  segments: MediaSegment[],
  onProgress?: (percent: number, status: string) => void,
  abortSignal?: AbortSignal
): Promise<{ blob: Blob; fileName: string }> {
  return new Promise(async (resolve, reject) => {
    let animId = 0;
    let offscreenVideo: HTMLVideoElement | null = null;

    const cleanup = () => {
      if (animId) cancelAnimationFrame(animId);
      if (offscreenVideo) {
        offscreenVideo.pause();
        offscreenVideo.src = '';
        offscreenVideo.load();
        offscreenVideo.remove();
        offscreenVideo = null;
      }
    };

    try {
      if (segments.length === 0) {
        throw new Error('No segments defined for export.');
      }

      onProgress?.(5, 'Initializing dedicated render pipeline...');

      // Create isolated offscreen video element
      offscreenVideo = document.createElement('video');
      offscreenVideo.crossOrigin = 'anonymous';
      offscreenVideo.playsInline = true;
      offscreenVideo.muted = false;
      offscreenVideo.src = mediaSrc;

      // Wait for offscreen video metadata
      await new Promise<void>((res, rej) => {
        if (!offscreenVideo) return rej(new Error('Offscreen video null'));
        offscreenVideo.onloadedmetadata = () => res();
        offscreenVideo.onerror = () => rej(new Error('Failed to load video source for export.'));
      });

      const videoWidth = offscreenVideo.videoWidth || 1280;
      const videoHeight = offscreenVideo.videoHeight || 720;

      // Canvas for high precision video rendering
      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not get 2D render context.');

      // Stream capture
      const canvasStream = canvas.captureStream(30);

      // Capture audio directly from offscreen element stream
      let audioStream: MediaStream | null = null;
      try {
        const streamGetter = (offscreenVideo as unknown as { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream });
        if (typeof streamGetter.captureStream === 'function') {
          audioStream = streamGetter.captureStream();
        } else if (typeof streamGetter.mozCaptureStream === 'function') {
          audioStream = streamGetter.mozCaptureStream();
        }
      } catch {
        // Fallback: Web Audio stream destination
        try {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const aCtx = new AudioCtx();
          const src = aCtx.createMediaElementSource(offscreenVideo);
          const dest = aCtx.createMediaStreamDestination();
          src.connect(dest);
          audioStream = dest.stream;
        } catch {
          console.warn('Audio stream extraction fallback silent');
        }
      }

      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      // Check supported codecs
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          cleanup();
          reject(new Error('Export cancelled by user.'));
        });
      }

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        const fileName = `repeated_video_${Date.now()}.webm`;
        onProgress?.(100, 'Video export complete!');
        resolve({ blob, fileName });
      };

      recorder.start(100);

      // Frame drawing loop
      const renderLoop = () => {
        if (offscreenVideo && !offscreenVideo.paused && !offscreenVideo.ended) {
          ctx.drawImage(offscreenVideo, 0, 0, canvas.width, canvas.height);
        }
        animId = requestAnimationFrame(renderLoop);
      };
      renderLoop();

      const totalSegmentsCount = segments.length;
      const totalRepeatsCount = segments.reduce((sum, s) => sum + s.repeatCount, 0);
      let executedRepeats = 0;

      // Play through each segment with frame-accurate timing
      for (let sIdx = 0; sIdx < segments.length; sIdx++) {
        const seg = segments[sIdx];
        const repeats = Math.max(1, seg.repeatCount);

        for (let r = 0; r < repeats; r++) {
          if (abortSignal?.aborted) return;
          executedRepeats++;
          const percent = Math.min(95, 10 + Math.floor((executedRepeats / totalRepeatsCount) * 85));
          onProgress?.(percent, `Recording Part ${sIdx + 1}/${totalSegmentsCount} [Loop ${r + 1}/${repeats}]...`);

          offscreenVideo.currentTime = seg.startTime;

          // Wait for seeked
          await new Promise<void>((res) => {
            const onSeeked = () => {
              offscreenVideo?.removeEventListener('seeked', onSeeked);
              res();
            };
            offscreenVideo?.addEventListener('seeked', onSeeked);
          });

          await offscreenVideo.play().catch(() => {});

          // High precision frame-by-frame loop check
          await new Promise<void>((res) => {
            let checkRaf = 0;
            const checkTime = () => {
              if (!offscreenVideo) {
                cancelAnimationFrame(checkRaf);
                res();
                return;
              }
              if (offscreenVideo.currentTime >= seg.endTime || offscreenVideo.ended) {
                cancelAnimationFrame(checkRaf);
                offscreenVideo.pause();
                res();
              } else {
                checkRaf = requestAnimationFrame(checkTime);
              }
            };
            checkRaf = requestAnimationFrame(checkTime);
          });

          // Optional pause delay
          if (seg.pauseDelay > 0) {
            await new Promise((res) => setTimeout(res, seg.pauseDelay * 1000));
          }
        }
      }

      onProgress?.(98, 'Finalizing video stream...');
      recorder.stop();
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}
