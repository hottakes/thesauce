import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TileSelectorProps {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  maxSelect?: number;
  columns?: 2 | 3 | 4;
}

export const TileSelector = ({
  options,
  selected,
  onSelect,
  maxSelect,
  columns = 2,
}: TileSelectorProps) => {
  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onSelect(option);
    } else if (!maxSelect || selected.length < maxSelect) {
      onSelect(option);
    }
  };

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
            className={cn(
              "tile-select text-center text-sm font-medium",
              isSelected && "selected"
            )}
          >
            {option}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};