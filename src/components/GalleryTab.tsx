import { useState, useEffect } from "react"; // Added useEffect
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useVideoContext } from "@/hooks/useVideoContext";

const developers = [
  { name: "Chanuth Jayatissa", avatar: "/placeholder.svg" },
  { name: "Karthikeya Thota", avatar: "/placeholder.svg" },
  { name: "Ahmad Hashmi", avatar: "/placeholder.svg" },
  { name: "Saad Ahmad", avatar: "/placeholder.svg" },
];

const GalleryTab = () => {
  const { setActiveTab } = useVideoContext();
  const [selectedFormat, setSelectedFormat] = useState("MP4");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  
  // --- LOGIC FOR VIDEO AND DOWNLOAD ---
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const videoId = localStorage.getItem("drafft_video_id");
    if (videoId) {
      // Using the same endpoint as the editor
      setVideoUrl(`http://localhost:8000/download/${videoId}`);
    }
  }, []);

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = "my-ai-video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  // ------------------------------------

  const stats = [
    { label: "Time Saved", value: "42.5", unit: "sec", trend: "+18%", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )},
    { label: "Smart Cuts", value: "14", unit: "edits", trend: "Auto", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    )},
    { label: "Transitions", value: "8", unit: "applied", trend: "Smooth", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    )},
    { label: "Audio Enhanced", value: "3", unit: "tracks", trend: "Clear", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    )},
  ];

  const formats = ["MP4", "MOV", "WEBM"];
  const qualities = ["4K", "1080p", "720p"];

  const waveformBars = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    height: Math.sin(i * 0.3) * 30 + Math.random() * 20 + 10,
  }));

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8 overflow-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.03] blur-[100px]" />
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[80px] bottom-0 right-0"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 border border-success/20 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          >
            <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Your video is ready</h1>
          <p className="mt-2 text-muted-foreground text-sm">AI processing complete • 14 optimizations applied</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div 
            className="lg:col-span-3 flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-indigo-500/30 to-primary/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-foreground border border-border/50 shadow-2xl">
                {/* VIDEO INTEGRATION: Replace static background with actual video if ready */}
                {videoUrl ? (
                  <video 
                    src={videoUrl} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    controls
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 flex items-center justify-center">
                      <p className="text-muted-foreground animate-pulse">Fetching video...</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
                    {formats.map((format) => (
                      <button key={format} onClick={() => setSelectedFormat(format)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedFormat === format ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{format}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
                    {qualities.map((quality) => (
                      <button key={quality} onClick={() => setSelectedQuality(quality)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedQuality === quality ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{quality}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                    Share
                  </Button>
                  
                  {/* ATTACHED handleDownload HERE */}
                  <Button size="sm" className="shadow-glow" onClick={handleDownload}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Rest of the Credits UI stays the same */}
            <div className="my-auto py-6 px-8 rounded-3xl bg-gradient-to-br from-secondary/40 via-secondary/20 to-transparent backdrop-blur-sm border border-border/30 shadow-lg">
              <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest text-center mb-5">Crafted by</p>
              <div className="flex items-center justify-center gap-8">
                {developers.map((dev, index) => (
                  <motion.div key={index} className="flex flex-col items-center gap-2 group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 * index }}>
                    <Avatar className="h-14 w-14 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300 relative"><AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-secondary to-secondary/50">{dev.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                    <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-300">{dev.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar - Remains exactly as provided */}
          <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Processing Results</h3>
              <div className="space-y-3">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">{stat.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1"><span className="text-xl font-bold text-foreground">{stat.value}</span><span className="text-xs text-muted-foreground">{stat.unit}</span></div>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-3"><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</h3></div>
              <div className="h-12 flex items-center justify-between mb-3 p-3 rounded-xl bg-background/50 border border-border/30">
                {waveformBars.map((bar, i) => (
                  <motion.div key={bar.id} className="w-[3px] bg-primary/60 rounded-full" animate={{ height: [bar.height * 0.2, bar.height * 0.7, bar.height * 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.02, ease: "easeInOut" }} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">Excellent pacing detected. Applied 14 intelligent cuts at natural transition points.</p>
            </div>

            <motion.button className="w-full p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group" whileHover={{ scale: 1.01 }} onClick={() => setActiveTab("lobby")}>
              <div className="w-10 h-10 rounded-xl bg-secondary/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-primary transition-colors"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></div>
              <div className="text-left"><p className="text-sm font-medium text-foreground">Start New Project</p></div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GalleryTab;