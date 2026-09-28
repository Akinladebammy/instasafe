"use client";

import { motion, useReducedMotion } from "motion/react";

export function ScrollLine() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="h-full w-full bg-brand"
      initial={reduceMotion ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{
        duration: reduceMotion ? 0 : 0.9,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformOrigin: "left" }}
    />
  );
}
