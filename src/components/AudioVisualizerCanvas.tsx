import React, { useRef, useEffect } from 'react';
import { NeonThemeSettings } from '../types/player';

interface AudioVisualizerCanvasProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  neonSettings: NeonThemeSettings;
  className?: string;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  analyserRef,
  isPlaying,
  neonSettings,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (!analyser || !isPlaying) {
        // Idle ambient subtle wave
        const time = Date.now() * 0.002;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.02 + time) * 4;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${neonSettings.hue}, 100%, 50%, 0.3)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Render glowing spectrum bars
      const barCount = 36;
      const barWidth = (width / barCount) - 3;
      const hue = neonSettings.hue;

      ctx.shadowBlur = 12 * neonSettings.intensity;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      for (let i = 0; i < barCount; i++) {
        // Sample frequency bins non-linearly to favor bass/mids
        const binIndex = Math.min(bufferLength - 1, Math.floor(Math.pow(i / barCount, 1.4) * bufferLength));
        const val = dataArray[binIndex] || 0;
        const barHeight = Math.max(3, (val / 255) * (height - 6));

        const x = i * (barWidth + 3);
        const y = height - barHeight;

        // Gradient for each bar
        const grad = ctx.createLinearGradient(0, height, 0, y);
        grad.addColorStop(0, `hsla(${hue}, 100%, 40%, 0.4)`);
        grad.addColorStop(0.7, `hsla(${hue}, 100%, 65%, 0.85)`);
        grad.addColorStop(1, `hsl(${hue}, 100%, 90%)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();

        // Top neon pip dot
        if (barHeight > 10) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y - 2, barWidth, 2);
        }
      }

      // Reset shadow for next frame
      ctx.shadowBlur = 0;
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [analyserRef, isPlaying, neonSettings]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className={`w-full h-full block ${className}`}
    />
  );
};
