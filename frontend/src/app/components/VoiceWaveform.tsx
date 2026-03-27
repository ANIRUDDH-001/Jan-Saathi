import React, { useEffect, useRef } from 'react';

export function VoiceWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 40;
    const barWidth = canvas.width / bars;
    let animationId: number;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        const height = Math.abs(
          Math.sin(time * 0.003 + i * 0.3) * 
          (canvas.height / 2) * 
          (0.5 + Math.random() * 0.5)
        );

        const x = i * barWidth;
        const y = (canvas.height - height) / 2;

        ctx.fillStyle = '#FF9933';
        ctx.fillRect(x, y, barWidth - 2, height);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw(0);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="mx-auto"
    />
  );
}
