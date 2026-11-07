import React from "react";

// Original SVG icon set for the "5 Tips" video (soft gradients, glossy highlights).

type P = { w?: number; style?: React.CSSProperties };

/** open cardboard box; children are drawn INSIDE (between the back and the front layers) */
export const OpenBox: React.FC<P & { children?: React.ReactNode; flap?: number }> = ({ w = 420, children, style, flap = 1 }) => {
  const h = w * 0.9;
  return (
    <div style={{ position: "relative", width: w, height: h, ...style }}>
      <svg viewBox="0 0 300 270" width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="bxIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a3412" /><stop offset="1" stopColor="#8a5420" /></linearGradient>
          <linearGradient id="bxFlapB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9a05a" /><stop offset="1" stopColor="#b27a3a" /></linearGradient>
        </defs>
        {/* back flaps */}
        <path d={`M 40 110 L ${70 - 40 * flap} ${40 - 10 * flap} L 150 ${30 + 10 * (1 - flap)} L 150 92 Z`} fill="url(#bxFlapB)" stroke="#6b4013" strokeWidth="3" strokeLinejoin="round" />
        <path d={`M 260 110 L ${230 + 40 * flap} ${40 - 10 * flap} L 150 ${30 + 10 * (1 - flap)} L 150 92 Z`} fill="#c58c48" stroke="#6b4013" strokeWidth="3" strokeLinejoin="round" />
        {/* interior */}
        <path d="M 40 110 L 150 92 L 260 110 L 150 132 Z" fill="url(#bxIn)" />
      </svg>
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      <svg viewBox="0 0 300 270" width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="bxL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c98d45" /><stop offset="1" stopColor="#9c6428" /></linearGradient>
          <linearGradient id="bxR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2a85e" /><stop offset="1" stopColor="#c48440" /></linearGradient>
        </defs>
        <path d="M 40 110 L 150 132 L 150 255 L 48 222 Z" fill="url(#bxL)" stroke="#6b4013" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 260 110 L 150 132 L 150 255 L 252 222 Z" fill="url(#bxR)" stroke="#6b4013" strokeWidth="3" strokeLinejoin="round" />
        {/* front flaps folded out */}
        <path d={`M 40 110 L 150 132 L ${132 - 30 * flap} ${178 + 10 * flap} L ${18 - 12 * flap} ${150 + 8 * flap} Z`} fill="#d79c55" stroke="#6b4013" strokeWidth="3" strokeLinejoin="round" />
        <path d={`M 260 110 L 150 132 L ${168 + 30 * flap} ${178 + 10 * flap} L ${282 + 12 * flap} ${150 + 8 * flap} Z`} fill="#eab46c" stroke="#6b4013" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 60 130 L 140 146" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const TShirt: React.FC<P & { color?: string }> = ({ w = 160, color = "#f4f6fb", style }) => (
  <svg viewBox="0 0 120 110" width={w} height={w * 0.92} style={style}>
    <defs><linearGradient id={`ts${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor="#b9c3d8" /></linearGradient></defs>
    <path d="M 40 8 Q 60 22 80 8 L 112 26 L 100 50 L 88 44 L 88 104 L 32 104 L 32 44 L 20 50 L 8 26 Z" fill={`url(#ts${color})`} stroke="#3a4560" strokeWidth="4" strokeLinejoin="round" />
    <path d="M 40 8 Q 60 30 80 8" fill="none" stroke="#3a4560" strokeWidth="4" />
  </svg>
);

export const Hoodie: React.FC<P> = ({ w = 170, style }) => (
  <svg viewBox="0 0 130 120" width={w} height={w * 0.92} style={style}>
    <defs><linearGradient id="hd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fc8ff" /><stop offset="1" stopColor="#2a7fd6" /></linearGradient></defs>
    <path d="M 44 14 Q 65 -4 86 14 L 118 34 L 108 62 L 96 56 L 96 114 L 34 114 L 34 56 L 22 62 L 12 34 Z" fill="url(#hd)" stroke="#123a6b" strokeWidth="4" strokeLinejoin="round" />
    <path d="M 48 16 Q 65 40 82 16" fill="#1d5ea8" stroke="#123a6b" strokeWidth="4" />
    <rect x="46" y="76" width="38" height="20" rx="6" fill="#1d5ea8" stroke="#123a6b" strokeWidth="3" />
  </svg>
);

export const Bottle: React.FC<P> = ({ w = 90, style }) => (
  <svg viewBox="0 0 60 120" width={w} height={w * 2} style={style}>
    <rect x="22" y="4" width="16" height="16" rx="3" fill="#e9eef7" stroke="#2b3550" strokeWidth="3" />
    <path d="M 18 22 L 42 22 L 50 40 L 50 110 Q 50 116 44 116 L 16 116 Q 10 116 10 110 L 10 40 Z" fill="#7fd3ff" stroke="#2b3550" strokeWidth="3" />
    <rect x="14" y="60" width="32" height="30" rx="4" fill="#fff" opacity="0.85" />
  </svg>
);

export const Battery: React.FC<P> = ({ w = 80, style }) => (
  <svg viewBox="0 0 60 120" width={w} height={w * 2} style={style}>
    <rect x="22" y="2" width="16" height="10" rx="3" fill="#9aa3b5" stroke="#2b3550" strokeWidth="3" />
    <rect x="8" y="12" width="44" height="104" rx="8" fill="#3a3f4c" stroke="#2b3550" strokeWidth="3" />
    <rect x="8" y="12" width="44" height="40" rx="8" fill="#f2b632" stroke="#2b3550" strokeWidth="3" />
    <path d="M 34 60 L 22 84 L 32 84 L 26 104 L 42 76 L 32 76 L 38 60 Z" fill="#f2b632" />
  </svg>
);

/** red "no" circle drawn over its children */
export const Ban: React.FC<{ size?: number; children: React.ReactNode }> = ({ size = 170, children }) => (
  <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ transform: "scale(0.62)" }}>{children}</div>
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 10px rgba(255,60,60,0.8))" }}>
      <circle cx="50" cy="50" r="42" fill="none" stroke="#ff3b3b" strokeWidth="9" />
      <line x1="21" y1="79" x2="79" y2="21" stroke="#ff3b3b" strokeWidth="9" strokeLinecap="round" />
    </svg>
  </div>
);

export const NeonCheck: React.FC<{ size?: number; color?: string }> = ({ size = 150, color = "#4dff88" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ filter: `drop-shadow(0 0 14px ${color})` }}>
    <circle cx="50" cy="50" r="44" fill="rgba(10,40,20,0.55)" stroke={color} strokeWidth="7" />
    <path d="M 28 52 L 44 67 L 73 35" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Camera: React.FC<P & { flash?: number }> = ({ w = 300, flash = 0, style }) => (
  <svg viewBox="0 0 200 150" width={w} height={w * 0.75} style={{ overflow: "visible", ...style }}>
    <defs>
      <linearGradient id="cam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5d6476" /><stop offset="1" stopColor="#2a2e39" /></linearGradient>
      <radialGradient id="lens" cx="0.4" cy="0.35"><stop offset="0" stopColor="#8fd8ff" /><stop offset="0.5" stopColor="#1d5f9a" /><stop offset="1" stopColor="#081a2e" /></radialGradient>
    </defs>
    <rect x="62" y="14" width="56" height="22" rx="6" fill="#3a3f4c" />
    <rect x="10" y="30" width="180" height="110" rx="20" fill="url(#cam)" stroke="#14161c" strokeWidth="4" />
    <rect x="10" y="70" width="180" height="14" fill="#b88a55" opacity="0.85" />
    <circle cx="100" cy="85" r="40" fill="#14161c" />
    <circle cx="100" cy="85" r="31" fill="url(#lens)" />
    <circle cx="88" cy="73" r="8" fill="#fff" opacity="0.7" />
    <rect x="150" y="40" width="26" height="14" rx="4" fill="#ffe9a8" />
    {flash > 0 && (
      <g opacity={flash}>
        <circle cx="163" cy="47" r={30 + 40 * flash} fill="#fff6c8" opacity="0.6" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={163 + Math.cos(a) * 24} y1={47 + Math.sin(a) * 24} x2={163 + Math.cos(a) * (50 + 30 * flash)} y2={47 + Math.sin(a) * (50 + 30 * flash)} stroke="#fff3a0" strokeWidth="7" strokeLinecap="round" />;
        })}
      </g>
    )}
  </svg>
);

export const Sneaker: React.FC<P & { worn?: boolean }> = ({ w = 220, worn = false, style }) => (
  <svg viewBox="0 0 220 120" width={w} height={w * 0.55} style={style}>
    <defs>
      <linearGradient id={worn ? "snW" : "snN"} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={worn ? "#8fa8c0" : "#7ad9ff"} /><stop offset="1" stopColor={worn ? "#5b6f86" : "#2a8be0"} />
      </linearGradient>
    </defs>
    <path d="M 12 70 Q 14 40 40 30 L 70 22 Q 90 40 112 44 L 160 52 Q 200 58 206 82 L 206 92 L 12 92 Z" fill={`url(#${worn ? "snW" : "snN"})`} stroke="#13304f" strokeWidth="4" strokeLinejoin="round" />
    <path d="M 8 92 L 210 92 Q 212 108 196 110 L 20 110 Q 6 108 8 92 Z" fill={worn ? "#c9ced6" : "#ffffff"} stroke="#13304f" strokeWidth="4" />
    <path d="M 70 40 L 118 54 M 64 52 L 112 64" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
    {worn && <path d="M 130 70 l 14 6 M 150 66 l 10 10 M 40 80 l 16 -4" stroke="#3d4a5a" strokeWidth="4" strokeLinecap="round" />}
  </svg>
);

export const ShoeBox: React.FC<P & { lid?: number }> = ({ w = 360, lid = 0, style }) => (
  <svg viewBox="0 0 240 160" width={w} height={w * 0.67} style={{ overflow: "visible", ...style }}>
    <defs>
      <linearGradient id="sbF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff7a2f" /><stop offset="1" stopColor="#c7400e" /></linearGradient>
      <linearGradient id="sbT" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff9450" /><stop offset="1" stopColor="#ff6a20" /></linearGradient>
    </defs>
    <path d="M 20 70 L 190 70 L 226 46 L 226 120 L 190 150 L 20 150 Z" fill="url(#sbF)" stroke="#5a1a04" strokeWidth="4" strokeLinejoin="round" />
    <path d="M 190 70 L 226 46 L 226 120 L 190 150 Z" fill="#a8360c" stroke="#5a1a04" strokeWidth="4" strokeLinejoin="round" />
    <g transform={`translate(0 ${-lid * 70}) rotate(${-lid * 12} 120 60)`}>
      <path d="M 12 62 L 56 30 L 234 30 L 198 62 Z" fill="url(#sbT)" stroke="#5a1a04" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 12 62 L 198 62 L 198 80 L 12 80 Z" fill="#e85a18" stroke="#5a1a04" strokeWidth="4" />
      <path d="M 70 46 L 200 46" stroke="#ffd36b" strokeWidth="10" strokeLinecap="round" />
    </g>
  </svg>
);

export const Puffer: React.FC<P & { puff?: number }> = ({ w = 260, puff = 1, style }) => (
  <svg viewBox="0 0 200 200" width={w} height={w} style={style}>
    <defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#e0a43c" /></linearGradient></defs>
    <g transform={`translate(100 100) scale(${0.8 + 0.2 * puff}, ${0.85 + 0.15 * puff}) translate(-100 -100)`}>
      <path d="M 66 22 Q 100 8 134 22 L 176 50 Q 186 90 172 118 L 156 112 L 154 186 L 46 186 L 44 112 L 28 118 Q 14 90 24 50 Z" fill="url(#pf)" stroke="#6b4a10" strokeWidth="5" strokeLinejoin="round" />
      {[60, 92, 124, 156].map((y) => (
        <path key={y} d={`M 48 ${y} Q 100 ${y + 8 * puff} 152 ${y}`} fill="none" stroke="#b37a20" strokeWidth="4" />
      ))}
      <path d="M 100 30 L 100 186" stroke="#6b4a10" strokeWidth="5" />
      <path d="M 70 24 Q 100 50 130 24" fill="#f2c75e" stroke="#6b4a10" strokeWidth="5" />
    </g>
  </svg>
);

/** clear vacuum bag; children inside get squashed by `squeeze` (0..1) */
export const VacuumBag: React.FC<{ w?: number; squeeze: number; children: React.ReactNode }> = ({ w = 360, squeeze, children }) => (
  <div
    style={{
      position: "relative", width: w, height: w * (1 - 0.35 * squeeze), borderRadius: 34,
      background: "linear-gradient(160deg, rgba(200,235,255,0.28), rgba(120,170,220,0.12))", border: "4px solid rgba(220,245,255,0.75)",
      boxShadow: "inset 0 0 30px rgba(255,255,255,0.25), 0 0 30px rgba(120,200,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    <div style={{ transform: `scale(${1 - 0.15 * squeeze}, ${1 - 0.4 * squeeze})` }}>{children}</div>
    <div style={{ position: "absolute", top: 18, right: 22, width: 46, height: 46, borderRadius: 23, background: "#2a3346", border: "4px solid #cfe9ff" }} />
    <div style={{ position: "absolute", top: 10, left: 16, right: 16, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.5)" }} />
  </div>
);

export const RefreshRing: React.FC<{ size?: number; color: string; rot: number }> = ({ size = 520, color, rot }) => (
  <svg viewBox="0 0 200 200" width={size} height={size} style={{ transform: `rotate(${rot}deg)`, filter: `drop-shadow(0 0 16px ${color})` }}>
    <path d="M 100 20 A 80 80 0 1 1 30 62" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
    <path d="M 14 50 L 34 68 L 48 44 Z" fill={color} />
  </svg>
);

export const Sparkle: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = "#fff6b0" }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
    <path d="M 20 0 Q 23 17 40 20 Q 23 23 20 40 Q 17 23 0 20 Q 17 17 20 0 Z" fill={color} />
  </svg>
);

export const QuestionTile: React.FC<{ size?: number; color: string }> = ({ size = 150, color }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.22, background: "rgba(255,255,255,0.1)", border: `5px solid ${color}`,
      boxShadow: `0 0 24px ${color}`, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: size * 0.55, color,
    }}
  >
    ?
  </div>
);
