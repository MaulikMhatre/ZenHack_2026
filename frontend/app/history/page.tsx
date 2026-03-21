

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Search, Activity, Calendar, ArrowLeft, Filter, AlertCircle, FileText, Scissors, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { endpoints } from '@/utils/api';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"CLINICAL" | "SURGERY" | "OPD">("CLINICAL");
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        setError(null);
        let url = "";
        if (activeTab === "CLINICAL") url = endpoints.historyByDate(selectedDate);
        else if (activeTab === "SURGERY") url = endpoints.historySurgery;
        else url = endpoints.historyOpd;

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Server Error ${res.status}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError("Could not connect to the medical server. Check backend status.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDate, activeTab]);

  const filteredHistory = history.filter(item => {
    const name = (item.patient_name || "").toLowerCase();
    const surgeon = (item.surgeon_name || "").toLowerCase();
    const condition = (item.condition || "").toLowerCase();
    const icd = (item.icd_code || "").toLowerCase();
    const id = (item.id?.toString() || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return name.includes(search) || surgeon.includes(search) || condition.includes(search) || icd.includes(search) || id.includes(search);
  });

  const getUrgencyBadge = (urgency: string) => {
    const normalized = urgency?.toUpperCase();
    if (normalized === 'CRITICAL' || normalized === 'EMERGENCY') {
      return <span className="px-2 py-0.5 rounded border text-rose-500 bg-rose-500/10 border-rose-500/20 font-black text-[8px] uppercase tracking-widest">CRITICAL</span>;
    }
    if (normalized === 'URGENT') {
      return <span className="px-2 py-0.5 rounded border text-amber-500 bg-amber-500/10 border-amber-500/20 font-black text-[8px] uppercase tracking-widest">URGENT</span>;
    }
    return <span className="px-2 py-0.5 rounded border text-emerald-500 bg-emerald-500/10 border-emerald-500/20 font-black text-[8px] uppercase tracking-widest">STABLE</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans transition-colors duration-500 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
                {activeTab === "CLINICAL" && <Clock className="text-primary w-6 h-6" />}
                {activeTab === "SURGERY" && <Scissors className="text-purple-500 w-6 h-6" />}
                {activeTab === "OPD" && <Microscope className="text-emerald-500 w-6 h-6" />}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
                {activeTab === "CLINICAL" && "Clinical Logs"}
                {activeTab === "SURGERY" && "Surgical Logs"}
                {activeTab === "OPD" && "OPD History"}
              </h1>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground font-medium tracking-wide pl-16 uppercase text-[10px]">
              Secure Archival Record System • PHRELIS OS
            </motion.p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex bg-muted p-1 rounded-xl border border-border shadow-inner">
            {[
              { id: "CLINICAL", icon: <Activity size={14} />, label: "Clinical", color: "bg-primary" },
              { id: "SURGERY", icon: <Scissors size={14} />, label: "Surgery", color: "bg-purple-600" },
              { id: "OPD", icon: <Microscope size={14} />, label: "OPD Logs", color: "bg-emerald-600" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-lg` : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border hover:bg-muted transition-all shadow-sm">
              <ArrowLeft size={16} className="text-muted-foreground group-hover:text-foreground" />
              <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground uppercase tracking-widest">Admin</span>
            </Link>

            {activeTab === "CLINICAL" && (
              <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-xl border border-border shadow-sm">
                <Calendar size={18} className="text-primary" />
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-foreground font-mono text-sm outline-none cursor-pointer uppercase tracking-widest dark:[&::-webkit-calendar-picker-indicator]:invert" />
              </div>
            )}
          </div>
        </header>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <input type="text" placeholder={`Search ${activeTab.toLowerCase()} records...`} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border focus:border-primary/50 outline-none text-foreground transition-all shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="px-6 py-4 rounded-2xl bg-card border border-border text-muted-foreground hover:text-foreground flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all shadow-sm"><Filter size={16} />Filter</button>
        </div>

        {/* DATA TABLE */}
        <div className="rounded-[2rem] border border-border bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-500">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Retrieving Archives...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Timestamp</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Patient Identity</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Admission ID</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">{activeTab === "CLINICAL" ? "Status" : activeTab === "SURGERY" ? "Surgeon" : "Clinical Intel"}</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">{activeTab === "CLINICAL" ? "Triage Level" : activeTab === "SURGERY" ? "Duration" : "AI Rationale"}</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">{activeTab === "CLINICAL" ? "Acuity" : activeTab === "SURGERY" ? "Overtime" : "Score"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((row, i) => (
                      <motion.tr key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="group hover:bg-primary/[0.02] transition-colors relative">
                        <td className="p-6">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {(() => {
                              const rawDate = row.timestamp || row.end_time || row.check_in_time;
                              if (!rawDate) return "N/A";
                              const dateStr = rawDate.endsWith('Z') ? rawDate : `${rawDate}Z`;
                              const dateObj = new Date(dateStr);
                              return isNaN(dateObj.getTime()) ? "TIME ERROR" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            })()}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="font-black text-foreground text-lg tracking-tight uppercase">{row.patient_name || "Unknown Patient"}</div>
                          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Age: {row.patient_age} • {row.gender || "N/A"}</div>
                        </td>
                        <td className="p-6">
                          {row.admission_uid ? (
                            <span className="font-mono text-xs text-primary font-black">{row.admission_uid}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic opacity-30">N/A</span>
                          )}
                        </td>
                        <td className="p-6">
                          {activeTab === "CLINICAL" && (
                            <div className="flex items-center gap-2">
                              <Activity size={16} className="text-primary" />
                              <span className="text-sm font-bold text-foreground/80">{row.condition || "Stable"}</span>
                            </div>
                          )}
                          {activeTab === "SURGERY" && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-purple-600 dark:text-purple-400">{row.surgeon_name}</span>
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded border border-border w-fit">Type: {row.surgery_type || 'General'}</span>
                            </div>
                          )}
                          {activeTab === "OPD" && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <Microscope size={14} className="text-emerald-500" />
                                <span className="text-sm font-black text-foreground">ICD: {row.icd_code || "N/A"}</span>
                              </div>
                              {getUrgencyBadge(row.triage_urgency)}
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          {activeTab === "CLINICAL" && (
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${row.esi_level === 1 ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-orange-500/10 border-orange-500 text-orange-500'}`}>
                              Level {row.esi_level}
                            </span>
                          )}
                          {activeTab === "SURGERY" && <span className="text-sm font-mono font-bold text-foreground/70">{row.total_duration_minutes}m</span>}
                          {activeTab === "OPD" && <p className="text-[10px] text-muted-foreground italic leading-relaxed max-w-[200px] line-clamp-2">"{row.icd_rationale || "AI log unavailable."}"</p>}
                        </td>
                        <td className="p-6">
                          {activeTab === "CLINICAL" && <span className="text-sm font-black text-muted-foreground uppercase italic">{row.acuity}</span>}
                          {activeTab === "SURGERY" && (
                            <span className={`text-sm font-black ${row.overtime_minutes > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {row.overtime_minutes > 0 ? `+${row.overtime_minutes}m` : "On Time"}
                            </span>
                          )}
                          {activeTab === "OPD" && (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                              <span className="text-sm font-mono font-black text-primary">{row.priority_score?.toFixed(1) || "0.0"}</span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-24 text-center opacity-30">
                        <FileText size={48} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm">Registry Empty</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}