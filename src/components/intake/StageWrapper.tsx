import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StageWrapperProps {
  children: ReactNode;
  stageKey: string;
}

export const StageWrapper = ({ children, stageKey }: StageWrapperProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stageKey}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="min-h-screen w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};