import { useMemo } from 'react';

// Deterministic-ish pseudo random so ghosts don't re-scatter on every render.
function spread(i, salt) {
  const x = Math.sin((i + 1) * 12.9898 + salt) * 43758.5453;
  return x - Math.floor(x);
}

function Ghost({ i, frenzied }) {
  const left = spread(i, 1) * 96;
  const dur = (frenzied ? 5 : 16) + spread(i, 2) * (frenzied ? 5 : 14);
  const delay = -spread(i, 3) * dur;
  const scale = 0.5 + spread(i, 4) * 0.9;
  const drift = (spread(i, 5) * 2 - 1) * 90;

  return (
    <svg
      className="ghost"
      viewBox="0 0 64 76"
      aria-hidden="true"
      style={{
        left: `${left}vw`,
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`,
        '--scale': scale,
        '--drift': `${drift}px`,
      }}
    >
      <path
        d="M32 2C16 2 6 14 6 30v40c0 4 4 6 7 3l5-5 6 6c2 2 4 2 6 0l6-6 6 6c2 2 4 2 6 0l5-5c3 3 7 1 7-3V30C58 14 48 2 32 2z"
        fill="currentColor"
      />
      <ellipse cx="23" cy="30" rx="5" ry="7" fill="#05040a" />
      <ellipse cx="43" cy="30" rx="5" ry="7" fill="#05040a" />
      <ellipse cx="33" cy="48" rx="6" ry="8" fill="#05040a" opacity="0.85" />
    </svg>
  );
}

export default function Ghosts({ count = 7, frenzied = false }) {
  const ghosts = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <div className={`ghost-layer ${frenzied ? 'frenzied' : ''}`} aria-hidden="true">
      <div className="fog fog-a" />
      <div className="fog fog-b" />
      {ghosts.map((i) => (
        <Ghost key={i} i={i} frenzied={frenzied} />
      ))}
    </div>
  );
}
