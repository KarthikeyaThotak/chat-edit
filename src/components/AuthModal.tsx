import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle} from "lucide-react";

// Google icon component with brand colors
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "signup" | "forgot" | "reset";

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { login, signup, signInWithGoogle, resetPassword } = useAuth();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setResetEmailSent(false);
    setResetToken(null);
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === "Google") {
      setIsLoading(true);
      try {
        const result = await signInWithGoogle();
        if (result.success) {
          toast({ title: "Welcome!", description: "You've been signed in successfully." });
          onOpenChange(false);
          resetForm();
        } else {
          toast({ title: "Sign-in failed", description: result.error, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Sign-in failed", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: `${provider} login coming soon!`,
        description: "This feature will be available shortly.",
      });
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    if (newMode === "login" || newMode === "signup") {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (result.success) {
          toast({ title: "Welcome back!", description: "You've been logged in successfully." });
          onOpenChange(false);
          resetForm();
        } else {
          toast({ title: "Login failed", description: result.error, variant: "destructive" });
        }
      } else if (mode === "signup") {
        const result = await signup(name, email, password);
        if (result.success) {
          toast({ title: "Account created!", description: "Welcome to Drafft AI." });
          onOpenChange(false);
          resetForm();
        } else {
          toast({ title: "Signup failed", description: result.error, variant: "destructive" });
        }
      } else if (mode === "forgot") {
        // Send password reset email via Firebase
        const result = await resetPassword(email, "");
        if (result.success) {
          setResetEmailSent(true);
          toast({ title: "Reset email sent!", description: "Check your inbox for the reset link." });
        } else {
          toast({ title: "Reset failed", description: result.error, variant: "destructive" });
        }
      } else if (mode === "reset") {
        // Note: Firebase requires users to reset password via email link
        // This mode is kept for UI consistency but won't work with Firebase
        toast({ 
          title: "Password reset required", 
          description: "Please use the link sent to your email to reset your password.", 
          variant: "destructive" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome back";
      case "signup": return "Create account";
      case "forgot": return resetEmailSent ? "Check your email" : "Reset password";
      case "reset": return "Set new password";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return "Sign in to continue editing";
      case "signup": return "Start creating with Drafft AI";
      case "forgot": return resetEmailSent 
        ? "We've sent a password reset link to your email" 
        : "Enter your email to receive a reset link";
      case "reset": return "Choose a strong password for your account";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          {/* Back Button for forgot/reset modes */}
          <AnimatePresence>
            {(mode === "forgot" || mode === "reset") && (
              <motion.button
                type="button"
                onClick={() => handleModeSwitch("login")}
                className="absolute top-4 left-4 p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Logo / Success Icon */}
          <motion.div 
            className="flex items-center justify-center gap-2 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={resetEmailSent ? "success" : "logo"}
          >
            {resetEmailSent ? (
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-500 rounded-xl flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
            )}
          </motion.div>
          
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-center">
              {getTitle()}
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center">
              {getSubtitle()}
            </p>
          </DialogHeader>
        </div>

        {/* Mode Switcher - only for login/signup */}
        <AnimatePresence mode="wait">
          {(mode === "login" || mode === "signup") && (
            <motion.div 
              className="px-6 py-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex bg-secondary/50 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === "login"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("signup")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === "signup"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Login Buttons - only for login/signup */}
        <AnimatePresence mode="wait">
          {(mode === "login" || mode === "signup") && (
            <motion.div
              className="px-6 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary/70 rounded-xl border border-border/50 transition-all duration-200 text-sm font-medium"
                >
                  <GoogleIcon />
                  <span>Google</span>
                </button>
              </div>
              
              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <AnimatePresence mode="wait">
            {/* Name field - signup only */}
            {mode === "signup" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:ring-primary/20"
                      required={mode === "signup"}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email field - login, signup, forgot */}
            {(mode === "login" || mode === "signup" || (mode === "forgot" && !resetEmailSent)) && (
              <motion.div
                key="email-field"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Password field - login, signup, reset */}
            {(mode === "login" || mode === "signup" || mode === "reset") && (
              <motion.div
                key="password-field"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    {mode === "reset" ? "New Password" : "Password"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:ring-primary/20"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {(mode === "signup" || mode === "reset") && (
                    <p className="text-xs text-muted-foreground">At least 6 characters</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Confirm Password field - reset only */}
            {mode === "reset" && (
              <motion.div
                key="confirm-password-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:ring-primary/20"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Forgot password link - login only */}
            {mode === "login" && (
              <motion.div
                key="forgot-link"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button
                  type="button"
                  onClick={() => handleModeSwitch("forgot")}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </motion.div>
            )}

            {/* Reset email sent - show action buttons */}
            {mode === "forgot" && resetEmailSent && (
              <motion.div
                key="reset-sent-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-2"
              >
                <Button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setResetEmailSent(false);
                  }}
                  className="w-full h-11 rounded-xl font-semibold"
                  variant="premium"
                >
                  I have the code, reset password
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button
                    type="button"
                    onClick={() => setResetEmailSent(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Try again
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button - not shown when reset email sent */}
          {!(mode === "forgot" && resetEmailSent) && (
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl font-semibold"
              variant="premium"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "signup" ? (
                "Create Account"
              ) : mode === "forgot" ? (
                "Send Reset Link"
              ) : (
                "Update Password"
              )}
            </Button>
          )}

          {/* Footer links */}
          {mode === "login" && (
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => handleModeSwitch("signup")}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          )}

          {mode === "forgot" && !resetEmailSent && (
            <p className="text-xs text-center text-muted-foreground">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => handleModeSwitch("login")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;