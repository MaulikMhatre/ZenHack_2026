"use client";
import { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Patient {
    admission_uid: string;
    patient_name: string;
    bed_id: string;
    status: string;
}

interface PatientListProps {
    patients: Patient[];
}

export default function PatientList({ patients }: PatientListProps) {
    console.log("PatientList Rendered with patients:", patients);
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (uid: string) => {
        navigator.clipboard.writeText(uid);
        setCopied(uid);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!patients) return null; // Only return null if prop is missing, show empty state otherwise

    return (
        <div className="bg-[#0b0b0b] border-2 border-indigo-500 rounded-[2.5rem] p-8 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.2)] relative z-20">
            <div className="text-[10px] text-indigo-500 font-bold mb-2 uppercase tracking-widest">[System Check: Patient List Active]</div>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Users size={20} />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Active Admissions</h2>
            </div>

            <div className="overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-white/5 font-bold uppercase text-xs tracking-wider sticky top-0 backdrop-blur-md">
                        <tr>
                            <th className="p-3 rounded-l-lg">Patient</th>
                            <th className="p-3">Bed</th>
                            <th className="p-3">UID</th>
                            <th className="p-3 rounded-r-lg text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {patients.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500 italic font-mono text-xs">
                                    No active admissions found in the grid.
                                </td>
                            </tr>
                        ) : (
                            patients.map((p, i) => (
                                <tr
                                    key={p.admission_uid}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="p-3 font-medium text-white">{p.patient_name}</td>
                                    <td className="p-3 font-mono text-xs">{p.bed_id}</td>
                                    <td className="p-3 font-mono text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">
                                        {p.admission_uid}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => copyToClipboard(p.admission_uid)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                            title="Copy UID"
                                        >
                                            {copied === p.admission_uid ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
