import { useRef } from "react";
import { motion, useMotionTemplate, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export const GlareCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const y = useSpring(0, { stiffness: 300, damping: 30 });

  const mouseX = useSpring(0, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(0, { stiffness: 300, damping: 30 });

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;

    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    x.set(xPct);
    y.set(yPct);
    mouseX.set(mouseXPos);
    mouseY.set(mouseYPos);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
    mouseX.set(0);
    mouseY.set(0);
  }

  const rotateX = useMotionTemplate`${y.get() * -20}deg`;
  const rotateY = useMotionTemplate`${x.get() * 20}deg`;

  const background = useMotionTemplate`radial-gradient(
    circle at ${mouseX.get()}px ${mouseY.get()}px,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 60%
  )`;

  return (
    <div
      style={{ perspective: "1000px" }}
      className="relative w-full h-full"
    >
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 transition-all duration-200 ease-linear",
          className
        )}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 transition-opacity duration-300"
          style={{ background }}
        />
        <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full w-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
};