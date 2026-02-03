import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: string;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      type: "ai",
      content: "Video analyzed and ready for edits. What would you like me to do?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // 1. Get video_id from storage
    const videoId = localStorage.getItem("drafft_video_id");
    if (!videoId) {
      alert("No active video session found. Please upload a video first.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // 2. Send request to backend
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_id: parseInt(videoId),
          message: currentInput,
        }),
      });

      if (!response.ok) throw new Error("Failed to reach AI Assistant");

      const data = await response.json();

      if (data.video_id) {
        // 1. Update storage
        localStorage.setItem("drafft_video_id", data.video_id.toString());
        
        // 2. Find the text to use as the operation name
        const aiText = data.response.find((r: any) => r.type === "text")?.text || "Video Edit";

        // 3. Dispatch a CUSTOM event so OperationQueue gets the name and status
        window.dispatchEvent(new CustomEvent("videoUpdated", {
          detail: { 
            name: aiText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        }));
      }

      // 3. Parse the specific "response" -> text structure
      // Note: Backend returns an array of response objects
      if (data.response && data.response.length > 0) {
        const aiText = data.response.find((r: any) => r.type === "text")?.text || "Action completed.";
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Sorry, I encountered an error connecting to the server.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-secondary/30 to-secondary/10 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-500 animate-bounce" : "bg-emerald-500"} `} />
              <span className="text-[10px] text-muted-foreground">{isLoading ? "Thinking..." : "Online"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[90%] px-3 py-2 text-[13px] leading-relaxed ${
              message.type === "user" 
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" 
                : "bg-background border border-border/50 text-foreground rounded-2xl rounded-bl-md shadow-sm"
            }`}>
              <p>{message.content}</p>
              <p className={`text-[10px] mt-1.5 ${message.type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {message.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl border border-border/50 focus-within:border-primary/50 transition-colors"
        >
          <span className="text-primary text-sm">›</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "AI is processing..." : "Ask AI anything..."}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <motion.button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-50 disabled:grayscale"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-foreground">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;