import { motion } from "framer-motion";
import { Share2, ArrowRight } from "lucide-react";

interface ResultCardStageProps {
  data: {
    instagramHandle: string;
    householdSize: number;
    personalityTraits: string[];
    ambassadorType: { name: string; description: string };
  };
  onContinue: () => void;
}

const BRAND_MATCHES = ["Prime", "GymShark", "Monster"];

export const ResultCardStage = ({ data, onContinue }: ResultCardStageProps) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "I just got my Sauce Ambassador Card! 🧃",
        text: `I'm ${data.ambassadorType.name}! See if you qualify to join the Sauce crew.`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <span className="text-4xl mb-2 block">🎉</span>
        <h2 className="text-2xl font-display font-bold">
          You're in the game!
        </h2>
        <p className="text-muted-foreground mt-2">
          Here's your Ambassador Card
        </p>
      </motion.div>

      {/* Ambassador Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="gradient-border rounded-3xl">
          <div className="bg-card rounded-3xl p-6 relative overflow-hidden">
            {/* Gradient overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{ background: "var(--gradient-sauce)" }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                  🧃
                </div>
                <div className="text-left">
                  <p className="text-primary font-medium">@{data.instagramHandle}</p>
                  <p className="text-xs text-muted-foreground">Sauce Ambassador</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-lg font-bold">2.4K</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-lg font-bold">{data.householdSize}</p>
                  <p className="text-xs text-muted-foreground">Household</p>
                </div>
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-lg font-bold truncate">{data.personalityTraits[0] || "Vibe"}</p>
                  <p className="text-xs text-muted-foreground">Vibe</p>
                </div>
              </div>

              {/* Ambassador Type */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">You are</p>
                <h3 className="text-2xl font-display font-bold gradient-text mb-2">
                  {data.ambassadorType.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.ambassadorType.description}
                </p>
              </div>

              {/* Brand Matches */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Based on your vibe, you'd crush it with these brands:
                </p>
                <div className="flex justify-center gap-2">
                  {BRAND_MATCHES.map((brand) => (
                    <span
                      key={brand}
                      className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm mt-8 space-y-3"
      >
        <button
          onClick={handleShare}
          className="sauce-button w-full flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share Your Card
        </button>
        <button
          onClick={onContinue}
          className="sauce-button-ghost w-full flex items-center justify-center gap-2"
        >
          Continue to Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};