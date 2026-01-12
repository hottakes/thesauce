'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Mail, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export const EmailVerificationBanner = ({ onDismiss }: EmailVerificationBannerProps) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className="glass-card border-primary/30 mb-6 relative">
          <Mail className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-display">Check your email</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            We sent you a verification link. Click it to activate your account.
          </AlertDescription>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};
