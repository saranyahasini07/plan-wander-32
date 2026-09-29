import React, { useState } from 'react';
import heroCoastalImg from '../assets/images/hero_wander_coastal_1790648641548.jpg';
import indiaHeritageImg from '../assets/images/dest_india_heritage_1790648659654.jpg';
import himalayaValleyImg from '../assets/images/dest_himalaya_valley_1790648671616.jpg';
import globalIslandImg from '../assets/images/dest_global_island_1790648683150.jpg';
import stayLuxuryResortImg from '../assets/images/stay_luxury_resort_1790648696082.jpg';

export const GENERATED_IMAGES = {
  coastal: heroCoastalImg,
  heritage: indiaHeritageImg,
  himalaya: himalayaValleyImg,
  island: globalIslandImg,
  resort: stayLuxuryResortImg,
  urban: indiaHeritageImg,
};

interface VisualMediaProps {
  theme: 'coastal' | 'heritage' | 'himalaya' | 'island' | 'resort' | 'urban';
  seed?: string;
  alt: string;
  className?: string;
  overlayGradient?: boolean;
  children?: React.ReactNode;
}

function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const IMAGE_POOL = [
  heroCoastalImg,
  indiaHeritageImg,
  himalayaValleyImg,
  globalIslandImg,
  stayLuxuryResortImg,
];

const OBJECT_POSITIONS = [
  'object-center',
  'object-left-top',
  'object-right-bottom',
  'object-top',
  'object-bottom',
];

const TINT_FILTERS = [
  'brightness-[0.98] contrast-[1.03]',
  'brightness-[0.96] contrast-[1.06] saturate-[1.08]',
  'brightness-[1.01] contrast-[1.02] saturate-[0.95]',
  'brightness-[0.94] contrast-[1.05] sepia-[0.08]',
  'brightness-[0.97] contrast-[1.04] hue-rotate-[-4deg]',
];

export const VisualMedia: React.FC<VisualMediaProps> = ({
  theme,
  seed = 'default',
  alt,
  className = '',
  overlayGradient = false,
  children,
}) => {
  const [imgError, setImgError] = useState(false);
  const hash = hashSeed(seed + theme);

  // Pick primary image by theme or deterministically vary for rich variety across cards
  let src = GENERATED_IMAGES[theme] || heroCoastalImg;
  if (seed !== 'hero' && hash % 3 === 1) {
    src = IMAGE_POOL[hash % IMAGE_POOL.length];
  }

  const posClass = seed === 'hero' ? 'object-center' : OBJECT_POSITIONS[hash % OBJECT_POSITIONS.length];
  const filterClass = seed === 'hero' ? '' : TINT_FILTERS[hash % TINT_FILTERS.length];

  const fallbackGradients: Record<string, string> = {
    coastal: 'from-teal-900 via-cyan-800 to-slate-900',
    heritage: 'from-amber-900 via-stone-800 to-slate-900',
    himalaya: 'from-slate-800 via-teal-950 to-slate-900',
    island: 'from-emerald-900 via-teal-800 to-slate-900',
    resort: 'from-stone-800 via-amber-950 to-slate-900',
    urban: 'from-slate-900 via-indigo-950 to-slate-800',
  };

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {!imgError ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${posClass} ${filterClass}`}
        />
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${
            fallbackGradients[theme] || fallbackGradients.coastal
          } p-6 text-center text-white/90`}
        >
          <svg
            className="mb-2 h-8 w-8 text-white/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
          <span className="font-display text-sm font-medium tracking-wide">{alt}</span>
        </div>
      )}

      {/* Subtle architectural light vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      {overlayGradient && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      )}

      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
};
