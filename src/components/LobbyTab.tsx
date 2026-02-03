import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, X } from "lucide-react";
import { useVideoContext } from "@/hooks/useVideoContext";
import { API_CONFIG } from "@/config/api";

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const LobbyTab = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUploadedFile, setVideoMetadata, setActiveTab } = useVideoContext();

  // Cleanup blob URL on unmount or when video changes
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file (MP4, MOV, AVI, WebM, MKV)",
        variant: "destructive",
      });
      return;
    }

    // Revoke previous URL if exists
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedVideo(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Update context and extract metadata
    setUploadedFile(file);
    
    // Extract metadata using BLOB URL
    const tempVideo = document.createElement('video');
    tempVideo.crossOrigin = 'anonymous';
    
    tempVideo.onloadedmetadata = () => {
      setDuration(tempVideo.duration);
      setVideoMetadata({
        duration: tempVideo.duration,
        width: tempVideo.videoWidth,
        height: tempVideo.videoHeight,
      });
    };
    
    tempVideo.src = url;
    tempVideo.load();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const clearVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setSelectedVideo(null);
    setVideoUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleProceedToEditor = async () => {
    if (!selectedVideo) return;

    try {
      // Modern AI analyzing toast with spinner + small progress hint
      const aiToast = toast({
        title: (
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.15" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span>AI is analyzing</span>
          </div>
        ) as any,
        description: <span className="text-xs text-muted-foreground">Gemini is scanning speech & actions</span> as any,
      });

      // Pulse the toast every 3s (briefly toggle to re-animate). Will be cleared on completion.
      const aiPulse = setInterval(() => {
        try {
          aiToast.update({ id: aiToast.id, open: false });
          setTimeout(() => aiToast.update({ id: aiToast.id, open: true }), 180);
        } catch (e) {
          // ignore if toast no longer exists
        }
      }, 3000);

      // 1. Local AI Hop
      const aiFormData = new FormData();
      aiFormData.append("video", selectedVideo);

      const aiResponse = await fetch(`${API_CONFIG.TRANSCRIPT_API}/generate-transcript`, {
        method: "POST",
        body: aiFormData,
      });

      if (!aiResponse.ok) {
        aiToast.update({
          id: aiToast.id,
          title: <span>AI analysis failed</span>,
          description: <span className="text-xs text-destructive">Check your local AI service.</span>,
          variant: "destructive",
        } as any);
        throw new Error("AI Engine failed.");
      }
      const transcriptData = await aiResponse.json();

      // Update the AI toast to success before starting sync
      aiToast.update({
        id: aiToast.id,
        title: <span>Analysis complete</span>,
        description: <span className="text-xs text-muted-foreground">Transcript ready — preparing upload</span>,
      } as any);
      clearInterval(aiPulse);

      // 2. Production Sync Hop (modern sync toast)
      const syncToast = toast({
        title: (
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-sky-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.12" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span>Syncing to cloud</span>
          </div>
        ) as any,
        description: <span className="text-xs text-muted-foreground">Uploading to remote storage</span> as any,
      });

      const syncPulse = setInterval(() => {
        try {
          syncToast.update({ id: syncToast.id, open: false });
          setTimeout(() => syncToast.update({ id: syncToast.id, open: true }), 180);
        } catch (e) {}
      }, 3000);

      const finalFormData = new FormData();
      finalFormData.append("video", selectedVideo);
      finalFormData.append("transcript", JSON.stringify(transcriptData));

      const finalResponse = await fetch(`${API_CONFIG.MAIN_API}/upload`, {
        method: "POST",
        body: finalFormData,
      });

      if (!finalResponse.ok) {
        clearInterval(syncPulse);
        let errorMessage = "Remote upload failed.";
        try {
          const errorData = await finalResponse.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${finalResponse.status} ${finalResponse.statusText}`;
        }
        syncToast.update({
          id: syncToast.id,
          title: <span>Sync failed</span>,
          description: <span className="text-xs text-destructive">{errorMessage}</span>,
          variant: "destructive",
        } as any);
        console.error("Upload error:", {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          url: `${API_CONFIG.MAIN_API}/upload`,
        });
        throw new Error(`Production sync failed: ${errorMessage}`);
      }

      const result = await finalResponse.json();
      
      // Store ID for future edit requests
      if (result.video_id) {
        localStorage.setItem("drafft_video_id", result.video_id.toString());
        console.log("Stored video ID:", result.video_id);
      }

      // Final success updates and cleanup
      clearInterval(syncPulse);
      aiToast.dismiss();
      syncToast.dismiss();

      setActiveTab('editor');

    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Please ensure your local AI engine and the backend are online.",
        variant: "destructive",
      });
    }
  };

  const features = [
    { icon: "⚡", label: "Smart Cuts" },
    { icon: "🎨", label: "Color Grade" },
    { icon: "🔊", label: "Audio Clean" },
    { icon: "✨", label: "Auto Effects" },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] overflow-hidden relative pt-20">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-40 -right-32 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-48 rounded-full bg-primary/3 blur-3xl" />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="h-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-6 items-center">
        {/* Left Column - Hero */}
        <motion.div 
          className="z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Next-Gen Video Intelligence</span>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9]">
            <span className="bg-gradient-to-b from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
              Draf
            </span>
            <span className="bg-gradient-to-r from-primary via-primary to-indigo-500 bg-clip-text text-transparent">
              ft
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Transform raw footage into polished content with the power of AI.
          </p>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-5">
            <button 
              onClick={handleBrowseClick}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Browse Files
            </button>

            {videoUrl && (
              <motion.button
                onClick={handleProceedToEditor}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-all animate-confirm-flash"
                aria-label="Confirm and continue"
              >
                Confirm
              </motion.button>
            )}
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50 text-xs"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              >
                <span>{feature.icon}</span>
                <span className="font-medium text-foreground">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Column - Drop Zone or Video Preview */}
        <motion.div
          className={`relative aspect-square max-w-sm mx-auto w-full rounded-[28px] transition-all duration-500 ${
            videoUrl 
              ? "bg-black border border-border/50"
              : isDragging 
                ? "bg-primary/5 border-2 border-primary shadow-glow scale-[1.02]" 
                : "bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={!videoUrl ? { scale: 1.01 } : {}}
        >
          {videoUrl ? (
            /* Video Preview Player */
            <div className="absolute inset-0 flex flex-col">
              {/* Video Element */}
              <div className="flex-1 relative overflow-hidden rounded-t-[28px]">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain bg-black"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnded}
                  onClick={togglePlayPause}
                />
                
                {/* Play/Pause Overlay */}
                <motion.button
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={togglePlayPause}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-16 h-16 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-foreground" />
                    ) : (
                      <Play className="w-6 h-6 text-foreground ml-1" />
                    )}
                  </div>
                </motion.button>

                {/* Close Button */}
                <button
                  onClick={clearVideo}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Controls */}
              <div className="p-4 bg-gradient-to-t from-black/80 to-black/40 rounded-b-[28px]">
                {/* Seek Bar */}
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="mb-3"
                />
                
                {/* Time Display & Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlayPause}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                    )}
                  </button>
                  
                  <div className="text-xs text-white/80 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Drop Zone */
            <>
              {/* Inner Glow */}
              <div className={`absolute inset-0 rounded-[28px] transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-primary/10 to-transparent" />
              </div>

              {/* Animated Rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative w-28 h-28 transition-transform duration-500 ${isDragging ? "scale-110" : ""}`}>
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-primary/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="absolute inset-4 rounded-full border border-primary/30"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="absolute inset-8 rounded-full border border-primary/40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-500"
                    animate={{ 
                      scale: isDragging ? [1, 1.3, 1] : [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: isDragging ? 0.6 : 2, repeat: Infinity }}
                  />
                  <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-primary/50 blur-xl" />
                </div>
              </div>

              {/* Drop Zone Content */}
              <div className="absolute inset-x-0 bottom-6 flex flex-col items-center">
                <motion.div className="text-center" animate={{ y: isDragging ? -3 : 0 }}>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDragging ? "text-primary" : "text-foreground"
                  }`}>
                    {isDragging ? "Release to upload" : "Drop your video here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI up to 4GB</p>
                </motion.div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-border/40 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-border/40 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-border/40 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-border/40 rounded-br-lg" />
            </>
          )}
        </motion.div>
        
        
      </div>
    </div>
  );
};

export default LobbyTab;