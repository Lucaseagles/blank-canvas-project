import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

interface PremiumErrorProps {
  title?: string;
  message?: string;
  reset?: () => void;
  isNotFound?: boolean;
}

export function PremiumError({ 
  title = "System Anomaly", 
  message = "Our discovery engines encountered an unexpected signal interference.", 
  reset,
  isNotFound = false 
}: PremiumErrorProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8 relative">
        {/* Abstract Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-glass border border-glass-border backdrop-blur-xl mb-4">
            <ShieldAlert className="w-12 h-12 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
            {isNotFound ? "404" : "ERROR"} <br />
            <span className="text-primary">{title}</span>
          </h1>
          
          <p className="text-xl text-muted-foreground font-medium tracking-tight max-w-md mx-auto">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          {reset && (
            <Button 
              onClick={reset}
              variant="outline"
              className="h-14 px-8 rounded-2xl border-glass-border bg-glass backdrop-blur-xl font-black uppercase tracking-tighter hover:bg-primary hover:text-primary-foreground transition-all gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Recalibrate
            </Button>
          )}
          
          <Link to="/">
            <Button 
              className="h-14 px-8 rounded-2xl font-black uppercase tracking-tighter shadow-2xl shadow-primary/20 gap-2 w-full sm:w-auto"
            >
              <Home className="w-5 h-5" />
              Return to Base
            </Button>
          </Link>
        </div>

        <div className="pt-12 flex items-center justify-center gap-2 opacity-30">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Status: Sentinel Active</span>
        </div>
      </div>
    </div>
  );
}
