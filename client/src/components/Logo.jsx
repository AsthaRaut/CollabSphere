export default function Logo({ size = 34, text = true }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffb347" />
            <stop offset="1" stopColor="#ff4d7e" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="var(--logo-bg)" />
        <circle cx="32" cy="32" r="15" fill="none" stroke="url(#lg)" strokeWidth="5" />
        <circle cx="46" cy="18" r="6" fill="url(#lg)" />
        <circle cx="18" cy="46" r="4" fill="url(#lg)" />
      </svg>
      {text && (
        <span className="logo-text">
          Collab<b>Sphere</b>
        </span>
      )}
    </span>
  );
}
