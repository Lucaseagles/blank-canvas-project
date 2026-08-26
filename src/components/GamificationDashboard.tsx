import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Target, Flame, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GamificationDashboardProps {
  points: number;
  streak: number;
  badges: any[];
  missions: any[];
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  points,
  streak,
  badges,
  missions
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-white/5 border-white/10 backdrop-blur-md flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Points</p>
            <p className="text-xl font-bold font-mono">{points}</p>
          </div>
        </Card>
        
        <Card className="p-4 bg-white/5 border-white/10 backdrop-blur-md flex items-center space-x-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
            <p className="text-xl font-bold font-mono">{streak}d</p>
          </div>
        </Card>
      </div>

      {/* Active Missions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Active Missions
          </h3>
          <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">
            Earn Points
          </Badge>
        </div>
        
        <div className="space-y-2">
          {missions.length > 0 ? missions.map((mission, idx) => (
            <Card key={idx} className="p-3 bg-white/5 border-white/10 overflow-hidden relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">{mission.title}</p>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">+{mission.reward_points}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Points</p>
                </div>
              </div>
              
              {/* Simplified Progress */}
              <div className="space-y-1">
                <Progress value={40} className="h-1 bg-white/5" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progress</span>
                  <span>40%</span>
                </div>
              </div>
            </Card>
          )) : (
            <p className="text-xs text-center py-4 text-muted-foreground border border-dashed border-white/10 rounded-lg">
              No active missions. Check back soon!
            </p>
          )}
        </div>
      </div>

      {/* Badges/Achievements */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Earned Badges
        </h3>
        
        <div className="grid grid-cols-4 gap-2">
          {badges.length > 0 ? badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group relative cursor-help">
                <Trophy className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 p-2 bg-black border border-white/10 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="font-bold">{badge.name}</p>
                  <p className="text-muted-foreground">{badge.description}</p>
                </div>
              </div>
              <span className="text-[10px] text-center truncate w-full">{badge.name}</span>
            </div>
          )) : (
            <div className="col-span-4 flex flex-col items-center py-4 border border-dashed border-white/10 rounded-lg">
              <p className="text-[10px] text-muted-foreground">Unlock your first badge!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
