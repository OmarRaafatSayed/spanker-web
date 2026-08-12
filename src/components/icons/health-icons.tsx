import type { SVGProps } from "react";
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function HeartPulseIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 14c0 1.105-.902 2-2 2h-.75a.75.75 0 0 1-.528-.219l-2.473-2.582a.75.75 0 0 0-1.06 0l-.943.943a.75.75 0 0 0 0 1.06l2.582 2.582a.75.75 0 0 1 0 1.06L14.47 20.47a.75.75 0 0 0 0 1.06l.943.943a.75.75 0 0 0 1.06 0l2.582-2.582a.75.75 0 0 1 .528-.219H19c1.105 0 2-.902 2-2v-3" />
      <path d="M3.464 3.464C4.93 1.998 7.286 1.998 8.75 3.464L12 6.714l3.25-3.25c1.464-1.466 3.82-1.466 5.286 0s1.464 3.822 0 5.286L12 17.286l-8.536-8.536c-1.464-1.464-1.464-3.82 0-5.286z" />
    </svg>
  );
}

export function AmbulanceIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 10h.01" />
      <path d="M10 14h4" />
      <path d="M12 10v4" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
      <path d="M6 9V6" />
      <path d="M18 9V6" />
      <ellipse cx="6" cy="20" rx="2" ry="2" />
      <ellipse cx="18" cy="20" rx="2" ry="2" />
    </svg>
  );
}

export function PillIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.5 2 L14.5 6 L10 10.5 L6 6.5 Z" />
      <path d="M9.5 9.5 L19.5 19.5 M20 10 L10 20" />
    </svg>
  );
}

export function DropletIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

export function FlameIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A4.5 4.5 0 0 0 12 22c2.1 0 3.7-1.38 4.3-2.88a4 4 0 0 0 2.188-3.12A4 4 0 0 0 16 9c-1.6 0-2.45.5-4 2-.9-1-2.2-2-4-2-3.31 0-6 2.69-6 6 0 .89.19 1.74.52 2.5z" />
    </svg>
  );
}
