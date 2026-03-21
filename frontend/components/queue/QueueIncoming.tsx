
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Activity, Thermometer, Droplets, User, Info, Sparkles, AlertTriangle } from "lucide-react";

export default function QueueIncoming({ onCheckIn }: { onCheckIn: (data: any) => void }) {
    const [formData, setFormData] = useState({
        patient_name: "",
        patient_age: "",
        gender: "Male",
        base_acuity: "3",
        complaint: "",
        symptoms: "",
        icd_code: "",
        icd_description: "",
        icd_rationale: "",
        triage_urgency: "",
        hr: "",
        bp: "",
        spo2: ""
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAIAnalyze = async () => {
        if (!formData.complaint && !formData.symptoms) {
            setError("Please enter a complaint or symptoms first.");
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:8000/api/clinical/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    complaint: formData.complaint,
                    symptoms: formData.symptoms
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "AI classification failed.");
            }

            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                icd_code: data.icd_code,
                icd_description: data.official_description,
                icd_rationale: data.clinical_rationale,
                triage_urgency: data.triage_urgency
            }));
        } catch (err: any) {
            console.error("AI Analysis failed", err);
            setError(err.message || "Failed to fetch AI analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            patient_name: formData.patient_name,
            patient_age: parseInt(formData.patient_age),
            gender: formData.gender,
            base_acuity: parseInt(formData.base_acuity),
            symptoms: formData.symptoms.split(",").map((s: string) => s.trim()).filter((s: string) => s),
            icd_code: formData.icd_code || null,
            icd_rationale: formData.icd_rationale || null,
            triage_urgency: formData.triage_urgency || null,
            vitals: {
                hr: parseInt(formData.hr) || 0,
                bp: formData.bp || "120/80",
                spo2: parseInt(formData.spo2) || 98
            }
        };
        onCheckIn(submitData);
        setFormData({
            patient_name: "", patient_age: "", gender: "Male",
            base_acuity: "3", complaint: "", symptoms: "", icd_code: "",
            icd_description: "", icd_rationale: "", triage_urgency: "",
            hr: "", bp: "", spo2: ""
        });
        setError(null);
    };

    // Semantic Input Classes
    const inputClasses = "w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 shadow-inner";

    return (
        <motion.div
            layout
            className="relative p-6 border border-border bg-card/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl dark:shadow-none transition-all duration-500"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
                    <PlusCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic leading-none">Bio-Intake</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Operational Protocol v2.5</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                            <User className="w-3 h-3 text-primary" /> Patient Identity
                        </label>
                        <input
                            required
                            className={inputClasses}
                            placeholder="Full Legal Name"
                            value={formData.patient_name}
                            onChange={e => setFormData({ ...formData, patient_name: e.target.value })}
                        />
                    </div>

                    <div className="col-span-4 space-y-2">
                        <input
                            required
                            type="number"
                            className={inputClasses}
                            placeholder="Age"
                            value={formData.patient_age}
                            onChange={e => setFormData({ ...formData, patient_age: e.target.value })}
                        />
                    </div>
                    <div className="col-span-8">
                        <select
                            className={`${inputClasses} appearance-none cursor-pointer`}
                            value={formData.gender}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option className="bg-card text-foreground">Male</option>
                            <option className="bg-card text-foreground">Female</option>
                            <option className="bg-card text-foreground">Other</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4 bg-muted/40 p-5 rounded-[2rem] border border-border">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Info className="w-3 h-3 text-primary" /> Clinical Context
                        </label>
                        <input
                            className={inputClasses}
                            placeholder="Primary Complaint"
                            value={formData.complaint}
                            onChange={e => setFormData({ ...formData, complaint: e.target.value })}
                        />
                        <textarea
                            className={`${inputClasses} min-h-[80px] resize-none`}
                            placeholder="Supporting Symptoms (Comma separated)"
                            value={formData.symptoms}
                            onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleAIAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                        {isAnalyzing ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                <Sparkles className="w-4 h-4" />
                            </motion.div>
                        ) : <Sparkles className="w-4 h-4" />}
                        {isAnalyzing ? "Processing..." : "AI Analyze Core"}
                    </button>

                    <AnimatePresence>
                        {formData.icd_code && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-3 p-4 bg-card rounded-2xl border border-border shadow-inner"
                            >
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 uppercase">
                                        ICD: {formData.icd_code}
                                    </span>
                                    <span className={`font-black px-2 py-1 rounded-lg border uppercase ${
                                        formData.triage_urgency === 'CRITICAL' || formData.triage_urgency === 'EMERGENCY' 
                                        ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' 
                                        : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                                    }`}>
                                        {formData.triage_urgency}
                                    </span>
                                </div>
                                <p className="text-[11px] text-foreground font-bold italic opacity-80">{formData.icd_description}</p>
                                <div className="p-3 bg-muted/60 rounded-xl text-[10px] text-muted-foreground leading-relaxed font-mono">
                                    {formData.icd_rationale}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "HR", icon: Activity, color: "text-rose-500", key: "hr" },
                        { label: "BP", icon: Droplets, color: "text-blue-500", key: "bp" },
                        { label: "SpO2", icon: Thermometer, color: "text-emerald-500", key: "spo2" }
                    ].map(vital => (
                        <div key={vital.label} className="bg-muted/50 p-4 rounded-2xl border border-border flex flex-col items-center">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${vital.color} flex items-center gap-1.5 mb-2`}>
                                <vital.icon className="w-3 h-3" /> {vital.label}
                            </span>
                            <input
                                placeholder="--"
                                className="w-full bg-transparent text-foreground text-base font-black text-center focus:outline-none"
                                value={(formData as any)[vital.key]}
                                onChange={e => setFormData({ ...formData, [vital.key]: e.target.value })}
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-primary" /> ESI Triage Selector
                    </label>
                    <div className="grid grid-cols-5 p-2 bg-muted/50 rounded-2xl border border-border gap-2">
                        {["1", "2", "3", "4", "5"].map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setFormData({ ...formData, base_acuity: level })}
                                className={`py-3 text-[11px] font-black rounded-xl transition-all ${formData.base_acuity === level
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-5 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.4em] rounded-[2rem] shadow-xl shadow-primary/20 border border-primary/20"
                >
                    Commit Check-In
                </motion.button>
            </form>
        </motion.div>
    );
}