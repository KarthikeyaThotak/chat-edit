import { createContext, useContext, useState, ReactNode } from "react";

interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
}

interface VideoContextType {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  videoMetadata: VideoMetadata | null;
  setVideoMetadata: (metadata: VideoMetadata | null) => void;
  activeTab: "lobby" | "editor" | "studio";
  setActiveTab: (tab: "lobby" | "editor" | "studio") => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<"lobby" | "editor" | "studio">("lobby");

  return (
    <VideoContext.Provider
      value={{
        uploadedFile,
        setUploadedFile,
        videoMetadata,
        setVideoMetadata,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideoContext must be used within VideoProvider");
  }
  return context;
};
