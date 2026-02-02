import { motion } from "framer-motion";

type TabType = "lobby" | "editor" | "studio";

interface SegmentedControlProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
  { 
    id: "lobby", 
    label: "Lobby",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  { 
    id: "editor", 
    label: "Editor",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    )
  },
  { 
    id: "studio", 
    label: "Studio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    )
  },
];

const SegmentedControl = ({ activeTab, onTabChange }: SegmentedControlProps) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="relative flex items-center p-1 bg-secondary/50 rounded-xl">
      {/* Sliding Background Pill */}
      <motion.div
        className="absolute top-1 bottom-1 bg-background rounded-lg shadow-sm border border-border/50"
        initial={false}
        animate={{
          x: activeIndex * 100,
          width: 96,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ left: 4 }}
      />

      {/* Tab Buttons */}
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative z-10 flex items-center gap-1.5 px-4 py-2 w-24 justify-center text-sm font-medium transition-colors duration-200 rounded-lg ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            whileHover={{ scale: isActive ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={`transition-colors duration-200 ${isActive ? "text-primary" : ""}`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
