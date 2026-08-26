import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";

export interface VideoCardProps {
  title?: string;
  thumbnail?: string;
  isLoading?: boolean;
  scheduledFor?: string | null;
}

export function VideoCard({ title, thumbnail, isLoading, scheduledFor }: VideoCardProps) {
  if (isLoading) {
    return <Skeleton className="aspect-[9/16] rounded-2xl w-full" />;
  }

  return (
    <Card className="relative aspect-[9/16] overflow-hidden rounded-2xl group border-none cursor-pointer">
      <img 
        src={thumbnail} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
          <Play className="text-white fill-white w-6 h-6 ml-1" />
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white font-medium text-sm line-clamp-2">{title}</h3>
      </div>
      
      {scheduledFor && new Date(scheduledFor) > new Date() && (
        <div className="absolute top-4 left-4 z-30">
          <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xl">
            <Timer className="w-3 h-3" />
            Premiere: <Countdown targetDate={scheduledFor} />
          </Badge>
        </div>
      )}
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";
import { useState, useEffect } from "react";

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(targetDate).getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft("LIVE");
        clearInterval(timer);
        return;
      }
      
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
}
