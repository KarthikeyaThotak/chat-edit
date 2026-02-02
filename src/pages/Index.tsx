import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import LobbyTab from "@/components/LobbyTab";
import EditorTab from "@/components/EditorTab";
import GalleryTab from "@/components/GalleryTab";
import { useVideoContext } from "@/hooks/useVideoContext";

type TabType = "lobby" | "editor" | "studio";

const Index = () => {
  const { activeTab, setActiveTab } = useVideoContext();
  const [localTab, setLocalTab] = useState<TabType>("lobby");

  // Sync local state with context
  useEffect(() => {
    setLocalTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setLocalTab(tab);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* The Horizon - Global Navbar */}
      <Navbar activeTab={localTab} onTabChange={handleTabChange} />

      {/* Main Stage */}
      <main>
        <AnimatePresence mode="wait">
          {localTab === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <LobbyTab />
            </motion.div>
          )}
          {localTab === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <EditorTab />
            </motion.div>
          )}
          {localTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <GalleryTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
