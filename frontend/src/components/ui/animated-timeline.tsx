"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export const AnimatedTimeline = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 10%", "end 50%"],
  });

  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className={cn("relative w-full mx-auto max-w-4xl", className)} ref={ref}>
      {/* The background track */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-slate-200/20 -translate-x-1/2"></div>
      
      {/* The glowing animated beam */}
      <motion.div
        style={{ height }}
        className="absolute left-4 md:left-1/2 top-0 w-[4px] bg-gradient-to-b from-[#c9a84c] via-[#003366] to-transparent rounded-full -translate-x-1/2"
      />
      
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};