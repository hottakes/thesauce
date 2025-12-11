import { motion } from "framer-motion";
import { Share2, ArrowRight, Trophy, Users, Sparkles } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";

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
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#FF6B35", "#FF3366", "#FFD700", "#00FF88"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Big burst at start
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: colors,
    });
  }, []);

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
        <motion.span 
          className="text-5xl mb-2 block"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          🎉
        </motion.span>
        <h2 className="text-2xl font-display font-bold">
          You're in the game!
        </h2>
        <p className="text-muted-foreground mt-2">
          Here's your Ambassador Card
        </p>
      </motion.div>

      {/* Ambassador Card with Animated Border */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="w-full max-w-sm perspective-1000"
      >
        {/* Animated gradient border container */}
        <div className="relative p-[3px] rounded-3xl overflow-hidden">
          {/* Animated gradient border */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(90deg, #FF6B35, #FF3366, #FF6B35, #FF3366)",
              backgroundSize: "300% 100%",
              animation: "gradient-shift 3s linear infinite",
            }}
          />
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl opacity-50 blur-xl"
            style={{
              background: "linear-gradient(90deg, #FF6B35, #FF3366)",
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Card content */}
          <div className="relative bg-card rounded-3xl p-6 overflow-hidden">
            {/* Gradient overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{ background: "var(--gradient-sauce)" }}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
              }}
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut",
              }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <motion.div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-lg"
                  style={{
                    boxShadow: "0 0 30px rgba(255, 107, 53, 0.4)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255, 107, 53, 0.3)",
                      "0 0 40px rgba(255, 107, 53, 0.5)",
                      "0 0 20px rgba(255, 107, 53, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🧃
                </motion.div>
                <div className="text-left">
                  <p className="text-primary font-semibold text-lg">@{data.instagramHandle}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Sauce Ambassador
                  </p>
                </div>
              </div>

              {/* Achievement Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <motion.div 
                  className="relative p-3 rounded-xl text-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 51, 102, 0.1))",
                    border: "1px solid rgba(255, 107, 53, 0.3)",
                  }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold gradient-text">2.4K</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Followers</p>
                </motion.div>
                
                <motion.div 
                  className="relative p-3 rounded-xl text-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 51, 102, 0.15), rgba(255, 107, 53, 0.1))",
                    border: "1px solid rgba(255, 51, 102, 0.3)",
                  }}
                  initial={{ scale: 0, rotate: 10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  <Users className="w-4 h-4 text-accent mx-auto mb-1" />
                  <p className="text-lg font-bold gradient-text">{data.householdSize}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Crew Size</p>
                </motion.div>
                
                <motion.div 
                  className="relative p-3 rounded-xl text-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 107, 53, 0.1))",
                    border: "1px solid rgba(255, 215, 0, 0.3)",
                  }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <p className="text-lg font-bold gradient-text truncate">{data.personalityTraits[0] || "Vibe"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Trait</p>
                </motion.div>
              </div>

              {/* Ambassador Type */}
              <motion.div 
                className="text-center mb-6 py-4 rounded-2xl"
                style={{
                  background: "linear-gradient(180deg, rgba(255, 107, 53, 0.1), transparent)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Your Ambassador Type</p>
                <motion.h3 
                  className="text-3xl font-display font-bold gradient-text mb-3"
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(255, 107, 53, 0.3)",
                      "0 0 40px rgba(255, 107, 53, 0.5)",
                      "0 0 20px rgba(255, 107, 53, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {data.ambassadorType.name}
                </motion.h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  {data.ambassadorType.description}
                </p>
              </motion.div>

              {/* Brand Matches */}
              <motion.div 
                className="mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Based on your vibe, you'd crush it with:
                </p>
                <div className="flex justify-center gap-2">
                  {BRAND_MATCHES.map((brand, index) => (
                    <motion.span
                      key={brand}
                      className="px-4 py-2 rounded-full text-xs font-semibold"
                      style={{
                        background: "linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 51, 102, 0.2))",
                        border: "1px solid rgba(255, 107, 53, 0.4)",
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1 + index * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {brand}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
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

      {/* Add keyframes for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};
