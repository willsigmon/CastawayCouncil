"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface WaterRippleProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
}

export function WaterRipple({ children, intensity = 1, className = "" }: WaterRippleProps) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%"],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(26, 95, 122, ${0.1 * intensity}) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(26, 95, 122, ${0.15 * intensity}) 0%, transparent 50%),
          radial-gradient(circle at 40% 20%, rgba(26, 95, 122, ${0.08 * intensity}) 0%, transparent 50%)
        `,
        backgroundSize: "200% 200%",
      }}
    >
      {children}
    </motion.div>
  );
}

