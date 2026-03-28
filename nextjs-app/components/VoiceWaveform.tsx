'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface VoiceWaveformProps {
  analyserNode?: AnalyserNode | null;
  isActive?: boolean;
  barCount?: number;
}

export function VoiceWaveform({
  analyserNode,
  isActive = false,
  barCount = 20,
}: VoiceWaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0.1));
  const animFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyserNode || !isActive) {
      // Idle animation: gentle low pulse
      const idle = setInterval(() => {
        setBars(prev => prev.map(() => 0.05 + Math.random() * 0.15));
      }, 150);
      return () => clearInterval(idle);
    }

    // Real AnalyserNode path
    analyserNode.fftSize = 64;
    const bufLen = analyserNode.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufLen);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArrayRef.current! as Uint8Array<ArrayBuffer>);

      // Sample frequencies evenly across the buffer for barCount bars
      const step = Math.floor(bufLen / barCount);
      const newBars = Array.from({ length: barCount }, (_, i) => {
        const idx = Math.min(i * step, bufLen - 1);
        return Math.max(0.05, (dataArrayRef.current![idx] / 255) * 0.95);
      });
      setBars(newBars);
    };

    draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isActive, barCount]);

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-[#FF9933] to-[#FFD700]"
          animate={{ scaleY: height }}
          transition={{ duration: 0.05, ease: 'linear' }}
          style={{
            height: '40px',
            transformOrigin: 'bottom',
            opacity: 0.7 + height * 0.3,
          }}
        />
      ))}
    </div>
  );
}
