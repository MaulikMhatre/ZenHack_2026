
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Components
import LiveHeatmap from "@/components/LiveHeatmap";
import DashboardWidgets from "@/components/DashboardWidgets";
import MindPredictions from "@/components/MindPredictions";

// Icons
import {
    Activity,
    Users,
    AlertCircle,
    BedDouble,
    HeartPulse,
    Zap,
} from "lucide-react";

import { endpoints, WS_BASE_URL } from '@/utils/api';

interface DashboardData {
    occupancy: { ER: number; ICU: number; Surgery: number; Wards: number };
    bed_stats: { total: number; occupied: number; available: number; free_beds: number };
    staff_ratio: string;
    resources: any;
    system_status: { diversion_active: boolean; occupancy_rate: number };
    patients?: any[];
}

export default function DashboardPage() {
    const router = useRouter();

    const [data, setData] = useState<DashboardData | null>(null);
    const [surge, setSurge] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [criticalAlert, setCriticalAlert] = useState<string | null>(null);
    const [stressScore, setStressScore] = useState<number>(0);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else if (role === 'Nurse') {
            router.push('/staff/worklist');
        }
    }, [router]);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, surgeRes] = await Promise.all([
                fetch(endpoints.dashboardStats),
                fetch(endpoints.timeToCapacity)
            ]);
            const json = await statsRes.json();
            const surgeData = await surgeRes.json();
            const bedStats = json?.bed_stats || { available: 0, occupied: 0, total: 1 };
            const freeBeds = Math.max(0, bedStats.total - bedStats.occupied);
            
            setData({
                ...json,
                bed_stats: { ...bedStats, free_beds: freeBeds },
                system_status: {
                    diversion_active: bedStats.available === 0,
                    occupancy_rate: Math.round((bedStats.occupied / (bedStats.total || 1)) * 100)
                }
            });
            setSurge(surgeData);

            const occ = (Math.round((bedStats.occupied / (bedStats.total || 1)) * 100)) / 100;
            const vel = Math.min((surgeData?.velocity || 0) / 120, 1);
            const ttc = 1 - Math.min((surgeData?.minutes_remaining || 0) / 120, 1);
            const score = Math.round(100 * (0.5 * occ + 0.3 * vel + 0.2 * ttc));
            setStressScore(score);
            if (score >= 85) setIsSimulating(true);
        } catch (err) {
            console.error("Sync Error", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const poll = setInterval(fetchData, 5000);
        const clock = setInterval(() => setTime(new Date()), 1000);
        const ws = new WebSocket(`${WS_BASE_URL}/ws/vitals`);
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "CRITICAL_VITALS") {
                setCriticalAlert(msg.message);
                setTimeout(() => setCriticalAlert(null), 10000);
            }
        };
        return () => {
            clearInterval(poll);
            clearInterval(clock);
            ws.close();
        };
    }, [fetchData]);

    if (loading || !data) return <LoadingState />;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-full bg-background text-foreground flex overflow-hidden transition-colors duration-500"
        >
            <main className="flex-1 flex flex-col relative min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
                <AnimatePresence>
                    {isSimulating && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="w-full bg-rose-600 text-white py-1 text-[10px] font-black tracking-[0.4em] text-center uppercase z-50 animate-pulse"
                        >
                            Surge Simulation Mode Active: Mass Casualty Protocol
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto px-12 py-10 space-y-14 custom-scrollbar">
                    <header className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.35em] uppercase">
                                    Intelligence Division
                                </span>
                                <span className="text-muted-foreground text-[10px] font-mono tracking-widest uppercase">
                                    {time.toLocaleTimeString()}
                                </span>
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter leading-none">
                                Command Center
                            </h1>
                        </div>

                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black tracking-tight border transition-all duration-300 ${
                                isSimulating
                                    ? "bg-rose-600 border-rose-500 text-white shadow-[0_0_40px_rgba(225,29,72,0.5)]"
                                    : "bg-card border-border text-foreground/70 hover:border-primary/50 hover:text-primary"
                            }`}
                        >
                            <Zap className={`w-5 h-5 ${isSimulating ? 'animate-pulse' : ''}`} />
                            <span>{isSimulating ? `Stress: ${stressScore}` : "Evaluate Stress"}</span>
                        </button>
                    </header>

                    <AnimatePresence>
                        {criticalAlert && (
                            <CriticalAlertUI message={criticalAlert} onClose={() => setCriticalAlert(null)} />
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <MetricCard label="Capacity" value={`${data.system_status.occupancy_rate}%`} icon={<Activity />} />
                        <MetricCard label="Doctor Ratio" value={data.staff_ratio} icon={<Users />} />
                        
                        <div className={`group relative backdrop-blur-xl p-8 rounded-[2.5rem] border transition-all duration-500 ${
                            (data.bed_stats.free_beds || 0) <= 2
                                ? "bg-rose-500/10 border-rose-500 text-rose-600 shadow-[0_0_40px_rgba(225,29,72,0.2)]"
                                : "bg-card border-border text-foreground"
                        }`}>
                            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-8 text-primary group-hover:scale-110 transition-transform">
                                <BedDouble size={32} />
                            </div>
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground mb-2">Neural Availability</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-black tracking-tight">{data.bed_stats.free_beds || 0}</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Beds Free</p>
                            </div>
                            <div className="mt-6 h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${data.system_status.occupancy_rate}%` }}
                                    className={`h-full transition-all duration-1000 ${
                                        (data.bed_stats.free_beds || 0) <= 2 ? 'bg-rose-500' : 'bg-primary'
                                    }`}
                                />
                            </div>
                        </div>

                        <StatusCard active={data.system_status.diversion_active} isSimulating={isSimulating} />
                    </div>

                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-14 pb-10">
                         <div className="xl:col-span-2">
                            <MindPredictions />
                        </div>
                        <LiveHeatmap occupancy={data.occupancy} isSimulating={isSimulating} />
                        <DashboardWidgets resources={data.resources} />
                    </section>
                </div>
            </main>
        </motion.div>
    );
}

// --- Internal Sub-Components ---

const MetricCard = ({ label, value, icon }: any) => (
    <div className="group relative bg-card backdrop-blur-xl p-8 rounded-[2.5rem] border border-border hover:border-primary/30 transition-all duration-300 shadow-sm dark:shadow-none">
        <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-8 text-primary group-hover:scale-110 transition-transform">
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground mb-2">{label}</p>
        <p className="text-5xl font-black tracking-tight text-foreground">{value}</p>
    </div>
);

const StatusCard = ({ active, isSimulating }: any) => {
    const isAlert = active || isSimulating;
    return (
        <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-500 ${
            isAlert 
                ? "bg-rose-500/10 border-rose-500 text-rose-600" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
        }`}>
            <AlertCircle className={`w-10 h-10 mb-4 ${isAlert ? 'animate-pulse' : ''}`} />
            <div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">System Status</p>
                <p className="text-4xl font-black uppercase tracking-tight">{isAlert ? "Diversion" : "Normal"}</p>
            </div>
        </div>
    );
};

const CriticalAlertUI = ({ message, onClose }: any) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className="bg-rose-500/10 border border-rose-500/30 rounded-[2rem] p-8 flex justify-between items-center backdrop-blur-md"
    >
        <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-600 rounded-2xl animate-pulse">
                <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <p className="text-2xl font-black uppercase tracking-tight text-rose-600 italic">Code Red: {message}</p>
        </div>
        <button onClick={onClose} className="px-8 py-3 rounded-xl bg-rose-600 font-bold text-white text-sm hover:bg-rose-700 transition-colors">
            ACKNOWLEDGE
        </button>
    </motion.div>
);

const LoadingState = () => (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Phrelis Syncing...</p>
    </div>
);




