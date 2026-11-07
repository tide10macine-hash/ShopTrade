import React from "react";
import { C } from "../theme";

// Original SVG icons for the "Don't ship these together" video.
const S = "#1b2333";

export const Smartwatch: React.FC<{ w?: number }> = ({ w = 220 }) => (
  <svg viewBox="0 0 120 180" width={w} height={w * 1.5}>
    <rect x="34" y="0" width="52" height="40" rx="10" fill="#d9dde6" stroke={S} strokeWidth="4" />
    <rect x="34" y="140" width="52" height="40" rx="10" fill="#d9dde6" stroke={S} strokeWidth="4" />
    <rect x="16" y="34" width="88" height="112" rx="26" fill="#e9edf3" stroke={S} strokeWidth="5" />
    <rect x="26" y="44" width="68" height="92" rx="18" fill="#10141c" />
    <circle cx="60" cy="90" r="26" fill="none" stroke="#6fd8ff" strokeWidth="5" />
    <path d="M 60 76 L 60 90 L 70 98" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
    <rect x="104" y="70" width="8" height="22" rx="3" fill="#b8bfcc" stroke={S} strokeWidth="3" />
  </svg>
);

export const Earbuds: React.FC<{ w?: number }> = ({ w = 200 }) => (
  <svg viewBox="0 0 160 120" width={w} height={w * 0.75}>
    <rect x="20" y="40" width="120" height="74" rx="30" fill="#f4f6fa" stroke={S} strokeWidth="5" />
    <path d="M 20 70 L 140 70" stroke={S} strokeWidth="4" />
    <circle cx="80" cy="92" r="4" fill="#4dd06a" />
    {[46, 114].map((x, i) => (
      <g key={x} transform={`rotate(${i ? 12 : -12} ${x} 30)`}>
        <ellipse cx={x} cy="26" rx="16" ry="18" fill="#fff" stroke={S} strokeWidth="4" />
        <rect x={x - 6} y="30" width="12" height="34" rx="6" fill="#fff" stroke={S} strokeWidth="4" />
      </g>
    ))}
  </svg>
);

export const Perfume: React.FC<{ w?: number; color?: string; cap?: string }> = ({ w = 120, color = "#7ad9ff", cap = "#1b2333" }) => (
  <svg viewBox="0 0 80 130" width={w} height={w * 1.62}>
    <rect x="28" y="2" width="24" height="26" rx="4" fill={cap} stroke={S} strokeWidth="3" />
    <rect x="34" y="26" width="12" height="12" fill="#c9ced8" stroke={S} strokeWidth="3" />
    <rect x="6" y="38" width="68" height="88" rx="12" fill={color} stroke={S} strokeWidth="4" opacity="0.95" />
    <rect x="14" y="46" width="12" height="70" rx="6" fill="#fff" opacity="0.45" />
    <rect x="22" y="70" width="36" height="22" rx="3" fill="#fff" opacity="0.9" />
  </svg>
);

export const Drop: React.FC<{ w?: number }> = ({ w = 90 }) => (
  <svg viewBox="0 0 60 80" width={w} height={w * 1.33}>
    <path d="M 30 2 Q 56 40 54 54 Q 52 78 30 78 Q 8 78 6 54 Q 4 40 30 2 Z" fill="#59c3f0" stroke="#1d6c9a" strokeWidth="4" />
    <path d="M 18 52 Q 18 64 28 68" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

export const PowerBank: React.FC<{ w?: number }> = ({ w = 220 }) => (
  <svg viewBox="0 0 140 220" width={w} height={w * 1.57}>
    <rect x="10" y="10" width="120" height="200" rx="22" fill="#2d3443" stroke={S} strokeWidth="5" />
    <rect x="22" y="22" width="96" height="176" rx="14" fill="#3c4558" />
    <path d="M 76 52 L 46 112 L 70 112 L 60 168 L 98 100 L 74 100 L 86 52 Z" fill="#ffd21f" stroke={S} strokeWidth="4" strokeLinejoin="round" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={36 + i * 18} y="182" width="12" height="8" rx="2" fill={i < 3 ? "#4dd06a" : "#556"} />)}
    <rect x="56" y="2" width="28" height="12" rx="4" fill="#9aa3b5" stroke={S} strokeWidth="3" />
  </svg>
);

export const Warning: React.FC<{ w?: number }> = ({ w = 220 }) => (
  <svg viewBox="0 0 120 106" width={w} height={w * 0.88}>
    <path d="M 60 6 L 114 100 L 6 100 Z" fill={C.red} stroke={C.black} strokeWidth="6" strokeLinejoin="round" />
    <path d="M 60 26 L 98 92 L 22 92 Z" fill="#fff" />
    <rect x="55" y="44" width="10" height="28" rx="4" fill={C.black} />
    <circle cx="60" cy="82" r="6" fill={C.black} />
  </svg>
);

export const Officer: React.FC<{ w?: number }> = ({ w = 240 }) => (
  <svg viewBox="0 0 160 170" width={w} height={w * 1.06}>
    <path d="M 20 170 Q 20 112 80 106 Q 140 112 140 170 Z" fill="#23466e" stroke={S} strokeWidth="5" />
    <path d="M 68 110 L 80 140 L 92 110 Z" fill="#fff" />
    <path d="M 78 116 L 82 116 L 84 150 L 80 156 L 76 150 Z" fill="#e8b21c" />
    <circle cx="80" cy="70" r="36" fill="#f3c9a6" stroke={S} strokeWidth="5" />
    <path d="M 38 46 Q 80 6 122 46 L 118 54 L 42 54 Z" fill="#1d3b5e" stroke={S} strokeWidth="5" strokeLinejoin="round" />
    <rect x="40" y="50" width="80" height="10" rx="4" fill="#12263d" />
    <circle cx="80" cy="34" r="7" fill="#e8b21c" stroke={S} strokeWidth="3" />
    <circle cx="68" cy="74" r="4" fill={S} /><circle cx="92" cy="74" r="4" fill={S} />
    <path d="M 70 90 Q 80 96 90 90" stroke={S} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

export const StopSign: React.FC<{ w?: number }> = ({ w = 220 }) => {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    return `${60 + 56 * Math.cos(a)},${60 + 56 * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 120 120" width={w} height={w}>
      <polygon points={pts} fill={C.red} stroke="#fff" strokeWidth="6" />
      <polygon points={pts} fill="none" stroke={C.black} strokeWidth="2" transform="translate(60 60) scale(1.06) translate(-60 -60)" />
      <text x="60" y="72" textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="30" fill="#fff">STOP</text>
    </svg>
  );
};
