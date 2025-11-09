"use client";

import { motion, useInView } from "framer-motion";
import React, { useRef, ReactNode } from "react";

interface TextRevealProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    splitBy?: "word" | "char" | "none";
}

export function TextReveal({
    children,
    delay = 0,
    className = "",
    splitBy = "word",
}: TextRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    if (splitBy === "none") {
        return (
            <motion.span
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
                className={className}
            >
                {children}
            </motion.span>
        );
    }

    const text = typeof children === "string" ? children : String(children);
    const words = splitBy === "word" ? text.split(" ") : text.split("");

    return (
        <span ref={ref} className={className}>
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{
                        duration: 0.5,
                        delay: delay + index * 0.05,
                        ease: [0.25, 0.1, 0.25, 1],
                    }}
                    style={{ display: "inline-block", marginRight: splitBy === "word" ? "0.25em" : "0.05em" }}
                >
                    {word}
                    {splitBy === "word" && index < words.length - 1 && "\u00A0"}
                </motion.span>
            ))}
        </span>
    );
}
