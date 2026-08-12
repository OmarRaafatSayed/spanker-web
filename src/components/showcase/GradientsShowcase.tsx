"use client";

import React from "react";
import {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
} from "@/lib/design-tokens";

export function GradientsShowcase() {
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
        Gradients
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: SPACING[6],
        }}
      >
        {Object.entries(GRADIENTS).map(([name, gradient]) => (
          <div key={name}>
            <div
              style={{
                background: gradient,
                borderRadius: BORDER_RADIUS.lg,
                height: "150px",
                marginBottom: SPACING[3],
                boxShadow: SHADOWS.md,
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
