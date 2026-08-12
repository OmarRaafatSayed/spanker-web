"use client";

import React from "react";
import { COLOR_PALETTE, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "@/lib/design-tokens";
import { ColorShowcase } from "./showcase/ColorShowcase";
import { TypographyShowcase } from "./showcase/TypographyShowcase";
import { SpacingShowcase } from "./showcase/SpacingShowcase";
import { ShadowsShowcase } from "./showcase/ShadowsShowcase";
import { ComponentsShowcase } from "./showcase/ComponentsShowcase";
import { GradientsShowcase } from "./showcase/GradientsShowcase";

export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = React.useState("colors");

  return (
    <div style={{ background: COLOR_PALETTE.background.light, minHeight: "100vh", padding: SPACING[8] }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: SPACING[12] }}>
          <h1
            style={{
              fontSize: TYPOGRAPHY.fontSize["5xl"],
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLOR_PALETTE.brand.green,
              marginBottom: SPACING[2],
            }}
          >
            ✨ Spanker Design System
          </h1>
          <p
            style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              color: COLOR_PALETTE.text.secondary,
            }}
          >
            Luxury travel brand identity — all tokens in one place.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: SPACING[2],
            marginBottom: SPACING[8],
            borderBottom: `2px solid ${COLOR_PALETTE.border.light}`,
            paddingBottom: SPACING[4],
            overflowX: "auto",
          }}
        >
          {["colors", "typography", "spacing", "shadows", "components", "gradients"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: `${SPACING[3]} ${SPACING[6]}`,
                background: activeTab === tab ? COLOR_PALETTE.brand.green : "transparent",
                color: activeTab === tab ? "white" : COLOR_PALETTE.text.secondary,
                border: "none",
                borderRadius: BORDER_RADIUS.md,
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                cursor: "pointer",
                transition: "all 300ms ease-out",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "colors" && <ColorShowcase />}
        {activeTab === "typography" && <TypographyShowcase />}
        {activeTab === "spacing" && <SpacingShowcase />}
        {activeTab === "shadows" && <ShadowsShowcase />}
        {activeTab === "components" && <ComponentsShowcase />}
        {activeTab === "gradients" && <GradientsShowcase />}
      </div>
    </div>
  );
}

export default DesignSystemShowcase;
