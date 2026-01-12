'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SocialProofTicker } from "../SocialProofTicker";
import { BrandLogos } from "../BrandLogos";
import { LiveActivityTicker } from "../LiveActivityTicker";
import { ONTARIO_UNIVERSITIES } from "@/types/applicant";
import { ChevronDown, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

interface LandingStageProps {
  onStart: () => void;
}

export const LandingStage = ({ onStart }: LandingStageProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setIsLoggedIn(!!session);
        setIsLoading(false);
      })
      .catch(() => {
        // Session check failed - continue with logged out state
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_: AuthChangeEvent, session: Session | null) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Spacer for centering */}
          <div className="w-20" />

          {/* Sign In / Dashboard Button */}
          {!isLoading && (
            <Link href={isLoggedIn ? "/portal" : "/portal/login"}>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground border border-border/50 hover:border-border hover:bg-card/50"
              >
                {isLoggedIn ? (
                  <>
                    Dashboard
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Link>
          )}
        </div>
      </motion.header>

      {/* Live Activity Ticker */}
      <div className="pt-14">
        <LiveActivityTicker />
      </div>

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
            className="mb-8 relative"
          >
            {/* Glow effect behind logo */}
            <motion.div
              className="absolute inset-0 blur-3xl opacity-40"
              style={{
                background: "radial-gradient(circle, hsl(var(--sauce-orange)) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.img 
              src="/logo-white.png" 
              alt="Sauce" 
              className="h-24 w-auto object-contain mx-auto relative z-10" 
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Headlines */}
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
            Get Discovered.
            <br />
            <span className="gradient-text">Get Paid. Get Sauce.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            We&apos;re recruiting ambassadors at Ontario universities.
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
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ 
              delay: 0.5,
              scale: { type: "spring", stiffness: 500, damping: 15 },
              y: { type: "spring", stiffness: 500, damping: 15 }
            }}
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
