"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress: 0 → 100 over 1.8s
    const start = performance.now();
    const duration = 1800;

    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
          style={{
            background: "linear-gradient(150deg, #0a1f13 0%, #1b4332 50%, #0d2818 100%)",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
        >
          {/* ── Logo & brand ── */}
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white font-black text-3xl tracking-wide mb-1">سبانكر</p>
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase">Spanker Travel</p>
          </motion.div>

          {/* ── Runway + plane ── */}
          <div className="relative w-72">
            {/* Track */}
            <div className="h-0.5 w-full rounded-full bg-white/10" />

            {/* Filled progress */}
            <motion.div
              className="absolute top-0 start-0 h-0.5 rounded-full bg-brand-yellow"
              style={{ width: `${progress}%` }}
            />

            {/* Plane rides along the progress bar */}
            <motion.div
              className="absolute top-0 -translate-y-1/2"
              style={{
                // shift from 0% to 100% of track width, offset half the plane width so it centers
                left: `calc(${progress}% - 20px)`,
              }}
            >
              {/* Exhaust trail */}
              <motion.div
                className="absolute top-1/2 end-full -translate-y-1/2 h-0.5 rounded-full"
                style={{
                  width: `${progress * 1.2}px`,
                  background: "linear-gradient(to left, rgba(253,209,42,0.5), transparent)",
                }}
              />

              {/* Plane SVG */}
              <svg
                viewBox="0 0 80 52"
                className="w-10 h-7 text-white drop-shadow-lg"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M72 22l-10 2.5L46 4H38l7 20H28l-5-7H16l2.5 15L16 47h7l5-7h17l-7 20h8l16-20 10 2.5c5 0 8-3.5 8-8s-3-8.5-8-8.5z" />
              </svg>
            </motion.div>
          </div>

          {/* ── Destination dots ── */}
          <motion.div
            className="flex items-center gap-2 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {["القاهرة", "دبي", "إسطنبول", "لندن"].map((city, i) => (
              <motion.span
                key={city}
                className="text-white/30 text-xs"
                animate={{ opacity: progress > i * 25 ? 0.8 : 0.25 }}
                transition={{ duration: 0.3 }}
              >
                {city}
                {i < 3 && <span className="mx-1.5 text-white/20">·</span>}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
