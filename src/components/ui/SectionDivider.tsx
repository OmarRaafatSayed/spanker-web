"use client";

/**
 * SectionDivider — SVG wave / curve shapes between sections.
 * Usage:
 *   <SectionDivider from="dark" to="green-dark" variant="wave" />
 */

type Color = "dark" | "green-dark" | "green" | "transparent";

const BG: Record<Color, string> = {
  dark: "#0f1a0b",
  "green-dark": "#2d5128",
  green: "#3D6833",
  transparent: "transparent",
};

interface SectionDividerProps {
  /** Background color of the section ABOVE this divider */
  from: Color;
  /** Background color of the section BELOW this divider */
  to: Color;
  /** Shape variant */
  variant?: "wave" | "tilt" | "curve" | "zigzag";
  /** Flip horizontally (useful for alternating direction) */
  flip?: boolean;
  /** Extra class */
  className?: string;
}

export function SectionDivider({
  from,
  to,
  variant = "wave",
  flip = false,
  className = "",
}: SectionDividerProps) {
  const fill = BG[to];
  // The outer div carries the "from" background so there's no gap
  const outer = `w-full overflow-hidden leading-none ${className}`;

  const svgProps = {
    className: `block w-full${flip ? " scale-x-[-1]" : ""}`,
    preserveAspectRatio: "none" as const,
    "aria-hidden": true,
  };

  if (variant === "wave") {
    return (
      <div className={outer} style={{ backgroundColor: BG[from] }}>
        <svg viewBox="0 0 1440 80" height={80} {...svgProps}>
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
            fill={fill}
          />
        </svg>
      </div>
    );
  }

  if (variant === "tilt") {
    return (
      <div className={outer} style={{ backgroundColor: BG[from] }}>
        <svg viewBox="0 0 1440 60" height={60} {...svgProps}>
          <polygon points="0,60 1440,0 1440,60" fill={fill} />
        </svg>
      </div>
    );
  }

  if (variant === "curve") {
    return (
      <div className={outer} style={{ backgroundColor: BG[from] }}>
        <svg viewBox="0 0 1440 100" height={100} {...svgProps}>
          <path d="M0,0 Q720,100 1440,0 L1440,100 L0,100 Z" fill={fill} />
        </svg>
      </div>
    );
  }

  if (variant === "zigzag") {
    return (
      <div className={outer} style={{ backgroundColor: BG[from] }}>
        <svg viewBox="0 0 1440 48" height={48} {...svgProps}>
          <polyline
            points="0,0 120,48 240,0 360,48 480,0 600,48 720,0 840,48 960,0 1080,48 1200,0 1320,48 1440,0 1440,48 0,48"
            fill={fill}
          />
        </svg>
      </div>
    );
  }

  return null;
}
