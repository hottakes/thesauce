import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface TileSelectorProps {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  maxSelect?: number;
  columns?: 2 | 3 | 4;
}

// Haptic feedback utility
const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export const TileSelector = ({
  options,
  selected,
  onSelect,
  maxSelect,
  columns = 2,
}: TileSelectorProps) => {
  const handleSelect = useCallback((option: string) => {
    triggerHaptic();
    if (selected.includes(option)) {
      onSelect(option);
    } else if (!maxSelect || selected.length < maxSelect) {
      onSelect(option);
    }
  }, [selected, onSelect, maxSelect]);

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns])}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option);
        return (
          <motion.button
            key={option}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleSelect(option)}
            whileTap={{ 
              scale: 0.92,
              transition: { duration: 0.1 }
            }}
            whileHover={{ scale: 1.02 }}
            className={cn(
              "tile-select text-center text-sm font-medium relative overflow-hidden",
              isSelected && "selected"
            )}
          >
            {/* Ripple effect on selection */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 m-auto w-full h-full rounded-xl bg-primary pointer-events-none"
              />
            )}
            
            {/* Selection pulse ring */}
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0, 0.3, 0],
                  scale: [0.8, 1.1, 1.2],
                }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeOut"
                }}
                className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
              />
            )}
            
            <span className="relative z-10">{option}</span>
            
            {/* Selected indicator dot with bounce */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary shadow-lg"
                style={{
                  boxShadow: "0 0 8px rgba(255, 107, 53, 0.6)"
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
