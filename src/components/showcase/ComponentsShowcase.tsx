"use client";

import React from "react";
import {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  COMPONENT_PRESETS,
} from "@/lib/design-tokens";
import {
  getGlassCardStyle,
  getGlassPanelStyle,
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  getAccentButtonStyle,
  getBadgeStyle,
} from "@/lib/use-design-tokens";

export function ComponentsShowcase() {
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
        Components & Presets
      </h2>

      <div style={{ marginBottom: SPACING[12] }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
          }}
        >
          Cards
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: SPACING[6] }}>
          <div style={{ ...COMPONENT_PRESETS.card.base, textAlign: "center" }}>
            <p style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold }}>Base Card</p>
          </div>
          <div style={{ ...getGlassCardStyle(), textAlign: "center" }}>
            <p style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold }}>Glass Card</p>
          </div>
          <div style={{ ...getGlassPanelStyle(), textAlign: "center" }}>
            <p style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold }}>Glass Panel</p>
          </div>
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
          Buttons
        </h3>
        <div style={{ display: "flex", gap: SPACING[4], flexWrap: "wrap" }}>
          <button style={getPrimaryButtonStyle()}>Primary</button>
          <button style={getSecondaryButtonStyle()}>Secondary</button>
          <button style={getAccentButtonStyle()}>Accent</button>
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            marginBottom: SPACING[4],
          }}
        >
          Badges
        </h3>
        <div style={{ display: "flex", gap: SPACING[4], flexWrap: "wrap" }}>
          <span style={getBadgeStyle("success")}>Success</span>
          <span style={getBadgeStyle("warning")}>Warning</span>
          <span style={getBadgeStyle("error")}>Error</span>
          <span style={getBadgeStyle("info")}>Info</span>
        </div>
      </div>
    </div>
  );
}
