import { useEffect, useRef, useState } from 'react';
import { Captions, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import './ProductVideo.css';

interface ProductVideoProps {
  videoUrl: string;
  title?: string | null;
  caption?: string | null;
  subtitle?: string | null;
  subtitleUrl?: string | null;
  thumbnail?: string | null;
  initialTime?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onProgress?: (seconds: number, duration: number) => void;
}

export function ProductVideo({ videoUrl, title, caption, subtitle, subtitleUrl, thumbnail, initialTime = 0, onStart, onComplete, onProgress }: ProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastProgressRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setPlaying(false); setProgress(0); setStarted(false); setCompleted(false); lastProgressRef.current = 0;
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(initialTime) || initialTime <= 0) return;
    const seek = () => { if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(initialTime, Math.max(0, video.duration - 0.5)); };
    if (video.readyState >= 1) seek(); else video.addEventListener('loadedmetadata', seek, { once: true });
    return () => video.removeEventListener('loadedmetadata', seek);
  }, [initialTime, videoUrl]);

  if (!videoUrl) return null;

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { try { await video.play(); } catch { return; } } else video.pause();
  };
  const toggleMute = () => { const video = videoRef.current; if (!video) return; video.muted = !video.muted; setMuted(video.muted); };
  const seek = (value: number[]) => { const video = videoRef.current; if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return; video.currentTime = ((value[0] ?? 0) / 100) * video.duration; };
  const fullscreen = async () => { const video = videoRef.current; if (!video) return; if (document.fullscreenElement) await document.exitFullscreen(); else await video.requestFullscreen?.(); };

  return (
    <div className="product-video-premium">
      <div className="product-video-stage">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnail || undefined}
          className="product-video-element"
          playsInline
          muted={muted}
          preload="metadata"
          onPlay={() => { setPlaying(true); if (!started) { setStarted(true); onStart?.(); } }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
            const ratio = video.currentTime / video.duration;
            setProgress(ratio * 100);
            if (onProgress && video.currentTime - lastProgressRef.current >= 5) { lastProgressRef.current = video.currentTime; onProgress(video.currentTime, video.duration); }
            if (!completed && ratio >= 0.9) { setCompleted(true); onComplete?.(); }
          }}
          onEnded={() => { setPlaying(false); if (onProgress && videoRef.current) onProgress(videoRef.current.currentTime, videoRef.current.duration); }}
          onClick={() => void togglePlay()}
        >
          {subtitleUrl && <track kind="subtitles" src={subtitleUrl} label="Português" default />}
        </video>
        {!playing && <button type="button" onClick={() => void togglePlay()} aria-label="Reproduzir vídeo" className="product-video-play"><Play className="h-8 w-8 fill-current" /></button>}
        <div className="product-video-controls">
          <Slider value={[progress]} max={100} step={0.1} onValueChange={seek} aria-label="Progresso do vídeo" />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => void togglePlay()} className="text-white hover:bg-white/15">{playing ? <Pause /> : <Play />}</Button>
              <Button type="button" variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/15">{muted ? <VolumeX /> : <Volume2 />}</Button>
              {subtitleUrl && <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 text-[10px] font-black uppercase text-white"><Captions className="h-3.5 w-3.5" />CC</span>}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => void fullscreen()} className="text-white hover:bg-white/15" aria-label="Tela cheia"><Maximize /></Button>
          </div>
        </div>
      </div>
      {(title || caption || subtitle) && <div className="product-video-caption"><div>{title && <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>}{caption && <p className="mt-1 text-sm font-semibold leading-relaxed">{caption}</p>}{subtitle && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}</div></div>}
    </div>
  );
}
