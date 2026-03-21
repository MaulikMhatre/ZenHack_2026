
"use client";

import { motion, AnimatePresence } from "framer-motion";
import PriorityOrb from "./PriorityOrb";
import { Clock, AlertTriangle, ChevronRight, Activity, Microscope } from "lucide-react";
import { useState, useEffect } from "react";

interface Patient {
    id: string;
    patient_name: string;
    patient_age: number;
    gender: string;
    base_acuity: number;
    priority_score: number;
    check_in_time: string;
    symptoms: string[];
    icd_code?: string;
    icd_rationale?: string;
    triage_urgency?: string;
}

interface PatientCardProps {
    patient: Patient;
    onCall: (id: string) => void;
}

export default function PatientCard({ patient, onCall }: PatientCardProps) {
    const [waitTime, setWaitTime] = useState(0);

    useEffect(() => {
        const calculateTime = () => {
            const checkInStr = patient.check_in_time.endsWith('Z')
                ? patient.check_in_time
                : `${patient.check_in_time.replace(' ', 'T')}Z`;

            const checkInDate = new Date(checkInStr);
            const now = new Date();
            const diffInMs = now.getTime() - checkInDate.getTime();
            setWaitTime(Math.max(0, Math.floor(diffInMs / 60000)));
        };

        calculateTime();
        const interval = setInterval(calculateTime, 30000);
        return () => clearInterval(interval);
    }, [patient.check_in_time]);

    const getStatusColor = () => {
        if (patient.base_acuity <= 2 || patient.triage_urgency === 'CRITICAL') return "from-rose-500/20";
        if (patient.base_acuity === 3 || patient.triage_urgency === 'URGENT') return "from-amber-500/20";
        return "from-emerald-500/20";
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5 }}
            className="relative group mb-4"
        >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${getStatusColor()} to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500`} />

            {/* Main Card Container: shadow-slate-200/40 removed */}
            <div className="relative p-6 border border-border bg-card/80 backdrop-blur-2xl rounded-[2rem] overflow-hidden transition-all duration-500 group-hover:border-primary/30 shadow-2xl dark:shadow-none">

                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-5">
                        <div className="relative">
                            <PriorityOrb score={patient.priority_score} acuity={patient.base_acuity} />
                            {(patient.base_acuity <= 2 || patient.triage_urgency === 'CRITICAL') && (
                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Activity className="w-4 h-4 text-rose-500" />
                                </motion.div>
                            )}
                        </div>

                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                                    {patient.patient_name}
                                </h3>
                                <div className="flex gap-1.5">
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground uppercase tracking-widest">
                                        {patient.gender.charAt(0)} • {patient.patient_age}Y
                                    </span>
                                    {patient.triage_urgency && (
                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition-colors ${
                                            patient.triage_urgency === 'CRITICAL' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                                            patient.triage_urgency === 'URGENT' ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' :
                                            'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                                        }`}>
                                            {patient.triage_urgency}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {patient.icd_code && (
                                <div className="space-y-2 py-1">
                                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/20 w-fit">
                                        <Microscope className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                            Core DX: {patient.icd_code}
                                        </span>
                                    </div>
                                    {patient.icd_rationale && (
                                        <p className="text-[11px] text-muted-foreground leading-relaxed font-mono italic opacity-80 max-w-md">
                                            &quot;{patient.icd_rationale}&quot;
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                                {patient.symptoms.map((s, i) => (
                                    <span key={i} className="px-3 py-1 text-[10px] font-bold bg-primary/5 text-primary border border-primary/10 rounded-full uppercase tracking-tight">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Priority Index readout */}
                    <div className="flex items-center gap-3 bg-muted/50 p-2.5 pl-4 rounded-2xl border border-border shadow-inner self-start">
                        <div className="text-right">
                            <div className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">P-Index</div>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-none mt-1">
                                {Math.round(patient.priority_score)}
                            </div>
                        </div>
                        <div className="h-10 w-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.min(patient.priority_score, 100)}%` }}
                                className={`w-full ${patient.priority_score > 85 ? 'bg-rose-500' : 'bg-primary'} transition-colors duration-500`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted border border-border text-muted-foreground group-hover:text-foreground transition-colors shadow-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black tabular-nums tracking-tighter">{waitTime}M WAITING</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                            (patient.base_acuity <= 2 || patient.triage_urgency === 'CRITICAL') 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
                            : 'bg-muted border-border text-muted-foreground opacity-60'
                        }`}>
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">ESI {patient.base_acuity}</span>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onCall(patient.id)}
                        className="flex items-center gap-3 pl-8 pr-6 py-3 text-[10px] font-black text-primary-foreground bg-primary rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 tracking-[0.3em] uppercase group/btn"
                    >
                        Dispatch
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </motion.button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </motion.div>
    );
}