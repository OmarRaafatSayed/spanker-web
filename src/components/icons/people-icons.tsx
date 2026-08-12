import type { SVGProps } from "react";
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function UsersIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function BabyIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 12h6M12 9v6M6 15a6 6 0 1 0 12 0" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function AccessibilityIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="16" cy="16" r="1" />
      <path d="M16 16V4M8 9h0M8 13h0M12 13h0" />
      <path d="M12 5a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3M9 20a3 3 0 0 1-3-3v-1M9 14l-3.5 3.5" />
    </svg>
  );
}

export function UtensilsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2M3 9h8M5 21h14M5 18h14" />
      <path d="M19 2v7c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V2" />
    </svg>
  );
}

export function ArmchairIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 9V7c0-1-1-2-2-2h-2V3h-6v2H7c-1 0-2 1-2 2v2M5 9v10c0 1 1 2 2 2h10c1 0 2-1 2-2V9M9 9v10M15 9v10" />
    </svg>
  );
}
