import { motion } from "framer-motion";
import { SocialProofTicker } from "../SocialProofTicker";
import { BrandLogos } from "../BrandLogos";
import { LiveActivityTicker } from "../LiveActivityTicker";
import { ONTARIO_UNIVERSITIES } from "@/types/applicant";
import { ChevronDown } from "lucide-react";

interface LandingStageProps {
  onStart: () => void;
}

export const LandingStage = ({ onStart }: LandingStageProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Live Activity Ticker */}
      <LiveActivityTicker />
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <span className="text-5xl">🧃</span>
          </motion.div>

          {/* Headlines */}
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
            Get Discovered.
            <br />
            <span className="gradient-text">Get Paid. Get Sauce.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            We're recruiting ambassadors at Ontario universities.
            <br />
            <span className="text-foreground font-medium">Limited spots.</span>
          </p>

          {/* Scarcity Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm">
              Currently accepting at{" "}
              <span className="text-primary font-medium">{ONTARIO_UNIVERSITIES[0]}</span>
              {" — "}
              <span className="text-foreground font-semibold">12 spots remaining</span>
            </span>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onStart}
            className="sauce-button w-full max-w-xs pulse-glow"
          >
            See If You Qualify
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center pb-4"
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
      </motion.div>

      {/* Social Proof */}
      <SocialProofTicker />

      {/* Brand Logos */}
      <BrandLogos />
    </div>
  );
};