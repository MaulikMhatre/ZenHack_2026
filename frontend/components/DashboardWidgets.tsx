
"use client";

import React from 'react';
import { Truck, Wind, Navigation, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResourceData {
  Ventilators: { total: number; in_use: number };
  Ambulances: { total: number; available: number };
}

interface DashboardWidgetsProps {
  resources: ResourceData;
}

const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ resources }) => {
  if (!resources) return null;

  const ventInUse = resources.Ventilators.in_use;
  const ventTotal = resources.Ventilators.total;
  const ventPerc = Math.round((ventInUse / ventTotal) * 100);
  
  const ambAvailable = resources.Ambulances.available;
  const ambTotal = resources.Ambulances.total;
  const ambActive = ambTotal - ambAvailable;

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      
      {/* VENTILATOR NODE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        // bg-card ensures it stays dark in Dark Mode and turns white in Light Mode
        className="relative bg-card border border-border rounded-[2.5rem] p-8 overflow-hidden group transition-all duration-500 shadow-xl shadow-black/5 dark:shadow-none"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" 
                />
                <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em]">Pneuma-Control</span>
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Ventilation Core</h3>
            </div>
            <motion.div 
              whileHover={{ rotate: 180 }}
              className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400"
            >
              <Wind size={24} />
            </motion.div>
          </div>

          <div className="flex items-center justify-between gap-12">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/10 dark:text-slate-800" />
                <motion.circle
                  cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={301.6}
                  initial={{ strokeDashoffset: 301.6 }}
                  animate={{ strokeDashoffset: 301.6 - (301.6 * ventPerc) / 100 }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={`${ventPerc > 85 ? 'text-rose-500' : 'text-cyan-500'} drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground leading-none">{ventPerc}%</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Load</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-8">
              <div className="border-l-2 border-border pl-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Available</span>
                <span className="text-3xl font-black text-foreground">{ventTotal - ventInUse}</span>
              </div>
              <div className="border-l-2 border-border pl-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Support</span>
                <span className="text-3xl font-black text-muted-foreground/60">{ventInUse}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FLEET STATUS NODE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-card border border-border rounded-[2.5rem] p-8 overflow-hidden group transition-all duration-500 shadow-xl shadow-black/5 dark:shadow-none"
      >
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em]">EMS Grid Control</span>
              </div>
              <h3 className="text-3xl font-black text-foreground tracking-tighter italic uppercase">FLEET STATUS</h3>
            </div>
            <motion.div 
              whileHover={{ y: -5, scale: 1.1 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-500 shadow-lg shadow-emerald-500/5"
            >
              <Truck size={28} />
            </motion.div>
          </div>

          <div className="grid grid-cols-10 gap-2 mb-8">
            {Array.from({ length: ambTotal }).map((_, i) => {
              const isAvailable = i < ambAvailable;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`h-12 rounded-lg border transition-all duration-500 ${
                    isAvailable 
                      ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-muted border-border opacity-20'
                  }`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-3xl bg-muted/30 border border-border flex items-center justify-between transition-all">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Standby</p>
                <p className="text-2xl font-black text-foreground leading-none">{ambAvailable}</p>
              </div>
              <Navigation className="text-emerald-500/40" size={20} />
            </div>
            <div className="p-4 rounded-3xl bg-muted/30 border border-border flex items-center justify-between transition-all">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Missions</p>
                <p className="text-2xl font-black text-foreground leading-none">{ambActive}</p>
              </div>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>
                <Radio className="text-amber-500/40" size={20} />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardWidgets;
