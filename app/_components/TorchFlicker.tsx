"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TorchFlickerProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
}

export function TorchFlicker({ children, intensity = 1, className = "" }: TorchFlickerProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        filter: [
          `drop-shadow(0 0 ${8 * intensity}px rgba(255, 107, 53, 0.6)) drop-shadow(0 0 ${16 * intensity}px rgba(255, 200, 87, 0.4))`,
          `drop-shadow(0 0 ${12 * intensity}px rgba(255, 107, 53, 0.8)) drop-shadow(0 0 ${24 * intensity}px rgba(255, 200, 87, 0.6))`,
          `drop-shadow(0 0 ${6 * intensity}px rgba(255, 107, 53, 0.5)) drop-shadow(0 0 ${12 * intensity}px rgba(255, 200, 87, 0.3))`,
          `drop-shadow(0 0 ${10 * intensity}px rgba(255, 107, 53, 0.7)) drop-shadow(0 0 ${20 * intensity}px rgba(255, 200, 87, 0.5))`,
          `drop-shadow(0 0 ${8 * intensity}px rgba(255, 107, 53, 0.6)) drop-shadow(0 0 ${16 * intensity}px rgba(255, 200, 87, 0.4))`,
        ],
        scale: [1, 1.02, 0.98, 1.01, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

