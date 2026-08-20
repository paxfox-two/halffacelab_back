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
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth={1.6} />
      <path d="M6.5 10.3l2.3 2.3 4.7-4.9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
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
      <circle cx="7.3" cy="8.8" r="0.9" fill={color} />
      <circle cx="12.7" cy="8.8" r="0.9" fill={color} />
      <path d="M7 13c1 1 5 1 6 0" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

export function DistanceIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 6l2.5-2.5M3 6l2.5 2.5M17 6l-2.5-2.5M17 6l-2.5 2.5M3 6h14" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14h12v2H4z" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    </svg>
  );
}

export function AsteriskIcon({ size = 16, color = '#0F62FE', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 2v12M2.7 4.5l10.6 7M13.3 4.5L2.7 11.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}
