"use client";

import React from "react";
import {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "@/lib/design-tokens";

export function SpacingShowcase() {
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
        Spacing Scale
      </h2>
      <div style={{ display: "grid", gap: SPACING[6] }}>
        {[1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((key) => {
          const value = SPACING[key as keyof typeof SPACING];
          const pxValue = parseFloat(value) * 16;
          return (
            <div key={key}>
              <div
                style={{
                  background: COLOR_PALETTE.brand.green,
                  width: value,
                  height: SPACING[4],
                  borderRadius: BORDER_RADIUS.sm,
                  marginBottom: SPACING[2],
                }}
              />
              <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLOR_PALETTE.text.secondary }}>
                {key}: {value} ({pxValue}px)
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
