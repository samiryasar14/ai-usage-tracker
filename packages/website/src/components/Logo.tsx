interface LogoProps {
  size?: number;
}

export function Logo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--series-1)" />
          <stop offset="100%" stopColor="var(--series-2)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-gradient)" />
      <rect x="14" y="34" width="9" height="16" rx="2.5" fill="white" />
      <rect x="27.5" y="22" width="9" height="28" rx="2.5" fill="white" />
      <rect x="41" y="12" width="9" height="38" rx="2.5" fill="white" />
    </svg>
  );
}
