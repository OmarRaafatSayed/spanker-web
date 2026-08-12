"use client";

import React from "react";
import {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
} from "@/lib/design-tokens";

export function TypographyShowcase() {
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
        Typography
      </h2>

      <div style={{ marginBottom: SPACING[12] }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
          }}
        >
          Font Sizes
        </h3>
        <div style={{ display: "grid", gap: SPACING[4] }}>
          {Object.entries(TYPOGRAPHY.fontSize).map(([size, value]) => (
            <div key={size} style={{ padding: SPACING[4] }}>
              <div
                style={{
                  fontSize: value,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLOR_PALETTE.text.primary,
                  marginBottom: SPACING[2],
                }}
              >
                {size}: The quick brown fox
              </div>
              <code
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLOR_PALETTE.text.muted,
                }}
              >
                {value}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: SPACING[12] }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
          }}
        >
          Font Weights
        </h3>
        <div style={{ display: "grid", gap: SPACING[4] }}>
          {Object.entries(TYPOGRAPHY.fontWeight).map(([weight, value]) => (
            <div key={weight} style={{ padding: SPACING[4] }}>
              <div
                style={{
                  fontSize: TYPOGRAPHY.fontSize.lg,
                  fontWeight: value,
                  color: COLOR_PALETTE.text.primary,
                }}
              >
                {weight}: The quick brown fox
              </div>
              <code style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLOR_PALETTE.text.muted }}>
                {value}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
