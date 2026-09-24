"use client";

import { useState, useCallback } from "react";
import { MOCK_BANNERS, MOCK_PACKAGES } from "@/lib/mock/data";
import type { TripPackage, ContentBanner } from "@/types";

interface CmsContent {
  banners: ContentBanner[];
  packages: TripPackage[];
  isLoadingBanners: boolean;
  isLoadingPackages: boolean;
  isDown: boolean;
  refetch: () => void;
}

export function useCmsContent(position?: ContentBanner["position"]): CmsContent {
  const filtered = position
    ? MOCK_BANNERS.filter(b => b.position === position)
    : MOCK_BANNERS;

  const [banners]  = useState<ContentBanner[]>(filtered);
  const [packages] = useState<TripPackage[]>(MOCK_PACKAGES);

  const refetch = useCallback(() => {
    // no-op in mock mode
  }, []);

  return {
    banners,
    packages,
    isLoadingBanners: false,
    isLoadingPackages: false,
    isDown: false,
    refetch,
  };
}
