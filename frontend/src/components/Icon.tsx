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

export function CalendarIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" stroke={color} strokeWidth={1.4} />
      <path d="M3.5 8h13M7 3v3M13 3v3" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="7" cy="11.2" r="0.9" fill={color} />
      <circle cx="10" cy="11.2" r="0.9" fill={color} />
      <circle cx="13" cy="11.2" r="0.9" fill={color} />
    </svg>
  );
}

export function ClipboardChartIcon({ size = 32, color = 'var(--k-40)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="6" y="5" width="20" height="24" rx="2.5" fill="white" stroke={color} strokeWidth={1.6} />
      <rect x="12" y="3" width="8" height="5" rx="1.5" fill={color} />
      <path d="M11 20v4M16 16v8M21 12v12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function FlaskIcon({ size = 32, color = 'var(--k-40)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M13 4h6v8.5l6 12a2 2 0 01-1.8 2.9H8.8A2 2 0 017 24.5l6-12V4z"
        fill="white"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M11 3h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M10.5 19h11" stroke={color} strokeWidth={1.6} />
      <circle cx="16" cy="23" r="1.4" fill={color} />
      <circle cx="13.2" cy="21.5" r="1" fill={color} />
    </svg>
  );
}

export function QuestionBubbleIcon({ size = 32, color = 'var(--k-40)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M6 8.5A2.5 2.5 0 018.5 6h15A2.5 2.5 0 0126 8.5v11a2.5 2.5 0 01-2.5 2.5H14l-5 4v-4H8.5A2.5 2.5 0 016 19.5v-11z"
        fill="white"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M13 12.3c0-1.5 1.3-2.6 3-2.6s3 .9 3 2.3c0 1.1-.6 1.6-1.5 2.2-.8.5-1.2 1-1.2 1.8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <circle cx="16.3" cy="19.2" r="1.1" fill={color} />
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
