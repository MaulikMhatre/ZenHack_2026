
"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Shield, Activity, User, Search, RefreshCcw, Lock, Terminal } from "lucide-react";
import Link from 'next/link';


interface AuditLog {
    id: number;
    timestamp: string;
    staff_id: string;
    staff_role: string;
    action: string;
    resource_path: string;
    details: string;
    ip_address: string;
}

const RiskDot = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
        high: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
        medium: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
        low: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    };
    return <div className={`w-2.5 h-2.5 rounded-full ${colors[level] || "bg-muted"}`} />;
};

const RoleBadge = ({ role }: { role: string }) => {
    const styles: Record<string, string> = {
        Admin: "bg-primary/10 text-primary border-primary/20",
        Doctor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        Nurse: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
    return (
        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${styles[role] || "bg-muted text-muted-foreground border-border"}`}>
            {role}
        </span>
    );
};

export default function SystemSentinel() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adminName, setAdminName] = useState("System Administrator");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8000/api/admin/audit-logs", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 403) throw new Error("CRITICAL_SECURITY_BREACH: Access Denied.");
                throw new Error("Failed to fetch audit logs.");
            }

            const data = await res.json();
            setLogs(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const storedName = localStorage.getItem("staff_name");
        if (storedName) setAdminName(storedName);
    }, []);

    const getRiskLevel = (action: string) => {
        if (action === "CRITICAL_SECURITY_BREACH" || action.includes("DELETE")) return "high";
        if (action.includes("FINANCE") || action.includes("BILLING") || action === "SUCCESSFUL_LOGIN") return "medium";
        return "low";
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500 selection:bg-primary/30">
            
            {/* Header Banner - Semantic Backgrounds */}
            <div className="bg-card/50 backdrop-blur-md border-b border-border px-8 py-6 flex justify-between items-center sticky top-0 z-50 transition-all">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm transition-transform hover:scale-105">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                            Phrelis System Sentinel
                        </h1>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] flex items-center gap-2 mt-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            Live Security Feed • HIPAA-OS 2.4
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right hidden md:block">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Secure Access Verified</p>
                        <p className="font-black text-sm text-foreground uppercase tracking-tight">{adminName}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchLogs}
                            className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-primary"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <Link href="/admin" className="px-6 py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
                            Return
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8 space-y-8">
                {/* Statistics Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Active Sessions", value: "12", icon: User, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                        { label: "Events (24h)", value: logs.length.toString(), icon: Activity, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
                        { label: "Risk Alerts", value: logs.filter(l => getRiskLevel(l.action) === "high").length.toString(), icon: Shield, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                        { label: "Archival Status", value: "SECURE", icon: Lock, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-card p-8 rounded-[2rem] border ${stat.border} flex items-center justify-between group transition-all shadow-sm dark:shadow-none`}>
                            <div>
                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                <p className={`text-4xl font-black mt-2 tracking-tighter ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon size={28} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Audit Table */}
                <div className="bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden transition-all duration-500">
                    <div className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/30">
                        <div className="flex items-center gap-4">
                            <Terminal size={20} className="text-primary" />
                            <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">
                                Auditor Log Feed
                            </h2>
                            <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 uppercase tracking-[0.2em]">End-to-End Encrypted</span>
                        </div>
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search archives..."
                                className="w-full pl-12 pr-4 py-3 bg-background border border-border focus:border-primary rounded-2xl text-xs font-bold text-foreground placeholder:opacity-30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-b border-border">
                                    <th className="px-8 py-6">Risk</th>
                                    <th className="px-8 py-6">Precise Time</th>
                                    <th className="px-8 py-6">Identity</th>
                                    <th className="px-8 py-6">Activity Descriptor</th>
                                    <th className="px-8 py-6">Path</th>
                                    <th className="px-8 py-6 text-right">Access IP</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-border font-medium">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-40">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-primary font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Decrypting Records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-muted-foreground font-bold uppercase tracking-widest text-xs">
                                            No secure logs detected in this cycle.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <RiskDot level={getRiskLevel(log.action)} />
                                            </td>
                                            <td className="px-8 py-6 font-mono text-muted-foreground text-xs font-bold tracking-tight">
                                                {format(new Date(log.timestamp), "dd MMM yyyy • HH:mm:ss")}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <RoleBadge role={log.staff_role} />
                                                    <span className="font-black text-foreground text-xs uppercase tracking-tight">{log.staff_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-foreground font-black text-sm tracking-tight">{log.details || log.action}</p>
                                                <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1 opacity-60">{log.action}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <code className="text-[10px] bg-muted px-3 py-1.5 rounded-lg text-primary font-bold border border-border font-mono">
                                                    {log.resource_path}
                                                </code>
                                            </td>
                                            <td className="px-8 py-6 text-right font-mono text-xs text-muted-foreground font-bold italic opacity-40">
                                                {log.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Floating Security Alert */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 bg-card border border-rose-500/50 text-rose-500 px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-6 z-[100]"
                    >
                        <div className="p-3 bg-rose-500/10 rounded-xl animate-pulse">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Sentinel Alert</p>
                            <p className="text-sm font-bold opacity-80">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}