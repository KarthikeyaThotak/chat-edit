import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useVideoContext } from "@/hooks/useVideoContext";

interface Operation {
  id: string;
  name: string;
  timestamps: string;
  status: "pending" | "processing" | "complete";
  icon: string;
}

const OperationQueue = () => {
  const { setActiveTab } = useVideoContext();
  
  // Start with an initial analysis record
  const [operations, setOperations] = useState<Operation[]>([
    { 
      id: "init", 
      name: "Initial Analysis", 
      timestamps: "Full Video", 
      status: "complete", 
      icon: "🔍" 
    }
  ]);

  useEffect(() => {
    // Listen for the custom event dispatched from AIChat.tsx
    const handleNewOperation = (event: any) => {
      const { name, timestamp } = event.detail || {};
      
      const newOp: Operation = {
        id: Date.now().toString(),
        name: name || "AI Edit",
        timestamps: timestamp || "Applied",
        status: "complete",
        icon: "✨"
      };

      // We add the newest operation to the beginning of the array
      setOperations(prev => [newOp, ...prev]);
    };

    window.addEventListener("videoUpdated", handleNewOperation);
    return () => window.removeEventListener("videoUpdated", handleNewOperation);
  }, []);

  const completedCount = operations.filter(o => o.status === "complete").length;
  const totalCount = operations.length;

  const handleFinishProject = () => {
    // Navigate to the gallery/studio page
    setActiveTab("studio");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-secondary/30 to-secondary/10 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Operations</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {completedCount}/{totalCount} completed
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Operations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {operations.map((operation) => (
            <motion.div
              key={operation.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-3 rounded-xl transition-all border border-border/30 bg-background/50 group hover:border-border/60 hover:bg-background/80"
            >
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-success/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {operation.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {operation.timestamps}
                  </p>
                </div>

                <div className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-muted-foreground italic">Saved</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer / Finish Action */}
      <div className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <Button 
          className="w-full shadow-glow bg-primary hover:bg-primary/90 text-primary-foreground" 
          size="lg"
          onClick={handleFinishProject}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Export Final Video
        </Button>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Edits will be finalized in your Studio
        </p>
      </div>
    </div>
  );
};

export default OperationQueue;