import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ONTARIO_UNIVERSITIES } from "@/types/applicant";

const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "Lucas", "Mia", "Jackson", "Charlotte", "Aiden", "Amelia",
  "Sebastian", "Harper", "Mateo", "Evelyn", "Jack", "Luna", "Owen",
  "Camila", "Alexander", "Gianna", "Henry", "Abigail", "Jacob", "Ella",
  "Michael", "Scarlett", "Daniel", "Sofia", "Logan", "Emily", "James",
  "Aria", "Benjamin", "Chloe", "William", "Mila", "Elijah", "Layla",
  "Oliver", "Riley", "Jayden", "Zoey", "Carter", "Nora", "Dylan"
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Activity {
  id: number;
  name: string;
  school: string;
  timeAgo: string;
}

const generateActivity = (): Activity => ({
  id: Date.now(),
  name: getRandomItem(FIRST_NAMES),
  school: getRandomItem(ONTARIO_UNIVERSITIES),
  timeAgo: `${Math.floor(Math.random() * 5) + 1}m ago`,
});

export const LiveActivityTicker = () => {
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    // Generate initial activity on client-side only to avoid hydration mismatch
    setActivity(generateActivity());

    const interval = setInterval(() => {
      setActivity(generateActivity());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until client-side activity is generated (avoids hydration mismatch)
  if (!activity) {
    return <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 h-10" />;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/20 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 51, 102, 0.05))",
          }}
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="text-base"
          >
            🔥
          </motion.span>
          <span className="text-sm">
            <span className="font-semibold text-foreground">{activity.name}</span>
            <span className="text-muted-foreground"> from </span>
            <span className="font-medium text-primary">{activity.school}</span>
            <span className="text-muted-foreground"> just applied</span>
          </span>
          <span className="text-xs text-muted-foreground/60 ml-1">
            {activity.timeAgo}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
