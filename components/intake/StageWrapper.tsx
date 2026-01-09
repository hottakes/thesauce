import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StageWrapperProps {
  children: ReactNode;
  stageKey: string;
  direction?: "forward" | "back";
}

const slideVariants = {
  enter: (direction: "forward" | "back") => ({
    x: direction === "forward" ? "100%" : "-100%",
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: "forward" | "back") => ({
    x: direction === "forward" ? "-100%" : "100%",
    opacity: 0,
    scale: 0.95,
  }),
};

export const StageWrapper = ({ children, stageKey, direction = "forward" }: StageWrapperProps) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stageKey}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
        }}
        className="min-h-screen w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
