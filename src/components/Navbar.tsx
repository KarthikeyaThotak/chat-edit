import { motion } from "framer-motion";
import SegmentedControl from "./SegmentedControl";
import ThemeToggle from "./ThemeToggle";

type TabType = "lobby" | "editor" | "studio";

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 flex items-center justify-center px-4">
      {/* Floating Glass Navbar */}
      <motion.nav 
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-background/60 backdrop-blur-2xl border border-border/40 shadow-lg shadow-foreground/[0.02]"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo Section */}
        <motion.div 
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated Logo */}
          <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-indigo-500 rounded-xl flex items-center justify-center overflow-hidden group">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-white/20 to-primary/0"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative w-2 h-2 bg-white rounded-full" />
          </div>
          
          {/* Brand Text */}
          <div className="flex items-baseline">
            <span className="text-sm font-bold text-foreground tracking-tight">PixelCut</span>
            <span className="text-sm font-medium text-primary ml-0.5">AI</span>
          </div>
        </motion.div>

        {/* Separator */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-border to-transparent" />

        {/* Segmented Control */}
        <SegmentedControl activeTab={activeTab} onTabChange={onTabChange} />

        {/* Separator */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-border to-transparent" />

        {/* Right Section */}
        <div className="flex items-center gap-1.5 px-1">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Status Indicator */}
          <motion.div 
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/5 border border-success/10"
            whileHover={{ scale: 1.02 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-success-pulse absolute inline-flex h-full w-full rounded-full bg-success"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs font-medium text-success">Live</span>
          </motion.div>

          {/* Profile */}
          <motion.button 
            className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative text-xs font-bold text-white">JD</span>
          </motion.button>
        </div>
      </motion.nav>
    </header>
  );
};

export default Navbar;
