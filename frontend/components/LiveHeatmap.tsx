
"use client";

import React from 'react';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeatmapProps {
  occupancy: {
    ER: number;
    ICU: number;
    Surgery: number;
    Wards: number;
  };
  isSimulating?: boolean;
}

const CAPACITY = {
  ER: 60,
  ICU: 20,
  Wards: 100,
  Surgery: 10
};

const LiveHeatmap: React.FC<HeatmapProps> = ({ occupancy, isSimulating }) => {
  const getPercentage = (dept: string, value: number) => {
    const cap = CAPACITY[dept as keyof typeof CAPACITY] || 100;
    return Math.round((value / cap) * 100);
  };

  const getTheme = (percent: number) => {
    if (percent < 60) return {
      bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]'
    };
    if (percent < 85) return {
      bg: 'bg-amber-500/5 dark:bg-amber-500/10',
      border: 'border-amber-500/20 dark:border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]'
    };
    return {
      bg: 'bg-rose-500/5 dark:bg-rose-500/10',
      border: 'border-rose-500/20 dark:border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]'
    };
  };

  return (
    <div className="bg-card backdrop-blur-xl border border-border rounded-[3rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500">
      {/* Dynamic Background Flare */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none opacity-50 dark:opacity-20 transition-all duration-700" />
      
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Live Heatmap</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Real-time Node Saturation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/50 border border-border shadow-sm dark:shadow-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">Live Feed</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        {Object.entries(occupancy).map(([dept, value]) => {
          const percentage = isSimulating ? Math.min(Math.round(value * 1.5), 100) : getPercentage(dept, value);
          const theme = getTheme(percentage);
          const capacity = CAPACITY[dept as keyof typeof CAPACITY] || 100;
          
          return (
            <div 
              key={dept} 
              className={`p-6 rounded-[2rem] border transition-all duration-500 ${theme.bg} ${theme.border} ${theme.glow} hover:-translate-y-1 cursor-default group/card relative overflow-hidden`}
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">Node</span>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{dept}</h3>
                </div>
                {percentage >= 85 ? (
                  <AlertCircle size={16} className="text-rose-500 animate-pulse" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-500 opacity-40" />
                )}
              </div>

              <div className="flex items-end gap-2 mb-4 relative z-10">
                <span className={`text-4xl font-black tracking-tighter ${theme.text}`}>
                  {percentage}%
                </span>
                <span className="text-[10px] font-black text-muted-foreground mb-1.5 uppercase tracking-widest opacity-40">Load</span>
              </div>
              
              <div className="w-full bg-foreground/5 h-2 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={`h-full rounded-full ${theme.bar} shadow-[0_0_12px_currentColor]`} 
                />
              </div>

              <div className="mt-5 pt-4 border-t border-foreground/5 flex justify-between items-center relative z-10">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Capacity Stats</span>
                <span className="text-[11px] font-black font-mono text-foreground/80">
                  {isSimulating ? Math.round(value * 1.2) : value} <span className="opacity-30">/</span> {capacity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveHeatmap;






















