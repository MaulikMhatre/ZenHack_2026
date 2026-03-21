"use client";

import React, { useEffect, useState } from 'react';
import { Lightbulb, ShieldAlert, TrendingUp, Zap } from 'lucide-react';

interface Insight {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  impact: string;
}

import { endpoints } from '@/utils/api';

const SmartInsights = ({ isSimulating }: { isSimulating: boolean }) => {
  const [insights, setInsights] = useState<Insight[]>([]);

  const fetchInsights = async () => {
    try {
      const res = await fetch(endpoints.insights);
      const data = await res.json();
      setInsights(data.suggestions);
    } catch (e) {
      console.error("AI Insights failed to load", e);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${
      isSimulating 
        ? 'bg-slate-900/50 border-red-900/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]' 
        : 'bg-white border-slate-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-500" />
          AI Decision Support
        </h3>
        {insights.length > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
        )}
      </div>

      <div className="space-y-4">
        {insights.length > 0 ? (
          insights.map((item, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-2xl border-l-4 transition-all animate-in fade-in slide-in-from-right-4 duration-500 ${
                item.priority === 'HIGH' 
                  ? 'bg-red-500/10 border-red-500' 
                  : 'bg-indigo-500/10 border-indigo-500'
              }`}
            >
              <div className="flex items-start gap-3">
                {item.priority === 'HIGH' ? (
                  <ShieldAlert className="text-red-500 shrink-0" size={18} />
                ) : (
                  <TrendingUp className="text-indigo-500 shrink-0" size={18} />
                )}
                <div>
                  <p className={`text-sm font-bold leading-tight ${isSimulating ? 'text-white' : 'text-slate-800'}`}>
                    {item.message}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                      item.priority === 'HIGH' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'
                    }`}>
                      {item.impact}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <div className={`text-xs font-medium italic ${isSimulating ? 'text-slate-500' : 'text-slate-400'}`}>
              Analyzing hospital flow... <br /> Systems currently optimal.
            </div>
          </div>
        )}

        {/* Dynamic Simulation Message */}
        {isSimulating && insights.length === 0 && (
          <div className="p-4 bg-red-600 rounded-2xl text-white flex items-center gap-3 animate-pulse">
            <Zap size={20} fill="white" />
            <p className="text-xs font-black uppercase italic">Simulating High Volume: Predictive Engine recalibrating...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartInsights;