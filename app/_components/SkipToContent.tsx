"use client";

import React from "react";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-gradient-to-r focus:from-orange-600 focus:to-amber-600 focus:text-white focus:rounded-lg focus:shadow-2xl focus:font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-950"
    >
      Skip to main content
    </a>
  );
}
