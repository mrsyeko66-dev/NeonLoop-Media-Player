import { MediaSegment } from '../types/player';

/**
 * Converts an AudioBuffer into a WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
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
 * Exports repeated audio segments using OfflineAudioContext into a clean WAV file
 */
export async function exportRepeatedAudio(
  fileOrBlob: Blob | File,
  segments: MediaSegment[],
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; duration: number }> {
  if (segments.length === 0) {
    throw new Error('No segments defined for export.');
  }

  onProgress?.(5, 'Reading media data...');
  const arrayBuffer = await fileOrBlob.arrayBuffer();

  onProgress?.(15, 'Decoding audio track...');
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioCtx.close();
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
    // each repeat has segment duration, plus delay after it
    totalDuration += (segDur + delay) * repeats;
  }

  if (totalDuration <= 0) {
    throw new Error('Total looped duration is 0 seconds.');
  }

  onProgress?.(30, `Synthesizing looped sequence (${Math.round(totalDuration)}s)...`);
  const offlineCtx = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  let currentTimelinePos = 0;
  let totalSteps = segments.reduce((acc, s) => acc + s.repeatCount, 0);
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
      const progressPercent = Math.min(80, 30 + Math.floor((currentStep / totalSteps) * 50));
      onProgress?.(progressPercent, `Assembling segment ${sIdx + 1}/${segments.length} (repeat ${r + 1}/${repeats})...`);

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start(currentTimelinePos, start, segDur);

      currentTimelinePos += segDur + delay;
    }
  }

  onProgress?.(85, 'Rendering master audio output...');
  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(95, 'Encoding WAV container...');
  const wavBlob = audioBufferToWav(renderedBuffer);

  const baseName = (fileOrBlob as File).name
    ? (fileOrBlob as File).name.replace(/\.[^/.]+$/, '')
    : 'looped_media';
  const outFileName = `${baseName}_repeated_${Date.now()}.wav`;

  onProgress?.(100, 'Export complete!');
  return {
    blob: wavBlob,
    fileName: outFileName,
    duration: totalDuration,
  };
}

/**
 * Exports video with repeated segments by capturing frames and audio into a WebM video file
 */
export async function exportRepeatedVideo(
  videoElement: HTMLVideoElement,
  segments: MediaSegment[],
  onProgress?: (percent: number, status: string) => void,
  abortSignal?: AbortSignal
): Promise<{ blob: Blob; fileName: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      if (segments.length === 0) {
        throw new Error('No segments defined for export.');
      }

      onProgress?.(5, 'Preparing video export canvas...');
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 1280;
      canvas.height = videoElement.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      // Create stream from canvas + video audio
      const canvasStream = canvas.captureStream(30);

      // Try capturing audio from video
      let audioStream: MediaStream | null = null;
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(videoElement);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        audioStream = dest.stream;
      } catch {
        // audio element already connected or silent
      }

      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const cleanup = () => {
        cancelAnimationFrame(rafId);
        videoElement.pause();
      };

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          recorder.stop();
          cleanup();
          reject(new Error('Export aborted by user'));
        });
      }

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        const fileName = `repeated_video_${Date.now()}.webm`;
        onProgress?.(100, 'Video export ready!');
        resolve({ blob, fileName });
      };

      recorder.start(100);

      // Draw loop
      let rafId = 0;
      const drawFrame = () => {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        rafId = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      const totalSegmentsCount = segments.length;
      let totalRepeatsCount = segments.reduce((sum, s) => sum + s.repeatCount, 0);
      let executedRepeats = 0;

      // Play through each segment step by step
      for (let sIdx = 0; sIdx < segments.length; sIdx++) {
        const seg = segments[sIdx];
        const repeats = Math.max(1, seg.repeatCount);

        for (let r = 0; r < repeats; r++) {
          if (abortSignal?.aborted) return;
          executedRepeats++;
          const percent = Math.min(95, 10 + Math.floor((executedRepeats / totalRepeatsCount) * 85));
          onProgress?.(percent, `Recording segment ${sIdx + 1}/${totalSegmentsCount} [repeat ${r + 1}/${repeats}]...`);

          videoElement.currentTime = seg.startTime;
          await new Promise<void>((res) => {
            const onSeeked = () => {
              videoElement.removeEventListener('seeked', onSeeked);
              res();
            };
            videoElement.addEventListener('seeked', onSeeked);
          });

          await videoElement.play().catch(() => {});

          // Wait until segment endTime is reached
          await new Promise<void>((res) => {
            const checkTime = () => {
              if (videoElement.currentTime >= seg.endTime || videoElement.ended) {
                videoElement.removeEventListener('timeupdate', checkTime);
                videoElement.pause();
                res();
              }
            };
            videoElement.addEventListener('timeupdate', checkTime);
          });

          // Pause delay if any
          if (seg.pauseDelay > 0) {
            await new Promise((res) => setTimeout(res, seg.pauseDelay * 1000));
          }
        }
      }

      // Done
      onProgress?.(98, 'Finalizing video file...');
      recorder.stop();
    } catch (err) {
      reject(err);
    }
  });
}
