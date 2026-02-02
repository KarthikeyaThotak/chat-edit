import { motion } from "framer-motion";
import AIChat from "./editor/AIChat";
import VideoCanvas from "./editor/VideoCanvas";
import OperationQueue from "./editor/OperationQueue";

const EditorTab = () => {
  return (
    <div className="h-screen pt-20 pb-4 px-4 overflow-hidden">
      <div className="h-full flex gap-3">
        {/* Left Panel - AI Liaison */}
        <motion.div 
          className="w-[280px] flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AIChat />
        </motion.div>

        {/* Center Panel - Canvas */}
        <motion.div 
          className="flex-1 min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <VideoCanvas />
        </motion.div>

        {/* Right Panel - Operation Queue */}
        <motion.div 
          className="w-[280px] flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <OperationQueue />
        </motion.div>
      </div>
    </div>
  );
};

export default EditorTab;
