interface LogoProps {
  size?: number;
}

export function Logo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="var(--series-1)" />
      <rect x="14" y="34" width="9" height="16" rx="2.5" fill="white" />
      <rect x="27.5" y="22" width="9" height="28" rx="2.5" fill="white" />
      <rect x="41" y="12" width="9" height="38" rx="2.5" fill="white" />
    </svg>
  );
}
