"use client";

import { useEffect, useState, useCallback } from "react";
import { TABLES } from "@/lib/db/schema";
import { supabase } from "@/lib/supabase/client";
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
  const [banners, setBanners] = useState<ContentBanner[]>([]);
  const [packages, setPackages] = useState<TripPackage[]>([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isDown, setIsDown] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadBanners() {
      setIsLoadingBanners(true);
      try {
        let query = supabase
          .from("content_banners")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (position) {
          query = query.eq("position", position);
        }

        const { data, error } = await query;

        if (!cancelled) {
          if (error) throw error;
          setBanners((data as unknown as ContentBanner[]) ?? []);
          setIsDown(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[cms] Failed to load banners:", err);
          setIsDown(true);
          setBanners([]);
        }
      } finally {
        if (!cancelled) setIsLoadingBanners(false);
      }
    }

    async function loadPackages() {
      setIsLoadingPackages(true);
      try {
        const { data, error } = await supabase
          .from(TABLES.trips)
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!cancelled) {
          if (error) throw error;
          setPackages((data as unknown as TripPackage[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[cms] Failed to load packages:", err);
          setPackages([]);
        }
      } finally {
        if (!cancelled) setIsLoadingPackages(false);
      }
    }

    loadBanners();
    loadPackages();

    return () => { cancelled = true; };
  }, [position, tick]);

  return {
    banners,
    packages,
    isLoadingBanners,
    isLoadingPackages,
    isDown,
    refetch,
  };
}
