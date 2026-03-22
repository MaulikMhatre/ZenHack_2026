"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Cpu, UploadCloud, Microscope, Zap, 
    Check, UserCircle2, UserPlus, Activity, 
    RefreshCw, Stethoscope
} from "lucide-react";
import { analyzeXray } from "@/utils/radiologyService";

const DOCTORS = [
    { id: "doc-1", name: "Dr. Sarah Chen", specialty: "Radiology" },
    { id: "doc-2", name: "Dr. Marcus Thorne", specialty: "Neurology" },
    { id: "doc-3", name: "Dr. Elena Vance", specialty: "Emergency" },
];

export default function RadiologySentinelPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- RESET / REFRESH SYSTEM ---
    const resetSystem = () => {
        setFile(null);
        setPreview(null);
        setResults(null);
        setSelectedDoctorId(null);
        setShowSuccess(false);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResults(null);
        setShowSuccess(false);
        try {
            const data = await analyzeXray(file, "PATIENT-001");
            setResults(data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleAssign = async () => {
        if (!selectedDoctorId) return;
        setAssigning(true);
        
        try {
            // Logic: await fetch('/api/assign', { doctorId: selectedDoctorId, report: results })
            await new Promise(r => setTimeout(r, 1200)); 
            
            // Trigger Refresh Sequence
            setShowSuccess(true);
            setTimeout(() => {
                resetSystem(); // Auto-refresh for the next scan after 3 seconds
            }, 3000);
            
        } catch (err) {
            console.error(err);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-hidden select-none">
            
            {/* Header */}
            <header className="relative z-50 border-b border-border bg-card/60 backdrop-blur-xl px-10 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                        <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Phrelis <span className="text-primary">Sentinel</span></span>
                        <span className="text-[8px] font-black text-muted-foreground tracking-[0.5em] uppercase mt-1">Diagnostic Intelligence Node</span>
                    </div>
                </div>
                {results && (
                    <button onClick={resetSystem} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary">
                        <RefreshCw size={16} />
                    </button>
                )}
            </header>

            <main className="max-w-[1800px] mx-auto p-10 grid grid-cols-12 gap-12 h-[calc(100vh-120px)] overflow-hidden">
                
                {/* 1. Intake Column */}
                <section className="col-span-3 flex flex-col gap-6">
                    <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">Specimen Intake</h2>
                    <div onClick={() => !showSuccess && fileInputRef.current?.click()} className="relative aspect-square rounded-[2rem] border border-border bg-card/40 backdrop-blur-md overflow-hidden cursor-pointer group hover:border-primary/50 transition-all">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if(f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                        }} />
                        {preview ? <img src={preview} alt="Scan" className="w-full h-full object-cover opacity-80" /> : 
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                            <Zap className="mb-2 text-primary" /> 
                            <span className="text-[8px] font-black uppercase tracking-widest">Initialize Link</span>
                        </div>}
                        {loading && <motion.div animate={{ top: ["0%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute w-full h-[2px] bg-primary z-20 shadow-[0_0_10px_var(--primary)]" />}
                    </div>
                    <button onClick={handleUpload} disabled={loading || !file || showSuccess} className="w-full py-5 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.3em] disabled:opacity-20 transition-all shadow-lg shadow-primary/20">
                        {loading ? "Neural Mapping..." : "Process Diagnostic"}
                    </button>
                </section>

                {/* 2. Analysis Output */}
                <section className="col-span-5 flex flex-col gap-6 overflow-hidden">
                    <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">Neural Analysis Hub</h2>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-hidden space-y-4">
                        <AnimatePresence mode="wait">
                            {results ? (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                    {Object.entries(results.findings).map(([key, value]: any) => (
                                        <div key={key} className="bg-card/30 border border-border/50 p-6 rounded-[1.5rem] flex items-center justify-between group hover:bg-card/50 transition-all">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{key}</p>
                                                <p className={`text-4xl font-black italic tracking-tighter ${value > 0.5 ? 'text-rose-500' : 'text-foreground'}`}>{(value * 100).toFixed(1)}%</p>
                                            </div>
                                            <div className={`h-1.5 w-24 rounded-full overflow-hidden ${value > 0.5 ? 'bg-rose-500/20' : 'bg-primary/10'}`}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className={`h-full ${value > 0.5 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-primary/40'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                                    <Activity className="w-12 h-12 mb-4 animate-pulse" />
                                    <p className="font-black uppercase text-[10px] tracking-widest">Awaiting Uplink</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* 3. Assignment Column */}
                <section className="col-span-4 flex flex-col gap-6 relative">
                    <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">Physician Deployment</h2>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {DOCTORS.map((doc) => (
                            <div 
                                key={doc.id}
                                onClick={() => !showSuccess && setSelectedDoctorId(doc.id)}
                                className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 ${
                                    selectedDoctorId === doc.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-card/20 border-border/60 hover:border-primary/40'
                                } ${showSuccess && selectedDoctorId !== doc.id ? 'opacity-20 grayscale' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${selectedDoctorId === doc.id ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground'}`}><UserCircle2 size={20} /></div>
                                    <div>
                                        <p className="font-black uppercase text-sm tracking-tighter leading-none mb-1">{doc.name}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{doc.specialty}</p>
                                    </div>
                                    {selectedDoctorId === doc.id && <Check className="ml-auto text-primary" size={18} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="mt-auto">
                        <button 
                            onClick={handleAssign}
                            disabled={!selectedDoctorId || showSuccess || assigning}
                            className={`w-full py-6 rounded-2xl font-black text-[10px] tracking-[0.5em] uppercase transition-all duration-500 relative overflow-hidden ${
                                showSuccess 
                                ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]" 
                                : "bg-foreground text-background hover:bg-primary hover:text-white disabled:opacity-20"
                            }`}
                        >
                            {assigning ? "Linking Neural Channels..." : showSuccess ? "Deployment Successful" : "Confirm Assignment"}
                            
                            {/* Scanning Light Effect on Success */}
                            {showSuccess && (
                                <motion.div animate={{ left: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                            )}
                        </button>
                        
                        {showSuccess && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[8px] font-black uppercase text-emerald-500 mt-4 tracking-[0.2em] animate-pulse">
                                System refreshing for next cycle...
                            </motion.p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}