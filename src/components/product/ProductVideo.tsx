import { useEffect, useRef, useState } from 'react';
import { Captions, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import './ProductVideo.css';

interface ProductVideoProps {
  videoUrl: string;
  title?: string | null;
  caption?: string | null;
  subtitle?: string | null;
  subtitleText?: string | null;
  subtitleUrl?: string | null;
  thumbnail?: string | null;
  autoPlay?: boolean;
  initialTime?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onProgress?: (seconds: number, duration: number) => void;
}

export function ProductVideo({
  videoUrl,
  title,
  caption,
  subtitle,
  subtitleText,
  subtitleUrl,
  thumbnail,
  autoPlay = false,
  initialTime = 0,
  onStart,
  onComplete,
  onProgress,
}: ProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaption, setShowCaption] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const clearControlsTimer = () => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
  };

  const revealControls = () => {
    setShowControls(true);
    clearControlsTimer();
    if (playing && !fullscreen) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => () => clearControlsTimer(), []);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setCurrentTime(0);
    setStarted(false);
    setCompleted(false);
    setLoading(true);
    setError(null);
    setShowCaption(true);
    setShowControls(true);
    lastProgressRef.current = 0;
    clearControlsTimer();
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(initialTime) || initialTime <= 0) return;
    const seek = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(initialTime, Math.max(0, video.duration - 0.5));
      }
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
    return () => video.removeEventListener('loadedmetadata', seek);
  }, [initialTime, videoUrl]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!autoPlay || !videoRef.current) return;
    void videoRef.current.play().catch(() => undefined);
  }, [autoPlay, videoUrl]);

  if (!videoUrl) return null;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try { await video.play(); }
      catch { setError('Não foi possível reproduzir o vídeo.'); }
    } else video.pause();
    revealControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    revealControls();
  };

  const seek = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const next = Math.max(0, Math.min(100, value[0] ?? 0));
    video.currentTime = (next / 100) * video.duration;
    revealControls();
  };

  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch { setError('Não foi possível abrir a tela cheia.'); }
    revealControls();
  };

  const toggleCaptions = () => {
    const nextVisible = !showCaption;
    setShowCaption(nextVisible);
    const video = videoRef.current;
    if (video) Array.from(video.textTracks).forEach((track) => { track.mode = nextVisible ? 'showing' : 'hidden'; });
    revealControls();
  };

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); void togglePlay(); }
    else if (event.key === 'm') { event.preventDefault(); toggleMute(); }
    else if (event.key === 'f') { event.preventDefault(); void toggleFullscreen(); }
    else if (event.key === 'c' && (caption || subtitleUrl || subtitleText)) { event.preventDefault(); toggleCaptions(); }
  };

  const transcript = subtitleText?.trim() || subtitle?.trim() || '';

  return (
    <div className="product-video-premium">
      <div
        ref={stageRef}
        className="product-video-stage"
        tabIndex={0}
        role="region"
        aria-label={title ? `Player de vídeo: ${title}` : 'Player de vídeo'}
        onMouseMove={revealControls}
        onTouchStart={revealControls}
        onKeyDown={handleStageKeyDown}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnail || undefined}
          className="product-video-element"
          playsInline
          muted={muted}
          preload="metadata"
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (!video) return;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
            setLoading(false);
            setError(null);
          }}
          onCanPlay={() => setLoading(false)}
          onPlay={() => {
            setPlaying(true);
            setError(null);
            revealControls();
            if (!started) { setStarted(true); onStart?.(); }
          }}
          onPause={() => { setPlaying(false); setShowControls(true); clearControlsTimer(); }}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
            const nextTime = video.currentTime;
            const ratio = nextTime / video.duration;
            setCurrentTime(nextTime);
            setDuration(video.duration);
            setProgress(Math.max(0, Math.min(100, ratio * 100)));
            if (onProgress && nextTime - lastProgressRef.current >= 5) {
              lastProgressRef.current = nextTime;
              onProgress(nextTime, video.duration);
            }
            if (!completed && ratio >= 0.9) { setCompleted(true); onComplete?.(); }
          }}
          onEnded={() => {
            const video = videoRef.current;
            setPlaying(false);
            setProgress(100);
            setCurrentTime(Number.isFinite(video?.duration) ? video!.duration : currentTime);
            setShowControls(true);
            clearControlsTimer();
            if (onProgress && video) onProgress(video.currentTime, video.duration);
          }}
          onError={() => { setLoading(false); setError('Erro ao carregar vídeo.'); }}
          onClick={() => void togglePlay()}
        >
          {subtitleUrl && (
            <track kind="subtitles" src={subtitleUrl} srcLang="pt-BR" label="Português" default={showCaption} />
          )}
        </video>

        {loading && !error && (
          <div className="product-video-status" role="status"><span className="product-video-spinner" aria-hidden="true" /><span>Carregando vídeo...</span></div>
        )}
        {error && (
          <div className="product-video-status product-video-error" role="alert"><span aria-hidden="true">⚠️</span><span>{error}</span></div>
        )}
        {caption && showCaption && !loading && !error && (
          <div className="product-video-caption-overlay" aria-hidden="true">{caption}</div>
        )}
        {!playing && !loading && !error && (
          <button type="button" onClick={() => void togglePlay()} aria-label="Reproduzir vídeo" className="product-video-play">
            <Play className="h-8 w-8 fill-current" />
          </button>
        )}

        {!loading && !error && (
          <div className={`product-video-controls ${showControls ? 'is-visible' : 'is-hidden'}`}>
            <div className="product-video-controls-top">
              {title && <span className="product-video-title">{title}</span>}
              {(caption || subtitleUrl || transcript) && (
                <Button type="button" variant="ghost" size="icon" onClick={toggleCaptions} aria-label={showCaption ? 'Ocultar legendas' : 'Mostrar legendas'} className={showCaption ? 'text-primary hover:bg-white/10' : 'text-white/70 hover:bg-white/10'}>
                  <Captions />
                </Button>
              )}
            </div>
            <Slider value={[progress]} max={100} step={0.1} onValueChange={seek} aria-label="Progresso do vídeo" className="product-video-progress" />
            <div className="product-video-actions">
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => void togglePlay()} aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'} className="text-white hover:bg-white/15">{playing ? <Pause /> : <Play />}</Button>
                <Button type="button" variant="ghost" size="icon" onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar vídeo'} className="text-white hover:bg-white/15">{muted ? <VolumeX /> : <Volume2 />}</Button>
                <span className="product-video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'} className="text-white hover:bg-white/15">{fullscreen ? <Minimize /> : <Maximize />}</Button>
            </div>
          </div>
        )}
      </div>

      {(title || caption || transcript) && (
        <div className="product-video-caption">
          <div>
            {title && <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>}
            {caption && <p className="mt-1 text-sm font-semibold leading-relaxed">{caption}</p>}
            {transcript && <p className="mt-1 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{transcript}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
