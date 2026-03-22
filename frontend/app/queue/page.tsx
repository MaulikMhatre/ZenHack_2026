

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence, Reorder, useScroll, useSpring } from "framer-motion";
import QueueIncoming from "@/components/queue/QueueIncoming";
import PatientCard from "@/components/queue/PatientCard";
import QueueConsultation from "@/components/queue/QueueConsultation";
import SurgeWarning from "@/components/queue/SurgeWarning";
import { Cpu, LayoutGrid, Activity } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function QueuePage() {
    const [isTriageMode, setIsTriageMode] = useState(false);
    const scrollRef = useRef(null);
    
    // 3D Perspective Scroll Physics
    const { scrollYProgress } = useScroll({ container: scrollRef });
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Data Fetching
    const { data: queueData, mutate: mutateQueue } = useSWR("http://localhost:8000/api/queue/sorted", fetcher, {
        refreshInterval: 5000,
    });

    const { data: roomsData, mutate: mutateRooms } = useSWR("http://localhost:8000/api/queue/rooms", fetcher, {
        refreshInterval: 5000,
    });

    const [localPatients, setLocalPatients] = useState<any[]>([]);

    useEffect(() => {
        if (queueData?.patients) setLocalPatients(queueData.patients);
    }, [queueData]);

    const displayedPatients = useMemo(() => {
        if (!isTriageMode) return localPatients;
        return localPatients.filter(p => p.base_acuity <= 2 || p.priority_score > 90);
    }, [localPatients, isTriageMode]);

    // Backend Handlers
    const handleCheckIn = async (patientData: any) => {
        try {
            const res = await fetch("http://localhost:8000/api/queue/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patientData),
            });
            if (res.ok) mutateQueue();
        } catch (err) {
            console.error("Check-in failed", err);
        }
    };

    const handleCallPatient = async (patientId: string) => {
        const availableRoom = roomsData?.find((r: any) => r.status === "IDLE");
        if (!availableRoom) {
            alert("No available consultation rooms!");
            return;
        }
        try {
            const res = await fetch(`http://localhost:8000/api/queue/call/${patientId}?room_id=${availableRoom.id}`, {
                method: "POST",
            });
            if (res.ok) {
                mutateQueue();
                mutateRooms();
            }
        } catch (err) {
            console.error("Call failed", err);
        }
    };

    const handleCompleteConsult = async (roomId: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/queue/complete/${roomId}`, {
                method: "POST",
            });
            if (res.ok) {
                mutateQueue();
                mutateRooms();
            }
        } catch (err) {
            console.error("Complete failed", err);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500 selection:bg-primary/30 overflow-hidden select-none">
            
            {/* 3D Depth Layers - Adjusted for Theme */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary-glow),transparent)] pointer-events-none z-0 opacity-20 dark:opacity-100" />
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none grayscale" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Global Progress Telemetry */}
            <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-[2px] bg-primary origin-left z-[100] shadow-[0_0_10px_var(--primary)]" />

            <SurgeWarning 
                show={queueData?.surge_warning} 
                score={queueData?.average_score} 
                onActivate={() => setIsTriageMode(!isTriageMode)}
                isActive={isTriageMode}
            />

            {/* Ultra-Slim HUD Header */}
            <header className="relative z-50 border-b border-border bg-card/60 backdrop-blur-xl transition-all">
                <div className="max-w-[1800px] mx-auto px-10 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <motion.div 
                                whileHover={{ rotateY: 180 }}
                                transition={{ duration: 0.6 }}
                                className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg shadow-sm"
                            >
                                <Cpu className="w-5 h-5 text-primary" />
                            </motion.div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-foreground tracking-tighter uppercase italic leading-none">
                                    Phrelis <span className="text-primary">OS</span>
                                </span>
                                <span className="text-[8px] font-black text-muted-foreground tracking-[0.5em] uppercase mt-1">Tactical Intelligence Core</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-2 p-1 bg-muted rounded-xl border border-border">
                            <div className="px-6 py-2 rounded-lg bg-card border border-border text-center min-w-[120px] shadow-sm">
                                <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">Queue Load</p>
                                <p className="text-lg font-black text-foreground tabular-nums leading-none">{localPatients.length}</p>
                            </div>
                            <div className="px-6 py-2 rounded-lg bg-card border border-border text-center min-w-[120px] shadow-sm">
                                <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mean Acuity</p>
                                <p className={`text-lg font-black tabular-nums leading-none ${queueData?.average_score > 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {Math.round(queueData?.average_score || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1800px] mx-auto p-10 grid grid-cols-12 gap-12 h-[calc(100vh-120px)] overflow-hidden">
                
                {/* Column 1: Intake */}
                <motion.section 
                    initial={{ opacity: 0, rotateY: 20, x: -50 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    className="col-span-3 custom-scrollbar overflow-y-auto pr-4 perspective-[1000px]"
                >
                    <QueueIncoming onCheckIn={handleCheckIn} />
                </motion.section>

                {/* Column 2: Orchestration */}
                <section className="col-span-6 flex flex-col gap-6 overflow-hidden">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                            <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">
                                {isTriageMode ? 'Emergency Triage Path' : 'Live Orchestration Hub'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground px-3 py-1 border border-border rounded-full bg-muted/50 shadow-sm">
                            <span className={`w-1 h-1 rounded-full ${isTriageMode ? 'bg-rose-500 animate-ping' : 'bg-primary'}`} />
                            Live-Sync Active
                        </div>
                    </div>

                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto custom-scrollbar-hidden pr-2 scroll-smooth"
                        style={{ perspective: "1200px" }}
                    >
                        <AnimatePresence mode="popLayout">
                            <Reorder.Group axis="y" values={localPatients} onReorder={setLocalPatients} className="space-y-4">
                                {displayedPatients.map((patient) => (
                                    <Reorder.Item 
                                        key={patient.id} 
                                        value={patient}
                                        initial={{ opacity: 0, z: -50, y: 30 }}
                                        animate={{ opacity: 1, z: 0, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: -100 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                    >
                                        <motion.div whileHover={{ scale: 1.01, z: 10 }} className="transform-gpu">
                                            <PatientCard patient={patient} onCall={handleCallPatient} />
                                        </motion.div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </AnimatePresence>
                    </div>
                </section>

                {/* Column 3: Deployments */}
                <motion.section 
                    initial={{ opacity: 0, rotateY: -20, x: 50 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    className="col-span-3 custom-scrollbar overflow-y-auto pl-4 perspective-[1000px]"
                >
                    <QueueConsultation 
                        rooms={roomsData || []} 
                        onComplete={handleCompleteConsult} 
                    />
                </motion.section>

            </main>

            {/* Tactical Footer Overlay */}
            <div className="fixed bottom-6 left-10 flex items-center gap-4 pointer-events-none">
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-primary/20 rounded-full" />)}
                </div>
                <span className="text-[8px] font-black text-muted-foreground tracking-[0.8em] uppercase opacity-40">Phrelis Intelligence Node // 0x442-A</span>
            </div>
        </div>
    );
}