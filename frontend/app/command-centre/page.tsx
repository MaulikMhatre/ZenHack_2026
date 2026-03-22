"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Activity,
    Map as MapIcon,
    AlertCircle,
    Zap,
    Search,
    Filter,
    ChevronRight,
    Wind,
    Thermometer,
    CloudLightning,
    Brain,
    Stethoscope,
    Ambulance,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from 'lucide-react';

interface Hospital {
    id: string;
    name: string;
    load_index: number;
    total_beds: number;
    occupied: number;
    available: number;
    status: 'STABLE' | 'WARNING' | 'DIVERSION';
    distance: number;
    resources: {
        ventilators: number;
        icu_beds: number;
        on_call: string[];
    };
}

interface Syndrome {
    category: string;
    current_24h: number;
    previous_24h: number;
    spike_percentage: number;
    is_alert: boolean;
}

const CommandCentrePage = () => {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [syndromes, setSyndromes] = useState<Syndrome[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    const [matchQuery, setMatchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // FIX: State for hydration-safe time
    const [currentTime, setCurrentTime] = useState<string>("");

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [hRes, sRes] = await Promise.all([
                fetch('http://localhost:8000/api/command-centre/status'),
                fetch('http://localhost:8000/api/command-centre/syndrome-stats')
            ]);
            if (hRes.ok) setHospitals(await hRes.json());
            if (sRes.ok) setSyndromes(await sRes.json());
        } catch (err) {
            console.error("Dashboard sync failed", err);
        } finally {
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    }, []);

    const fetchMatches = async (resource: string) => {
        if (!resource) return;
        try {
            const res = await fetch(`http://localhost:8000/api/command-centre/match?resource=${encodeURIComponent(resource)}`);
            const data = await res.json();
            setMatches(data);
        } catch (err) {
            console.error("Match search failed", err);
        }
    };

    useEffect(() => {
        fetchData();
        const dataTimer = setInterval(fetchData, 15000);

        // FIX: Clock Timer (updates every second and avoids hydration error)
        setCurrentTime(new Date().toLocaleTimeString());
        const clockTimer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => {
            clearInterval(dataTimer);
            clearInterval(clockTimer);
        };
    }, [fetchData]);

    // Performance Optimization: Memoized Filter
    const filteredHospitals = useMemo(() => {
        return hospitals.filter(h =>
            h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.resources.on_call.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [hospitals, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DIVERSION': return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
            case 'WARNING': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
            default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
        }
    };

    const getSyndromeIcon = (category: string) => {
        switch (category) {
            case 'Respiratory': return <Wind size={16} />;
            case 'Fever/Viral': return <Thermometer size={16} />;
            case 'Gastro': return <CloudLightning size={16} />;
            case 'Neurological': return <Brain size={16} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 p-8 font-mono selection:bg-indigo-500/30">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Shield className="text-indigo-500 w-8 h-8" />
                        Healthcare Command Centre
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.4em]">
                        {/* FIX: Render the currentTime state variable */}
                        City-Wide Multi-Node Intelligence | Live Stream: {currentTime || "--:--:--"}
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={fetchData}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 group"
                    >
                        <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-emerald-500 uppercase">System Status: Nominal</span>
                        <span className="text-[8px] text-slate-600 uppercase">Nodes Connected: {hospitals.length}</span>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${showHeatmap
                            ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                    >
                        {showHeatmap ? 'Disable Heatmap' : 'Enable Early Warning Layer'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT: TRAFFIC CONTROLLER */}
                <div className="col-span-12 xl:col-span-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                            <MapIcon size={14} /> Global Node Topology
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                            <input
                                type="text"
                                placeholder="PROBE RESOURCES (E.G. VENTILATORS)"
                                className="bg-white/[0.02] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-[10px] w-64 focus:outline-none focus:border-indigo-500 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredHospitals.map((h) => (
                                <motion.div
                                    key={h.id}
                                    layout="position"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => setSelectedHospital(h)}
                                    className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${h.status === 'DIVERSION' ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                        }`}
                                >
                                    <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-20" />

                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{h.name}</h3>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">DIST: {h.distance} MI | NODE_{h.id}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[8px] font-black border uppercase tracking-widest ${getStatusColor(h.status)}`}>
                                            {h.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase mb-1.5">
                                                <span className="text-slate-500 tracking-widest">Saturation Index</span>
                                                <span className={h.load_index > 0.9 ? 'text-rose-500' : 'text-slate-300'}>
                                                    {(h.load_index * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${h.load_index * 100}%` }}
                                                    className={`h-full rounded-full ${h.load_index > 0.9 ? 'bg-rose-500' : h.load_index > 0.7 ? 'bg-amber-500' : 'bg-indigo-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-600 uppercase font-black">Available</span>
                                                <span className="text-xs font-black text-white">{h.available} BEDS</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-600 uppercase font-black">Ventilators</span>
                                                <span className="text-xs font-black text-white">{h.resources.ventilators}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-600 uppercase font-black">ICU Status</span>
                                                <span className="text-xs font-black text-white">{h.resources.icu_beds} AVAIL</span>
                                            </div>
                                        </div>
                                    </div>

                                    {h.status === 'DIVERSION' && (
                                        <div className="mt-4 pt-4 border-t border-rose-500/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-rose-500">
                                                <Ambulance size={12} className="animate-bounce text-rose-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Rerouting Active</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase">
                                                Search Next Stable <ChevronRight size={10} />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT: EARLY WARNING & MATCHING */}
                <div className="col-span-12 xl:col-span-4 space-y-8">
                    {/* SYNDROME ALERTS */}
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 transition-all">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/50 mb-8 flex items-center gap-2">
                            <Zap size={14} className="text-indigo-400" /> Early Warning Heatmap
                        </h2>

                        <div className="space-y-6">
                            {syndromes.map((s) => (
                                <div key={s.category} className="group cursor-help">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${s.is_alert ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-slate-500'}`}>
                                                {getSyndromeIcon(s.category)}
                                            </div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{s.category}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className={`flex items-center gap-1 text-[10px] font-black ${s.is_alert ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {s.is_alert ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {s.spike_percentage}%
                                            </div>
                                            <div className="text-[8px] text-slate-600 font-bold uppercase">24H Trend</div>
                                        </div>
                                    </div>
                                    {s.is_alert && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-2 p-2 rounded bg-rose-500/5 border border-rose-500/10"
                                        >
                                            <p className="text-[8px] text-rose-400 font-black uppercase leading-tight italic flex items-center gap-2">
                                                <AlertCircle size={8} /> Significant Spike Detected. Cluster isolation recommended.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SMART MATCH REFERRAL */}
                    <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                            <Stethoscope size={14} /> Smart Match Referral
                        </h2>
                        <div className="space-y-4">
                            <p className="text-[10px] text-slate-500 uppercase leading-relaxed tracking-tighter">
                                IDENTIFY BEST-FIT FACILITIES FOR HIGH-ACUITY TRANSFERS BASED ON LIVE SPECIALTY RESOURCE TELEMETRY.
                            </p>
                            <button
                                onClick={() => setIsMatching(true)}
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                Search Specialty Resources <Filter size={12} className="group-hover:rotate-180 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SMART MATCH MODAL */}
            <AnimatePresence>
                {isMatching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md"
                    >
                        <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[32px] overflow-hidden">
                            <div className="p-8 border-b border-white/5 bg-indigo-500/5">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Brain className="text-indigo-500" /> Smart Match Engine v4.1
                                </h3>
                                <div className="mt-6 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="REQUIRED RESOURCE (E.G. NEUROLOGY, VENTILATOR)"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500"
                                        value={matchQuery}
                                        onChange={(e) => {
                                            setMatchQuery(e.target.value);
                                            fetchMatches(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {matches.length > 0 ? (
                                    <div className="space-y-4">
                                        {matches.map((m, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between hover:border-indigo-500/30 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xs">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-white">{m.hospital}</h4>
                                                        <p className="text-[10px] text-slate-500 uppercase">Distance: {m.distance} Mi | Score: {m.score.toFixed(1)}</p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Refer Patient
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Input parameters to begin match analysis</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/5 text-center">
                                <button
                                    onClick={() => { setIsMatching(false); setMatches([]); setMatchQuery(''); }}
                                    className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest"
                                >
                                    Close Engine [ESC]
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HOSPITAL DETAIL MODAL */}
            <AnimatePresence>
                {selectedHospital && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md"
                    >
                        <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[40px] overflow-hidden relative">
                            <div className="grid grid-cols-2">
                                <div className="p-12 border-r border-white/5">
                                    <div className={`inline-block px-3 py-1 rounded text-[8px] font-black border uppercase tracking-widest mb-6 ${getStatusColor(selectedHospital.status)}`}>
                                        {selectedHospital.status}
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-2">{selectedHospital.name}</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Regional Node Index: {selectedHospital.id}</p>

                                    <div className="mt-12 space-y-8">
                                        <div className="grid grid-cols-2 gap-12">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Saturation</p>
                                                <p className="text-2xl font-black text-white italic">{(selectedHospital.load_index * 100).toFixed(0)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Distance</p>
                                                <p className="text-2xl font-black text-white italic">{selectedHospital.distance} MI</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">On-Call Specialties</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedHospital.resources.on_call.map(s => (
                                                    <span key={s} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 uppercase">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 bg-white/[0.01]">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase mb-8 tracking-widest">Resource Telemetry</h4>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Ventilator Fleet', val: selectedHospital.resources.ventilators, total: 30 },
                                            { label: 'ICU Bed Inventory', val: selectedHospital.resources.icu_beds, total: 25 },
                                            { label: 'Total Node Capacity', val: selectedHospital.available, total: selectedHospital.total_beds }
                                        ].map(item => (
                                            <div key={item.label}>
                                                <div className="flex justify-between text-[10px] font-black uppercase mb-3">
                                                    <span className="text-slate-400">{item.label}</span>
                                                    <span className="text-white">{item.val} Units</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${(item.val / (item.total || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 flex gap-4">
                                        <button className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            Contact Node
                                        </button>
                                        <button className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10">
                                            Initiate Transfer
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedHospital(null)}
                                className="absolute top-8 right-8 text-slate-500 hover:text-white uppercase text-[10px] font-black tracking-widest p-2"
                            >
                                Close Node [ESC]
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEATMAP OVERLAY MODAL */}
            <AnimatePresence>
                {showHeatmap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-12 bg-black/90 backdrop-blur-xl will-change-transform"
                    >
                        <div className="w-full max-w-6xl aspect-video bg-[#0a0a0a] rounded-[40px] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] pointer-events-none" />
                            <div className="text-center z-10">
                                <div className="w-64 h-64 border-4 border-rose-500/20 rounded-full flex items-center justify-center mx-auto relative animate-pulse">
                                    <div className="w-48 h-48 border-2 border-rose-500/40 rounded-full flex items-center justify-center">
                                        <AlertCircle className="text-rose-500 w-16 h-16" />
                                    </div>
                                    <div className="absolute -top-10 -left-20 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full transform-gpu" />
                                    <div className="absolute top-40 -right-20 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full transform-gpu" />
                                </div>
                                <h3 className="text-xl font-black text-white mt-8 uppercase tracking-[0.4em]">Spike Alert: Zone 4 (North-East)</h3>
                                <p className="text-[10px] text-rose-500 mt-4 font-black uppercase tracking-widest italic animate-pulse max-w-md mx-auto leading-relaxed">
                                    Aggregated Symptom Pattern: High Respiratory Distress + Elevated Leukocytes Detected via Regional Nodes
                                </p>
                            </div>
                            <button
                                onClick={() => setShowHeatmap(false)}
                                className="absolute top-8 right-8 text-slate-500 hover:text-white uppercase text-[10px] font-black tracking-widest p-2 z-20"
                            >
                                Close Layer [ESC]
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommandCentrePage;