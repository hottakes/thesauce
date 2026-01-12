import { motion } from "framer-motion";
import { Mail, RefreshCw, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

interface EmailVerificationPendingStageProps {
  email: string;
  onResendEmail: () => Promise<void>;
  onBackToAccount: () => void;
}

export const EmailVerificationPendingStage = ({
  email,
  onResendEmail,
  onBackToAccount,
}: EmailVerificationPendingStageProps) => {
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [cooldown, setCooldown] = useState(0);

  // Fire confetti on mount (same as ResultCardStage)
  useEffect(() => {
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

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resendState === 'sending') return;

    setResendState('sending');
    try {
      await onResendEmail();
      setResendState('sent');
      setCooldown(60); // 60 second cooldown
      // Reset state after showing success
      setTimeout(() => setResendState('idle'), 3000);
    } catch {
      setResendState('error');
      setTimeout(() => setResendState('idle'), 3000);
    }
  }, [cooldown, resendState, onResendEmail]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Animated Mail Icon */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
          style={{
            boxShadow: "0 0 30px rgba(255, 107, 53, 0.4)",
          }}
          animate={{
            y: [0, -8, 0],
            boxShadow: [
              "0 0 20px rgba(255, 107, 53, 0.3)",
              "0 0 40px rgba(255, 107, 53, 0.5)",
              "0 0 20px rgba(255, 107, 53, 0.3)",
            ],
          }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {resendState === 'sent' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
          ) : (
            <Mail className="w-10 h-10 text-white" />
          )}
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mt-8"
      >
        <h2 className="text-2xl font-display font-bold">
          {resendState === 'sent' ? "Email sent!" : "Check your email"}
        </h2>
        <p className="text-muted-foreground mt-2">
          We sent a verification link to
        </p>
      </motion.div>

      {/* Email Badge (glass-card) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="glass-card px-6 py-3 mt-4"
      >
        <p className="text-primary font-medium">{email}</p>
      </motion.div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-muted-foreground text-center mt-6 max-w-xs"
      >
        Click the link in your email to activate your ambassador account
      </motion.p>

      {/* Resend Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 w-full max-w-xs"
      >
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resendState === 'sending'}
          className="sauce-button-ghost w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendState === 'sending' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : resendState === 'sent' ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              Email sent!
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Resend email
            </>
          )}
        </button>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-muted-foreground mb-2">Didn&apos;t receive it?</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>Check your spam folder</li>
          <li>Make sure the email is correct</li>
        </ul>
      </motion.div>

      {/* Back Link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        onClick={onBackToAccount}
        className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Use different email
      </motion.button>
    </div>
  );
};
