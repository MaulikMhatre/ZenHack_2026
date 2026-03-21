import React from "react";
import SurgeryCard from "./SurgeryCard";
import { Scissors } from "lucide-react";

interface SurgerySectionProps {
    beds: any[]; // Using any to match the loose typing in AdminPanel for now
    onRefresh: () => void;
    onAdmit: (bed: any) => void;
}

export default function SurgerySection({ beds, onRefresh, onAdmit }: SurgerySectionProps) {
    const surgeryBeds = beds.filter((b) => b.type === "Surgery");

    if (surgeryBeds.length === 0) return null;

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-3xl border border-blue-500/20 relative overflow-hidden">
            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 border-b border-blue-500/30 pb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Scissors className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-blue-100">
                        Surgery Unit
                        <span className="ml-3 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                            {surgeryBeds.length} Rooms
                        </span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {surgeryBeds.map((bed) => (
                        <SurgeryCard
                            key={bed.id}
                            room={{
                                id: bed.id,
                                current_state: bed.current_state || bed.status, // Fallback if current_state null
                                patient_name: bed.patient_name,
                                surgeon_name: bed.surgeon_name,
                                expected_end_time: bed.expected_end_time,
                                is_occupied: bed.is_occupied
                            }}
                            onUpdate={onRefresh}
                            onAdmit={() => onAdmit(bed)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}