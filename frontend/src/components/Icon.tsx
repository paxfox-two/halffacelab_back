type IconProps = { size?: number; color?: string; className?: string };

const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 20 20', fill: 'none' });

export function ChevronLeftIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5l-5 5 5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 5l5 5-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronUpIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12l5-5 5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 8l5 5 5-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="9" r="5.5" stroke={color} strokeWidth={1.8} />
      <path d="M13.5 13.5L17 17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 7.5A1.5 1.5 0 014.5 6h1.8l.7-1.4A1 1 0 018 4h4a1 1 0 01.9.6L13.6 6h1.9A1.5 1.5 0 0117 7.5v7A1.5 1.5 0 0115.5 16h-11A1.5 1.5 0 013 14.5v-7z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx="10" cy="10.5" r="2.6" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = '#22A343', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10" cy="10" r="9" fill={color} />
      <path d="M6.2 10.3l2.4 2.4 5-5.2" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LightIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth={1.5} />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function FaceIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth={1.5} />
      <path d="M7.6 7.8v1.6M12.4 7.8v1.6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M7 12.5c0.8 1 2.2 1.6 3 1.6s2.2-.6 3-1.6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

export function DistanceIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  // A diagonal ruler/measuring-tape glyph, matching design/Icon.svg's "distance" icon.
  return (
    <svg {...base(size)} className={className}>
      <g transform="rotate(45 10 10)">
        <rect x="4" y="8" width="12" height="4" rx="1" stroke={color} strokeWidth={1.4} />
        <path d="M6 8v1.4M8.5 8v2M11 8v1.4M13.5 8v2" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function AsteriskIcon({ size = 16, color = '#0F62FE', className }: IconProps) {
  // A 4-point sparkle, matching design/Icon.svg's "as" (unchanged/no-direction) icon.
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 1c.3 2.6 1 4.3 2 5.3 1 1 2.7 1.7 5.3 2-2.6.3-4.3 1-5.3 2-1 1-1.7 2.7-2 5.3-.3-2.6-1-4.3-2-5.3-1-1-2.7-1.7-5.3-2 2.6-.3 4.3-1 5.3-2 1-1 1.7-2.7 2-5.3z"
        fill={color}
      />
    </svg>
  );
}
