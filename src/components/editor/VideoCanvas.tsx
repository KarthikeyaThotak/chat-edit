import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useVideoContext } from "@/hooks/useVideoContext";

interface TimelineBlock {
  id: string;
  type: "video" | "cut";
  start: number;
  width: number;
  label: string;
}

const mockBlocks: TimelineBlock[] = [
  { id: "1", type: "video", start: 0, width: 15, label: "Intro" },
  { id: "2", type: "cut", start: 15, width: 3, label: "Cut" },
  { id: "3", type: "video", start: 18, width: 25, label: "Main Content" },
  { id: "4", type: "cut", start: 43, width: 2, label: "Cut" },
  { id: "5", type: "video", start: 45, width: 20, label: "B-Roll" },
  { id: "6", type: "video", start: 65, width: 18, label: "Interview" },
  { id: "7", type: "cut", start: 83, width: 2, label: "Cut" },
  { id: "8", type: "video", start: 85, width: 15, label: "Outro" },
];

const VideoCanvas = () => {
  const { uploadedFile, videoMetadata, setVideoMetadata } = useVideoContext();
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const hideIconTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- NEW: Helper function to load the video from the backend ---
  const loadRemoteVideo = (id: string) => {
    const remoteUrl = `https://api.pixelcut.shop/download/${id}?t=${Date.now()}`;
    setVideoUrl(remoteUrl);

    const tempVideo = document.createElement("video");
    tempVideo.onloadedmetadata = () => {
      setDuration(tempVideo.duration);
      setVideoMetadata({
        duration: tempVideo.duration,
        width: tempVideo.videoWidth,
        height: tempVideo.videoHeight,
      });
    };
    tempVideo.src = remoteUrl;
  };

  // --- NEW: Effect to listen for the "videoUpdated" signal from AIChat.tsx ---
  useEffect(() => {
    const handleVideoUpdate = () => {
      const videoId = localStorage.getItem("drafft_video_id");
      if (videoId) {
        loadRemoteVideo(videoId);
      }
    };

    window.addEventListener("videoUpdated", handleVideoUpdate);
    return () => window.removeEventListener("videoUpdated", handleVideoUpdate);
  }, []);

  // Updated Effect: Handles initial upload AND existing session recovery
  useEffect(() => {
    const existingId = localStorage.getItem("drafft_video_id");
    
    // If we already have a processed ID, use it. Otherwise, use the local file.
    if (existingId) {
      loadRemoteVideo(existingId);
      return;
    }

    if (!uploadedFile) {
      setDuration(0);
      setVideoMetadata(null);
      setVideoUrl(null);
      return;
    }

    const url = URL.createObjectURL(uploadedFile);
    setVideoUrl(url);
    
    const tempVideo = document.createElement("video");
    tempVideo.crossOrigin = "anonymous";
    
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

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadedFile, setVideoMetadata]);

  // Sync playhead with video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;

    const updatePlayhead = () => {
      if (video.duration > 0) {
        setPlayheadPosition((video.currentTime / video.duration) * 100);
      }
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch(err => console.error("Play error:", err));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowPlayPauseIcon(true);
    
    if (hideIconTimeoutRef.current) {
      clearTimeout(hideIconTimeoutRef.current);
    }
    
    hideIconTimeoutRef.current = setTimeout(() => {
      setShowPlayPauseIcon(false);
    }, 1000);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (videoRef.current) {
      handlePlayPause();
    }
  };

  const handleSeek = (newPosition: number) => {
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (newPosition / 100) * duration;
      setPlayheadPosition(newPosition);
    }
  };

  const handleTimelineSeek = (newPosition: number) => {
    handleSeek(newPosition);
  };

  const currentTime = (playheadPosition / 100) * duration;
  const endTime = duration;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Video Player - Premium Design */}
      <div className="flex-1 relative group">
        {/* Hover Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Main Video Container */}
        <div className="relative h-full bg-foreground rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoUrl || undefined}
            className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
            onTimeUpdate={() => {
              if (videoRef.current && duration > 0) {
                setPlayheadPosition((videoRef.current.currentTime / duration) * 100);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            onClick={handleVideoClick}
          />

          {/* Video Placeholder Fallback */}
          {!videoUrl && <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/90" />}

          {/* Play/Pause Icon Overlay */}
          {showPlayPauseIcon && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 1, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                animate={{ opacity: [1, 0.5] }}
                transition={{ duration: 1 }}
              >
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Scanlines Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
            }}
          />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                <span className="text-xs font-mono text-white/90">{formatTime(currentTime)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                <span className="text-xs font-mono text-white/90">{formatTime(endTime)}</span>
              </div>
            </div>
          </div>

          {/* (Removed center play/pause overlay per UX request) */}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
            {/* Progress Bar */}
            <div className="px-4 pt-4">
              <div className="relative h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setPlayheadPosition((x / rect.width) * 100);
                }}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all"
                  style={{ width: `${playheadPosition}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `${playheadPosition}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="p-4 flex items-center justify-between">
              {/* Left control buttons removed per request (forward/back/other) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/20 backdrop-blur-md border border-success/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-success-pulse absolute inline-flex h-full w-full rounded-full bg-success"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  <span className="text-xs text-success font-semibold">AI Processing</span>
                </div>
                {/* Volume control + upload + proceed */}
                <div className="relative flex items-center gap-2">
                  <button
                    onClick={() => setShowVolume((s) => !s)}
                    className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <path d="M19 9a5 5 0 0 1 0 6" />
                    </svg>
                  </button>
                  {showVolume && (
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(volume * 100)}
                      onChange={(e) => {
                        const v = Number(e.target.value) / 100;
                        setVolume(v);
                        if (videoRef.current) videoRef.current.volume = v;
                      }}
                      className="w-28 ml-2"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default VideoCanvas;
