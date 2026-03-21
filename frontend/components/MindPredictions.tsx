"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { endpoints } from '@/utils/api';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const TOTAL_BEDS = 190;

const MindPredictions = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchModel = useCallback(async () => {
    try {
      const res = await fetch(endpoints.predictInflow, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), 
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Heuristic Engine Error:", text.substring(0, 100));
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModel();
    const interval = setInterval(fetchModel, 60000);
    return () => clearInterval(interval);
  }, [fetchModel]);

  if (loading) return (
    <div className="p-12 text-center animate-pulse text-primary font-black tracking-widest uppercase text-xs italic">
      Calibrating Heuristic Engine...
    </div>
  );

  const isCritical = data?.total_predicted_inflow > 120;
  // Automatically uses brand primary color, or warning rose if critical
  const chartColor = isCritical ? "#f43f5e" : "var(--primary)"; 

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: chartColor, color: chartColor }} />
            <p className="text-sm font-black text-foreground uppercase tracking-tight">{payload[0].value} Arrivals</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card text-foreground p-10 rounded-[3rem] border border-border shadow-xl dark:shadow-none transition-all duration-500 relative overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4 italic uppercase">
            <Brain className="text-primary w-10 h-10" /> 
            Heuristic Inflow Engine
          </h2>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-2 opacity-60">Weighted Gaussian modeling • Systemic Saturation feedback</p>
        </div>
        
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black font-mono tracking-[0.2em] uppercase">
            {data?.confidence_score}% Confidence
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-muted/30 p-8 rounded-3xl border border-border relative group transition-all">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">12H Forecast Delta</p>
          <div className="flex items-baseline gap-4">
            <span className="text-7xl font-black tracking-tighter text-foreground leading-none">{data?.total_predicted_inflow}</span>
            <TrendingUp className="text-emerald-500 w-8 h-8 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mt-6 uppercase tracking-widest italic">High-accuracy arrival projection</p>
        </div>

        <div className="bg-muted/30 p-8 rounded-3xl border border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Real-time Risk Factors</p>
          <div className="space-y-5">
             <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="text-xs font-bold text-muted-foreground">Weather Multiplier</span>
                <span className="text-amber-500 font-black tracking-tighter text-lg">{data?.weather_impact?.multiplier || '1.0'}x</span>
             </div>
             <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="text-xs font-bold text-muted-foreground">Systemic Saturation</span>
                <span className="text-amber-500 font-black tracking-tighter text-lg">{data?.factors?.systemic_saturation || '1.0x'}</span>
             </div>
          </div>
          <div className="mt-8 p-3 bg-primary/5 rounded-xl border border-primary/10 text-[10px] font-bold text-primary italic">
            {data?.weather_impact?.reason || "Nominal conditions detected."}
          </div>
        </div>

        <div className="bg-muted/30 p-8 rounded-3xl border border-border flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Surge Readiness</p>
            <div className={`text-5xl font-black italic tracking-tighter ${isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isCritical ? 'CRITICAL' : 'STABLE'}
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
             <div className="p-2 bg-amber-500/10 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
             </div>
             Analysis: {TOTAL_BEDS} Bed Threshold
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-16">
        <div className="flex justify-between items-end mb-8">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase flex items-center gap-3 text-muted-foreground">
                <Clock className="w-4 h-4" /> XGBoost Multivariate Forecast
            </p>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-40">System Node: P-72</span>
        </div>
        
        <div className="h-[420px] w-full bg-muted/20 rounded-[2.5rem] p-8 border border-border shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.forecast || []}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-[0.05]" vertical={false} />
              <XAxis 
                dataKey="hour" 
                stroke="currentColor" 
                className="opacity-40"
                tick={{ fontSize: 10, fontWeight: 900 }} 
                axisLine={false} 
                tickLine={false} 
                dy={20} 
              />
              <YAxis 
                stroke="currentColor" 
                className="opacity-40"
                tick={{ fontSize: 10, fontWeight: 900 }} 
                axisLine={false} 
                tickLine={false} 
                dx={-20} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="inflow" 
                stroke={chartColor} 
                strokeWidth={5} 
                fill="url(#chartGradient)" 
                animationDuration={2000}
                activeDot={{ r: 8, strokeWidth: 0, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MindPredictions;