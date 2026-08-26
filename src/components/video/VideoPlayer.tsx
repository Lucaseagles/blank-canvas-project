import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  muted = true,
  loop = true,
  onEnded,
  onStart,
  onComplete,
  onTimeUpdate
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible && autoPlay) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
        setProgress((currentTime / duration) * 100);
        
        // Tracking: Start
        if (!started && currentTime > 0) {
          setStarted(true);
          onStart?.();
        }

        // Tracking: Complete (90%+)
        if (!completed && (currentTime / duration) >= 0.9) {
          setCompleted(true);
          onComplete?.();
        }

        onTimeUpdate?.(currentTime, duration);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (video && value.length > 0) {
      const duration = video.duration;
      if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
        const val = value[0] ?? 0;
        const time = (val / 100) * duration;
        video.currentTime = time;
        setProgress(val);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden group border border-glass-border shadow-2xl transition-all duration-500",
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop={loop}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onClick={togglePlay}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Controls (always visible on touch devices) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white pointer-events-auto"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white pointer-events-auto"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white pointer-events-auto"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>

        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer pointer-events-auto"
        />
      </div>

      {/* Big Play Button when paused */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-xl flex items-center justify-center border border-primary/30 text-white shadow-2xl scale-100 hover:scale-110 transition-transform animate-pulse-gentle">
            <Play className="w-10 h-10 fill-current ml-1.5" />
          </div>
        </div>
      )}
    </div>
  );
}