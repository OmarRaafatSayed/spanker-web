"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1f13] via-[#1b4332] to-[#0d2818]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
        >
          {/* Runway line */}
          <div className="relative w-64 h-0.5 bg-white/10 rounded-full mb-8">
            <motion.div
              className="absolute inset-y-0 start-0 bg-brand-yellow rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          </div>

          {/* Plane */}
          <motion.div
            className="relative"
            initial={{ x: -80, y: 20 }}
            animate={{ x: 80, y: -20 }}
            transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Exhaust trail */}
            <motion.div
              className="absolute top-1/2 end-full -translate-y-1/2 h-0.5 bg-gradient-to-l from-brand-yellow/60 to-transparent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              aria-hidden="true"
            />

            <svg viewBox="0 0 80 52" className="w-20 h-14 text-white drop-shadow-lg" fill="currentColor" aria-hidden="true">
              <path d="M72 22l-10 2.5L46 4H38l7 20H28l-5-7H16l2.5 15L16 47h7l5-7h17l-7 20h8l16-20 10 2.5c5 0 8-3.5 8-8s-3-8.5-8-8.5z"/>
              <path d="M20 18l-8 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
              <path d="M18 24l-6 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".3"/>
            </svg>
          </motion.div>

          {/* Brand */}
          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-white font-black text-2xl tracking-wide">سبانكر</p>
            <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Spanker Travel</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
