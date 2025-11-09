"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import React, { useRef, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "fade";
    distance?: number;
    duration?: number;
    className?: string;
}

export function ScrollReveal({
    children,
    delay = 0,
    direction = "up",
    distance = 50,
    duration = 0.6,
    className = "",
}: ScrollRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const directionMap = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { y: 0, x: distance },
        right: { y: 0, x: -distance },
        fade: { y: 0, x: 0 },
    };

    const initial = directionMap[direction];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, ...initial }}
            animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...initial }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1], // Custom easing for smooth feel
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface ParallaxSectionProps {
    children: ReactNode;
    speed?: number;
    className?: string;
}

export function ParallaxSection({ children, speed = 0.5, className = "" }: ParallaxSectionProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);

    return (
        <motion.div ref={ref} style={{ y }} className={className}>
            {children}
        </motion.div>
    );
}

interface StaggerChildrenProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function StaggerChildren({ children, delay = 0.1, className = "" }: StaggerChildrenProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: delay,
                    },
                },
            }}
            className={className}
        >
            {React.Children.map(children, (child, index) => (
                <motion.div
                    key={index}
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                duration: 0.6,
                                ease: [0.25, 0.1, 0.25, 1],
                            },
                        },
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}
