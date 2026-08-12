"use client";

import React from "react";
import {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "@/lib/design-tokens";

export function ShadowsShowcase() {
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
        Shadows & Elevation
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: SPACING[6],
        }}
      >
        {Object.entries(SHADOWS).map(([name, shadow]) => (
          <div key={name}>
            <div
              style={{
                background: COLOR_PALETTE.background.light,
                padding: SPACING[6],
                borderRadius: BORDER_RADIUS.lg,
                boxShadow: shadow,
                minHeight: "100px",
                marginBottom: SPACING[3],
              }}
            />
            <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
              {name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
