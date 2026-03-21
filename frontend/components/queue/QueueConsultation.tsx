

"use client";

import { motion } from "framer-motion";
import { Stethoscope, DoorOpen } from "lucide-react";

interface Room {
    id: string;
    doctor_name: string;
    status: string;
    current_patient_id?: string;
}

export default function QueueConsultation({ rooms, onComplete }: { rooms: Room[], onComplete: (id: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                {/* Adaptive icon background */}
                <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                    <Stethoscope className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight uppercase italic">Active Rooms</h2>
            </div>

            <div className="grid grid-cols-1 gap-5">
                {rooms.map((room) => (
                    <motion.div
                        key={room.id}
                        layout
                        initial={false}
                        animate={{
                            // Border color adapts based on system variables
                            borderColor: room.status === "ACTIVE" ? "var(--primary)" : "var(--border)",
                            // Background adapts based on system variables
                            backgroundColor: "var(--card)",
                        }}
                        className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-500 hover:shadow-xl 
                            ${room.status === "ACTIVE" 
                                ? "shadow-primary/5 border-opacity-50" 
                                : "shadow-sm border-opacity-30 dark:shadow-none"
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl transition-all duration-500 ${
                                    room.status === "ACTIVE"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "bg-muted text-muted-foreground"
                                }`}>
                                    <DoorOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground tracking-tight uppercase">{room.doctor_name}</h3>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{room.id}</p>
                                </div>
                            </div>
                            {/* Status Badge adapts automatically */}
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border transition-colors ${
                                room.status === "ACTIVE" 
                                    ? "bg-primary/10 text-primary border-primary/20" 
                                    : "bg-muted text-muted-foreground border-border"
                            }`}>
                                {room.status}
                            </div>
                        </div>

                        {room.status === "ACTIVE" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pt-4 border-t border-border flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">In Consultation</span>
                                </div>
                                <button
                                    onClick={() => onComplete(room.id)}
                                    className="px-3 py-1 text-[10px] font-black bg-foreground text-background hover:bg-rose-500 hover:text-white rounded-lg transition-all uppercase tracking-widest shadow-sm active:scale-95"
                                >
                                    Release
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}