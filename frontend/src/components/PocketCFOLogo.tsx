interface PocketCFOLogoProps {
  size?: number;
  className?: string;
  /** @deprecated no longer needed — uses currentColor */
  isDark?: boolean;
}

export function PocketCFOLogo({ size = 120, className = "" }: PocketCFOLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PocketCFO logo"
    >
      {/* Outer Circle Boundary */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2.5" />

      {/* The Calculator */}
      <g>
        <rect x="35" y="25" width="22" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
        {/* Calculator Screen */}
        <rect x="39" y="29" width="14" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
        {/* Keypad dots */}
        <circle cx="41" cy="40" r="1" fill="currentColor" />
        <circle cx="46" cy="40" r="1" fill="currentColor" />
        <circle cx="51" cy="40" r="1" fill="currentColor" />
        <circle cx="41" cy="44" r="1" fill="currentColor" />
        <circle cx="46" cy="44" r="1" fill="currentColor" />
        <circle cx="51" cy="44" r="1" fill="currentColor" />
        <circle cx="41" cy="48" r="1" fill="currentColor" />
        <circle cx="46" cy="48" r="1" fill="currentColor" />
        <circle cx="51" cy="48" r="1" fill="currentColor" />
      </g>

      {/* The Pen */}
      <g>
        <path d="M62 32L68 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M64 35H69" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* The Pocket (Foreground) */}
      <path
        d="M28 45H72V62C72 70 65 77 50 77C35 77 28 70 28 62V45Z"
        fill="var(--pocket-bg, transparent)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Pocket Stitching */}
      <path
        d="M33 49V62C33 68 40 73 50 73C60 73 67 68 67 62V49"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.4"
      />
    </svg>
  );
}
