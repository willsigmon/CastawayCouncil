"use client";

import { useEffect, ReactNode } from "react";

interface SmoothScrollProps {
    children: ReactNode;
    options?: {
        smooth?: boolean;
        smoothness?: number;
    };
}

export function SmoothScroll({ children, options = { smooth: true, smoothness: 0.1 } }: SmoothScrollProps) {
    useEffect(() => {
        if (!options.smooth) return;

        let rafId: number | null = null;
        let scrollTimeout: NodeJS.Timeout | null = null;

        const smoothScroll = () => {
            const currentScroll = window.pageYOffset;
            const targetScroll = currentScroll + (window.scrollY - currentScroll) * options.smoothness!;

            if (Math.abs(targetScroll - currentScroll) > 0.5) {
                window.scrollTo(0, targetScroll);
                rafId = requestAnimationFrame(smoothScroll);
            }
        };

        const handleScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);

            scrollTimeout = setTimeout(() => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(smoothScroll);
            }, 10);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
            if (scrollTimeout) clearTimeout(scrollTimeout);
        };
    }, [options.smooth, options.smoothness]);

    return <>{children}</>;
}
