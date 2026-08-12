"use client";

import React from "react";
import {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "@/lib/design-tokens";

function ColorSwatch({
  name,
  color,
  showText = false,
}: {
  name: string;
  color: string;
  showText?: boolean;
}) {
  const isLight = !showText && (color.startsWith("rgba") || color.includes("f") || color === "#ffffff");

  return (
    <div
      style={{
        padding: SPACING[4],
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.md,
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: color,
          borderRadius: BORDER_RADIUS.md,
          height: "120px",
          marginBottom: SPACING[3],
          border: isLight ? `1px solid ${COLOR_PALETTE.border.light}` : undefined,
        }}
      />
      <p
        style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLOR_PALETTE.text.primary,
          marginBottom: SPACING[1],
        }}
      >
        {name}
      </p>
      <code
        style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          color: COLOR_PALETTE.text.muted,
          background: COLOR_PALETTE.background.lightAlt,
          padding: SPACING[1],
          borderRadius: BORDER_RADIUS.sm,
          display: "block",
        }}
      >
        {color}
      </code>
    </div>
  );
}

export function ColorShowcase() {
  return (
    <div>
      <h2
        style={{
          fontSize: TYPOGRAPHY.fontSize["3xl"],
          fontWeight: TYPOGRAPHY.fontWeight.bold,
          marginBottom: SPACING[6],
          color: COLOR_PALETTE.brand.green,
        }}
      >
        Color Palette
      </h2>

      <div style={{ marginBottom: SPACING[12] }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
            color: COLOR_PALETTE.text.primary,
          }}
        >
          Primary: Emerald Green
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: SPACING[4],
          }}
        >
          {Object.entries(COLOR_PALETTE.brand).map(([name, color]) => (
            <ColorSwatch key={name} name={name} color={color} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: SPACING[12] }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
            color: COLOR_PALETTE.text.primary,
          }}
        >
          Secondary: Premium Gold
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: SPACING[4],
          }}
        >
          {Object.entries(COLOR_PALETTE.accent).map(([name, color]) => (
            <ColorSwatch key={name} name={name} color={color} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: SPACING[12] }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
            color: COLOR_PALETTE.text.primary,
          }}
        >
          Text Hierarchy
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: SPACING[4],
          }}
        >
          {Object.entries(COLOR_PALETTE.text).map(([name, color]) => (
            <ColorSwatch key={name} name={name} color={color} showText />
          ))}
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
            color: COLOR_PALETTE.text.primary,
          }}
        >
          Backgrounds
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: SPACING[4],
          }}
        >
          {Object.entries(COLOR_PALETTE.background).map(([name, color]) => (
            <ColorSwatch key={name} name={name} color={color} />
          ))}
        </div>
      </div>
    </div>
  );
}
