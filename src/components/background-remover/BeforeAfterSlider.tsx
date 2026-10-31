'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Eye, ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalUrl: string;
  resultUrl: string;
  bgColor?: string;
  bgImageUrl?: string;
  isTransparent: boolean;
  aspectRatio?: number;
}

export function BeforeAfterSlider({
  originalUrl,
  resultUrl,
  bgColor,
  bgImageUrl,
  isTransparent,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOriginalOnly, setShowOriginalOnly] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  return (
    <div className="space-y-3 select-none">
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full max-h-[560px] min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg cursor-ew-resize bg-slate-900 flex items-center justify-center"
      >
        {/* Background / Transparent Layer (Right/Bottom Layer: Result) */}
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: !isTransparent && bgColor ? bgColor : undefined,
            backgroundImage:
              isTransparent
                ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)'
                : bgImageUrl
                ? `url(${bgImageUrl})`
                : undefined,
            backgroundSize: isTransparent ? '16px 16px' : 'cover',
            backgroundPosition: isTransparent ? '0 0, 0 8px, 8px -8px, -8px 0px' : 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="Hasil Background Removal"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* Foreground Layer (Left/Top Layer: Original) - Clipped by sliderPosition */}
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden transition-opacity"
          style={{
            clipPath: showOriginalOnly
              ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              : `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt="Gambar Asli"
            className="w-full h-full object-contain pointer-events-none bg-slate-950/20"
          />
        </div>

        {/* Divider Handle Line */}
        {!showOriginalOnly && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-10"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Center Circular Button */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ChevronsLeftRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-white z-20 pointer-events-none">
          Sebelum (Asli)
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-blue-600/80 backdrop-blur-md text-[11px] font-bold text-white z-20 pointer-events-none">
          Sesudah (Hasil AI)
        </div>
      </div>

      {/* Controls Below Slider */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Geser garis pembanding untuk melihat detail rambut &amp; tepian</span>
        </div>

        <button
          onMouseDown={() => setShowOriginalOnly(true)}
          onMouseUp={() => setShowOriginalOnly(false)}
          onTouchStart={() => setShowOriginalOnly(true)}
          onTouchEnd={() => setShowOriginalOnly(false)}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          Tahan untuk Lihat Asli
        </button>
      </div>
    </div>
  );
}
