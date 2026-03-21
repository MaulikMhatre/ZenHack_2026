"use client";
import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle, ShieldCheck } from 'lucide-react';

import { endpoints } from '@/utils/api';

export const SurgeIntelligence = () => {
  const [surge, setSurge] = useState<any>(null);

  useEffect(() => {
    const fetchSurge = async () => {
      const res = await fetch(endpoints.timeToCapacity);
      const data = await res.json();
      setSurge(data);
    };
    fetchSurge();
    const inv = setInterval(fetchSurge, 30000);
    return () => clearInterval(inv);
  }, []);

  if (!surge) return null;

  const isCritical = surge.status === "CRITICAL";

  return (
    <div className={`p-6 rounded-2xl border-2 transition-all ${isCritical ? 'bg-red-950 border-red-500 animate-pulse' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Timer className={isCritical ? 'text-red-500' : 'text-indigo-400'} />
          TIME-TO-CAPACITY
        </h3>
        {isCritical ? <AlertTriangle className="text-red-500" /> : <ShieldCheck className="text-emerald-500" />}
      </div>

      <div className="text-center py-4">
        {surge.minutes_remaining > 0 ? (
          <>
            <p className="text-5xl font-black text-white">{surge.minutes_remaining}<span className="text-lg ml-1">min</span></p>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">Until Total Saturation</p>
          </>
        ) : (
          <p className="text-2xl font-black text-emerald-400 uppercase">System Stable</p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex justify-between text-[10px] font-bold uppercase">
          <span className="text-slate-500">Arrival Velocity</span>
          <span className="text-white">{surge.hourly_arrival_velocity} pts/hr</span>
        </div>
      </div>
    </div>
  );
};