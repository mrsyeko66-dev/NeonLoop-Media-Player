/**
 * Generates an in-memory melodic cyber audio track with distinct 5-second musical sections
 * so users can test the step looper immediately without needing to upload a file.
 */
import { audioBufferToWav } from './mediaExporter';

export async function generateDemoCyberAudio(): Promise<{ blob: Blob; url: string; fileName: string; duration: number }> {
  const sampleRate = 44100;
  const duration = 25; // 25 seconds
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Section 1: 0s - 5s (Bassline intro in C minor)
  // Section 2: 5s - 10s (Melody lead arpeggio in Eb major)
  // Section 3: 10s - 15s (Rhythmic synth pulse in G minor)
  // Section 4: 15s - 20s (Fast cyber sweep & chord progression)
  // Section 5: 20s - 25s (Outro resolution)

  const bpm = 120;
  const beatDuration = 60 / bpm; // 0.5s per beat

  // Kick & percussion rhythm across the track
  for (let t = 0; t < duration; t += beatDuration) {
    // Kick drum
    const kickOsc = offlineCtx.createOscillator();
    const kickGain = offlineCtx.createGain();
    kickOsc.frequency.setValueAtTime(150, t);
    kickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
    kickGain.gain.setValueAtTime(0.7, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    kickOsc.connect(kickGain);
    kickGain.connect(offlineCtx.destination);
    kickOsc.start(t);
    kickOsc.stop(t + 0.2);

    // Hi-hat on offbeats
    if (t % (beatDuration * 2) >= beatDuration) {
      const hatOsc = offlineCtx.createOscillator();
      const hatGain = offlineCtx.createGain();
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(8000, t);
      hatGain.gain.setValueAtTime(0.15, t);
      hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      hatOsc.connect(hatGain);
      hatGain.connect(offlineCtx.destination);
      hatOsc.start(t);
      hatOsc.stop(t + 0.05);
    }
  }

  // Melodic notes for each section
  const sections = [
    { start: 0, notes: [130.81, 155.56, 174.61, 196.00], wave: 'sawtooth' as OscillatorType, filterFreq: 600 },  // C3, Eb3, F3, G3
    { start: 5, notes: [311.13, 349.23, 392.00, 466.16], wave: 'sine' as OscillatorType, filterFreq: 1800 },     // Eb4, F4, G4, Bb4
    { start: 10, notes: [196.00, 233.08, 261.63, 293.66], wave: 'sawtooth' as OscillatorType, filterFreq: 2400 }, // G3, Bb3, C4, D4
    { start: 15, notes: [261.63, 329.63, 392.00, 523.25], wave: 'square' as OscillatorType, filterFreq: 1400 },   // C4, E4, G4, C5
    { start: 20, notes: [174.61, 196.00, 220.00, 261.63], wave: 'triangle' as OscillatorType, filterFreq: 900 },  // F3, G3, A3, C4
  ];

  sections.forEach((sec) => {
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(sec.filterFreq, sec.start);
    filter.connect(offlineCtx.destination);

    for (let i = 0; i < 10; i++) {
      const noteTime = sec.start + i * 0.5;
      if (noteTime >= sec.start + 5) break;

      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      const freq = sec.notes[i % sec.notes.length];
      osc.type = sec.wave;
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    }
  });

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);

  return {
    blob: wavBlob,
    url,
    fileName: 'Neon_Cyber_Demo_25s.wav',
    duration: 25,
  };
}
