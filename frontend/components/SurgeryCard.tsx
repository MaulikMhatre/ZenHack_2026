"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    User,
    Stethoscope,
    AlertTriangle,
    CheckCircle,
    Trash2,
    RefreshCw,
    Plus
} from "lucide-react";
import { endpoints } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

// --- Types ---
interface SurgeryRoom {
    id: string;
    current_state: "AVAILABLE" | "OCCUPIED" | "OVERTIME" | "DIRTY" | "CLEANING";
    patient_name?: string;
    surgeon_name?: string;
    expected_end_time?: string;
    is_occupied: boolean;
    admission_time?: string;
}

interface SurgeryCardProps {
    room: SurgeryRoom;
    onUpdate: () => void;
    onAdmit: () => void;
}

// --- High Performance Timer Sub-Component ---
const SurgeryTimer = ({
    expectedEndTime,
    onOvertime
}: {
    expectedEndTime: string;
    onOvertime: (val: boolean) => void
}) => {
    const [timeLeft, setTimeLeft] = useState("--:--");

    useEffect(() => {
        const calculateTime = () => {
            // Ensure UTC parsing by appending 'Z' if missing
            const utcString = expectedEndTime.endsWith('Z') ? expectedEndTime : `${expectedEndTime}Z`;
            const end = new Date(utcString).getTime();
            const now = new Date().getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
                onOvertime(true);
            } else {
                const totalSecs = Math.floor(diff / 1000);
                const mins = Math.floor(totalSecs / 60);
                const secs = totalSecs % 60;
                setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
                onOvertime(false);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [expectedEndTime, onOvertime]);

    const isTimerRed = timeLeft === "00:00";

    return (
        <div className={`text-center py-2 bg-black/20 rounded-lg border transition-colors ${isTimerRed ? "border-red-500/40" : "border-blue-500/10"}`}>
            <div className={`text-2xl font-mono font-bold ${isTimerRed ? "text-red-500" : "text-blue-400"}`}>
                {timeLeft}
            </div>
            <div className={`text-[9px] font-black uppercase tracking-tighter ${isTimerRed ? "text-red-400" : "text-gray-500"}`}>
                {isTimerRed ? "Time Exceeded" : "Est. Time Remaining"}
            </div>
        </div>
    );
};

// --- Main SurgeryCard Component ---
export default function SurgeryCard({ room, onUpdate, onAdmit }: SurgeryCardProps) {
    const { token } = useAuth();
    const [isOvertime, setIsOvertime] = useState(false);
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Sync state with backend room state
    useEffect(() => {
        if (room.current_state === "OVERTIME") {
            setIsOvertime(true);
        } else if (room.current_state === "AVAILABLE" || room.current_state === "DIRTY") {
            setIsOvertime(false);
        }
    }, [room.current_state]);

    const handleAction = async (actionType: "extend" | "complete" | "release", body?: any) => {
        setProcessing(true);
        let url = "";
        if (actionType === "extend") url = endpoints.extendSurgery(room.id);
        if (actionType === "complete") url = endpoints.completeSurgery(room.id);
        if (actionType === "release") url = endpoints.releaseSurgery(room.id);

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (res.ok) {
                onUpdate();
                setShowCheckIn(false);
            }
        } catch (e) {
            console.error("Action Failed:", e);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = () => {
        if (room.current_state === "AVAILABLE") return "bg-green-500/5 border-green-500/30 hover:bg-green-500/10";
        if (isOvertime || room.current_state === "OVERTIME") return "bg-red-500/5 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
        if (room.current_state === "OCCUPIED") return "bg-blue-600/5 border-blue-500/40";
        if (room.current_state === "DIRTY") return "bg-orange-500/5 border-orange-500/30";
        if (room.current_state === "CLEANING") return "bg-sky-400/5 border-sky-400/30";
        return "bg-gray-800 border-gray-700";
    };

    const getStatusIcon = () => {
        if (room.current_state === "AVAILABLE") return <CheckCircle className="w-5 h-5 text-green-400" />;
        if (room.current_state === "DIRTY") return <Trash2 className="w-5 h-5 text-orange-400" />;
        if (room.current_state === "CLEANING") return <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />;
        return <Clock className={`w-5 h-5 ${isOvertime ? "text-red-500" : "text-blue-400"}`} />;
    };

    // Logic: Only show the clock if state is active AND we have an end time
    const showTimer = (room.current_state === "OCCUPIED" || room.current_state === "OVERTIME") &&
        !!room.expected_end_time &&
        room.expected_end_time !== room.admission_time;

    return (
        <div className={`relative p-5 rounded-2xl border backdrop-blur-md transition-all duration-500 ${getStatusColor()}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
                        {room.id}
                        {isOvertime && <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOvertime ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`} />
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                            {isOvertime ? "OVERTIME" : room.current_state}
                        </span>
                    </div>
                </div>
                {getStatusIcon()}
            </div>

            {/* Content Section */}
            <div className="space-y-3 mb-5">
                {showTimer ? (
                    <SurgeryTimer
                        expectedEndTime={room.expected_end_time!}
                        onOvertime={setIsOvertime}
                    />
                ) : room.current_state === "OCCUPIED" ? (
                    <div className="text-center py-4 bg-blue-500/5 rounded-lg border border-dashed border-blue-500/20">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                            Ready to Start
                        </p>
                    </div>
                ) : null}

                {room.current_state !== "AVAILABLE" && (
                    <div className={`bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 transition-opacity ${(room.current_state === "DIRTY" || room.current_state === "CLEANING") ? "opacity-40" : "opacity-100"
                        }`}>
                        <div className="flex items-center gap-3">
                            <User size={14} className="text-blue-400" />
                            <span className="text-xs font-bold text-gray-200 truncate">{room.patient_name || "Unknown Patient"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Stethoscope size={14} className="text-purple-400" />
                            <span className="text-xs text-gray-400 truncate">{room.surgeon_name || "No Surgeon Assigned"}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
                {(room.current_state === "OCCUPIED" || room.current_state === "OVERTIME") && (
                    <>
                        <div className="flex gap-1">
                            {[15, 30, 60].map(mins => (
                                <button
                                    key={mins}
                                    disabled={processing}
                                    onClick={() => handleAction("extend", { additional_minutes: mins })}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold py-2 rounded-lg border border-white/5 transition-colors disabled:opacity-50"
                                >
                                    +{mins}m
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={processing}
                            onClick={() => setShowCheckIn(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase py-3 rounded-xl transition-all tracking-widest shadow-lg shadow-indigo-500/20"
                        >
                            Complete Case
                        </button>
                    </>
                )}

                {(room.current_state === "DIRTY" || room.current_state === "CLEANING") && (
                    <button
                        disabled={processing}
                        onClick={() => handleAction("release")}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} className={room.current_state === "CLEANING" ? "animate-spin" : ""} />
                        Finalize Turnover
                    </button>
                )}

                {room.current_state === "AVAILABLE" && (
                    <button
                        onClick={onAdmit}
                        className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                    >
                        <div className="p-2 bg-white/5 rounded-full group-hover:bg-blue-500/20 transition-colors">
                            <Plus size={20} className="text-gray-500 group-hover:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-400">
                            Admit New Patient
                        </span>
                    </button>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showCheckIn && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-30 bg-slate-900/98 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-white/10"
                    >
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={24} className="text-emerald-500" />
                        </div>
                        <h4 className="text-white font-black text-sm uppercase tracking-tight mb-1">Confirm Completion?</h4>
                        <p className="text-[10px] text-slate-400 mb-6">Patient data will be archived and room turnover will begin.</p>
                        <div className="w-full space-y-2">
                            <button
                                onClick={() => handleAction("complete")}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-colors"
                            >
                                Confirm & Clean
                            </button>
                            <button
                                onClick={() => setShowCheckIn(false)}
                                className="w-full py-2 text-[10px] font-bold text-slate-500 uppercase hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}