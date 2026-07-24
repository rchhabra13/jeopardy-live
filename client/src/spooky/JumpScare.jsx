// Fullscreen scare overlay. The YouTube sting player lives in SpookyContext and
// is revealed behind this; the face below is drawn locally so a blocked/slow
// YouTube embed still produces a scare.
export default function JumpScare({ scare }) {
  if (!scare) return null;
  return (
    <div className="jumpscare" role="presentation">
      <svg className="scare-face" viewBox="0 0 200 240" aria-hidden="true">
        <ellipse cx="100" cy="120" rx="86" ry="112" fill="#d9d4c5" />
        <ellipse cx="100" cy="118" rx="80" ry="106" fill="#efe9d8" />
        <g fill="#0a0208">
          <ellipse cx="66" cy="100" rx="21" ry="27" />
          <ellipse cx="134" cy="100" rx="21" ry="27" />
        </g>
        <g fill="#b00610">
          <circle cx="70" cy="104" r="6" />
          <circle cx="130" cy="104" r="6" />
        </g>
        <path d="M100 130l-14 30h28z" fill="#0a0208" />
        <path
          d="M58 190c8-12 18-12 26 0 8-12 18-12 26 0 8-12 18-12 26 0v22H58z"
          fill="#0a0208"
        />
        <g stroke="#efe9d8" strokeWidth="3">
          <line x1="72" y1="190" x2="72" y2="212" />
          <line x1="86" y1="190" x2="86" y2="212" />
          <line x1="100" y1="190" x2="100" y2="212" />
          <line x1="114" y1="190" x2="114" y2="212" />
          <line x1="128" y1="190" x2="128" y2="212" />
        </g>
      </svg>
    </div>
  );
}
