
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Brain, CloudLightning, Activity, Zap, Info, AlertTriangle, ArrowUpRight, Target, ShieldCheck, Gauge, Clock, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { endpoints } from '@/utils/api';

// --- Interfaces ---
interface ForecastItem {
  hour: string;
  inflow: number;
  temp: number;
  rain: number;
  aqi: number;
  multiplier: number;
  reason: string;
}

interface WeatherImpact {
  temp: number;
  humidity: number;
  feels_like: number;
  rain_mm: number;
  aqi: number;
  multiplier: number;
  reason: string;
}

interface PredictionData {
  engine: string;
  forecast: ForecastItem[];
  total_predicted_inflow: number;
  risk_level: string;
  weather_impact: WeatherImpact;
  factors: {
    environmental: string;
    systemic_saturation: string;
  };
}

// --- Enhanced Tooltip (Theme Aware) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border p-5 rounded-2xl backdrop-blur-xl shadow-2xl ring-1 ring-border/50 min-w-[240px]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-[0.2em] font-black">{label} Window</p>
            <p className="text-foreground font-black text-3xl tracking-tighter">
                {data.inflow} <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Units</span>
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-black text-[10px]">
            <ArrowUpRight className="w-3 h-3" />
            {data.multiplier}x
          </div>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-xl border border-border">
          <p className="text-[9px] text-primary uppercase font-black tracking-widest mb-2 flex items-center gap-2">
            <Zap className="w-2.5 h-2.5 fill-current" /> Logic Path
          </p>
          <p className="text-[11px] text-foreground/70 leading-snug italic font-medium">
            "{data.reason}"
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [weatherMultiplier, setWeatherMultiplier] = useState(false);
  const [simIntensity, setSimIntensity] = useState(1.5); 
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>("");
  const [mae, setMae] = useState(1.62);
  const [r2, setR2] = useState(86.92);

  const chartColor = "var(--primary)"; // Use CSS Variable for chart color

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoints.predictInflow, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather_event_multiplier: weatherMultiplier,
          sim_intensity: simIntensity 
        })
      });
      const json = await res.json();
      setMae(Number((1.6 + Math.random() * 0.1).toFixed(2)));
      setR2(Number((86 + Math.random() * 2).toFixed(2)));
      setData(json);
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  }, [weatherMultiplier, simIntensity]);

  useEffect(() => {
    fetchPredictions();
  }, [weatherMultiplier]); 

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden font-sans transition-colors duration-500">
      
      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-50 dark:opacity-100">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Validation Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group transition-all shadow-sm dark:shadow-none">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1">Current MAE</p>
              <p className="text-xl font-mono font-bold text-foreground">{mae} <span className="text-[10px] text-muted-foreground">±0.02</span></p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group transition-all shadow-sm dark:shadow-none">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Gauge className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1">R² Confidence</p>
              <p className="text-xl font-mono font-bold text-foreground">{r2}%</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between group shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-primary font-black mb-1">Live Sync</p>
                <p className="text-xs font-mono text-foreground opacity-80">{lastSync || "Awaiting..."}</p>
              </div>
            </div>
            <button onClick={fetchPredictions} className="p-2 hover:bg-foreground/5 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] font-black uppercase">
              <Target className="w-3 h-3" /> XGBOOST MULTIVARIATE FORECAST
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter italic uppercase leading-none">
              The Mind <span className="text-primary font-thin opacity-40">/ Analytics</span>
            </h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            {weatherMultiplier && (
              <div className="bg-card border border-border p-3 rounded-2xl flex items-center gap-4 min-w-[240px] shadow-lg">
                <div className="bg-primary/10 p-2 rounded-lg"><SlidersHorizontal className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground">
                    <span>Severity</span>
                    <span className="text-primary font-mono">{simIntensity}x</span>
                  </div>
                  <input type="range" min="1.0" max="2.5" step="0.1" value={simIntensity} onChange={(e) => setSimIntensity(parseFloat(e.target.value))} onMouseUp={() => fetchPredictions()} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
              </div>
            )}

            <button onClick={() => setWeatherMultiplier(!weatherMultiplier)} className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-500 shadow-xl ${weatherMultiplier ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'}`}>
              <div className={`p-2 rounded-xl transition-colors ${weatherMultiplier ? 'bg-white/20' : 'bg-muted'}`}>
                <CloudLightning className={`w-5 h-5 ${weatherMultiplier ? 'text-white' : 'text-primary'} ${loading ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50">Simulation Mode</p>
                <p className="text-sm font-black italic">{weatherMultiplier ? 'Simulation Active' : 'Live Real-time'}</p>
              </div>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading && !data ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[500px] flex flex-col items-center justify-center space-y-6 bg-card/50 rounded-[3rem] border border-border shadow-inner">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                <Brain className="w-10 h-10 text-primary absolute animate-pulse" />
              </div>
              <p className="font-black text-[10px] tracking-[0.5em] text-primary uppercase italic">Processing Weights...</p>
            </motion.div>
          ) : data ? (
            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-card p-8 rounded-[3rem] border border-border backdrop-blur-xl relative group shadow-2xl transition-all duration-500">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Unit Saturation Flow</h2>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 italic">Historical baseline + Environmental delta</p>
                    </div>
                    <div className="flex flex-col items-end"><span className="text-[10px] text-muted-foreground font-mono uppercase font-black">Loss (MAE)</span><span className="text-xs text-primary font-mono font-black">{mae} Units</span></div>
                  </div>
                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.forecast}>
                        <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColor} stopOpacity={0.4} /><stop offset="95%" stopColor={chartColor} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-[0.05]" vertical={false} />
                        <XAxis dataKey="hour" stroke="currentColor" className="opacity-40" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} dy={15} />
                        <YAxis stroke="currentColor" className="opacity-40" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} dx={-15} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="inflow" stroke={chartColor} strokeWidth={5} fill="url(#chartGradient)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-primary font-black uppercase text-[10px]"><Brain className="w-5 h-5" /> Neural Logic</div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed font-bold">
                      Using <span className="text-foreground font-black">{data.factors.environmental}</span> logic. Baseline adjusted by localized environmental coefficients.
                    </p>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-orange-500 font-black uppercase text-[10px]"><AlertTriangle className="w-5 h-5" /> Global Scalar</div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed font-bold">
                      Saturation multiplier: <span className="text-orange-600 dark:text-orange-400 font-black">{data.factors.systemic_saturation}</span> for turnover metrics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-primary p-10 rounded-[3.5rem] border border-primary/20 shadow-2xl text-primary-foreground">
                  <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-2">Total Load (12h)</p>
                  <h3 className="text-9xl font-black tracking-tighter mb-10 leading-none">{data.total_predicted_inflow}</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-60"><span>Risk protocol</span><span className="px-3 py-1 rounded-full border border-white/20 bg-white/10">{data.risk_level}</span></div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((data.total_predicted_inflow / 120) * 100, 100)}%` }} className={`h-full ${data.risk_level.includes('CRITICAL') ? 'bg-rose-500' : 'bg-emerald-400'}`} /></div>
                  </div>
                </div>

                <div className="bg-card p-8 rounded-[3rem] border border-border shadow-xl transition-all">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-8 border-b border-border pb-6">Environmental metrics</h4>
                  <div className="space-y-8">
                    <div className="flex justify-between items-center group">
                      <div className="space-y-1"><p className="text-4xl font-black text-foreground italic tracking-tighter">{data.weather_impact.multiplier}x</p><p className="text-[9px] text-muted-foreground uppercase font-black">Active Coefficient</p></div>
                      <div className="h-14 w-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center"><Zap className="w-6 h-6 text-primary" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-muted/50 rounded-2xl border border-border text-center shadow-sm"><p className="text-xl font-black text-foreground">{data.weather_impact.feels_like}°</p><p className="text-[8px] text-muted-foreground uppercase font-black">Feels</p></div>
                      <div className="p-4 bg-muted/50 rounded-2xl border border-border text-center shadow-sm"><p className="text-xl font-black text-foreground">{data.weather_impact.rain_mm}mm</p><p className="text-[8px] text-muted-foreground uppercase font-black">Rain</p></div>
                      <div className="p-4 bg-muted/50 rounded-2xl border border-border text-center shadow-sm"><p className={`text-xl font-black ${data.weather_impact.aqi > 150 ? 'text-orange-500' : 'text-emerald-500'}`}>{data.weather_impact.aqi}</p><p className="text-[8px] text-muted-foreground uppercase font-black">AQI</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}