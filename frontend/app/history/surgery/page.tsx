
"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Scissors, Activity, User, Calendar, RefreshCcw, Search } from "lucide-react";

export default function CombinedHistoryPage() {
    const [view, setView] = useState<"GENERAL" | "SURGERY">("GENERAL");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

   const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const today = new Date().toLocaleDateString('en-CA'); 
        const endpoint = view === "GENERAL" 
            ? `/api/history/day/${today}` 
            : `/api/history/surgery`;
        
        const res = await fetch(endpoint);
        
        if (!res.ok) {
            // FIX: Parse the error but don't throw the whole object
            const errorData = await res.json().catch(() => ({}));
            const msg = errorData.detail?.[0]?.msg || `Error ${res.status}`;
            throw new Error(msg); 
        }
        
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
    } catch (e) {
        // FIX: Ensure console.error logs a string, not an object
        console.error("Fetch error:", e instanceof Error ? e.message : String(e));
        setData([]); 
    } finally {
        setLoading(false);
    }
}, [view]);

useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
}, [fetchData]);

const filteredData = data.filter((item) => {
    // FIX: Add safe check to ensure item is an object before filtering
    if (!item || typeof item !== 'object') return false;
    
    const name = item.patient_name?.toLowerCase() || "";
    const surgeon = item.surgeon_name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || surgeon.includes(search);
});

    return (
        <div className="p-8 bg-slate-950 min-h-screen text-white font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/10 pb-6 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`p-2 rounded-lg ${view === "GENERAL" ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-400"}`}>
                            {view === "GENERAL" ? <Activity size={24} /> : <Scissors size={24} />}
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Hospital Archives</h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Secure Archival Record System • <span className="text-slate-200">{view === "GENERAL" ? "General Admissions" : "Surgical Records"}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text"
                            placeholder="Search records..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button 
                            onClick={() => { setView("GENERAL"); setSearchTerm(""); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === "GENERAL" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:text-white"}`}
                        >
                            <Activity size={16} /> Clinical
                        </button>
                        <button 
                            onClick={() => { setView("SURGERY"); setSearchTerm(""); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === "SURGERY" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "text-slate-400 hover:text-white"}`}
                        >
                            <Scissors size={16} /> Surgery
                        </button>
                    </div>

                    <button 
                        onClick={fetchData}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                    >
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase font-bold tracking-widest">
                        <tr>
                            <th className="p-5">Patient Identity</th>
                            <th className="p-5">{view === "GENERAL" ? "Condition / Acuity" : "Surgeon / Procedure"}</th>
                            <th className="p-5">Location</th>
                            <th className="p-5">{view === "GENERAL" ? "Triage Priority" : "Duration & Performance"}</th>
                            <th className="p-5 text-right">Finalized Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <RefreshCcw className="mx-auto mb-4 animate-spin text-blue-500" size={32} />
                                    <p className="text-slate-400 font-medium">Synchronizing Database...</p>
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-500 italic">
                                    No archival records match your filter.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((item, idx) => (
                                <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/10 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-100">{item.patient_name || "Anonymous"}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                    Age: {item.patient_age || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {view === "GENERAL" ? (
                                            <div className="text-slate-300 text-sm italic">"{item.condition}"</div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-purple-400 font-bold text-sm">{item.surgeon_name}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Attending Surgeon</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-400 font-mono">
                                            {view === "GENERAL" ? (item.bed_id || "Unit") : (item.room_id || "OR")}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {view === "GENERAL" ? (
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${
                                                item.esi_level <= 2 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                ESI Level {item.esi_level}
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-100 font-bold">{item.total_duration_minutes}m</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Elapsed</span>
                                                </div>
                                                {item.overtime_minutes > 0 ? (
                                                    <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold">
                                                        +{item.overtime_minutes}m DELAY
                                                    </div>
                                                ) : (
                                                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                                        ON TIME
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="text-slate-300 font-mono text-sm">
                                                {new Date(item.timestamp || item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                {new Date(item.timestamp || item.end_time).toLocaleDateString()}
                                            </div>
                                        </div>
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
















