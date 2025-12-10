import { motion } from "framer-motion";
import { Link, ExternalLink, CheckCircle2 } from "lucide-react";

interface WaitlistDashboardProps {
  data: {
    waitlistPosition: number;
    referralCode: string;
    points: number;
  };
}

const CHALLENGES = [
  {
    title: "Follow @getsauce on TikTok",
    points: 5,
    icon: "📱",
    completed: false,
  },
  {
    title: "Post a story tagging @getsauce",
    points: 10,
    icon: "📸",
    completed: false,
  },
  {
    title: "Refer a friend who applies",
    points: 20,
    icon: "👥",
    completed: false,
  },
  {
    title: "Complete the Brand Quiz",
    points: 10,
    icon: "🎯",
    completed: false,
  },
];

export const WaitlistDashboard = ({ data }: WaitlistDashboardProps) => {
  const progress = Math.min((data.points / 100) * 100, 100);

  return (
    <div className="min-h-screen px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <span className="text-4xl mb-2 block">🧃</span>
        <h1 className="text-2xl font-display font-bold mb-2">
          You're on the list!
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
          <span className="text-muted-foreground">Your position:</span>
          <span className="text-3xl font-display font-bold gradient-text">
            #{data.waitlistPosition}
          </span>
        </div>
      </motion.div>

      {/* Progress to Top 10 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 rounded-2xl mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Progress to Top 10</span>
          <span className="text-sm text-muted-foreground">
            {data.points}/100 points
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: "var(--gradient-sauce)" }}
          />
        </div>
      </motion.div>

      {/* Challenges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-lg font-display font-semibold mb-4">
          🚀 Boost your spot
        </h2>
        <div className="space-y-3">
          {CHALLENGES.map((challenge, index) => (
            <motion.div
              key={challenge.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass-card p-4 rounded-xl flex items-center gap-4"
            >
              <span className="text-2xl">{challenge.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{challenge.title}</p>
                <p className="text-xs text-primary">+{challenge.points} spots</p>
              </div>
              {challenge.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-5 rounded-2xl mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-5 h-5 text-primary" />
          <span className="font-medium">Your referral link</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={`sauce.app/join/${data.referralCode}`}
            readOnly
            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm truncate"
          />
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap">
            Copy
          </button>
        </div>
      </motion.div>

      {/* Footer Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-muted-foreground text-sm"
      >
        <p>
          We'll be in touch soon. Keep your phone on.{" "}
          <span className="text-lg">🧃</span>
        </p>
      </motion.div>
    </div>
  );
};