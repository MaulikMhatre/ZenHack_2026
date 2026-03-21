

"use client";

import React, { useState } from 'react';
import { User, Heart, Activity, CheckCircle, AlertTriangle, ArrowRight, Activity as Pulse, ShieldAlert, Binary, Fingerprint, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { endpoints } from '@/utils/api';

interface TriageResponse {
  patient_name: string;
  patient_age: number;
  esi_level: number;
  acuity: string;
  assigned_bed: string;
  color: string;
  action: string;
  ai_justification: string;
}

export default function TriagePage() {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    gender: '', 
    spo2: '',
    heart_rate: '',
    symptoms: ''
  });
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.gender) return alert("Please select Subject Gender");

    setLoading(true);
    try {
      const res = await fetch(endpoints.triageAssess, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: formData.patient_name,
          patient_age: parseInt(formData.patient_age),
          gender: formData.gender,
          vitals: {
            spo2: parseInt(formData.spo2),
            heart_rate: parseInt(formData.heart_rate),
          },
          symptoms: formData.symptoms.split(',').map(s => s.trim())
        })
      });

      if (!res.ok) throw new Error("System Link Error");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ patient_name: '', patient_age: '', gender: '', spo2: '', heart_rate: '', symptoms: '' });
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans transition-colors duration-500 selection:bg-primary/30">
      
      {/* Background Ambience - Automatically adjusts via primary/10 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 flex justify-between items-end border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <Fingerprint size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Biometric Intake Phase</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none">
              Phrelis<span className="text-primary">OS</span>
            </h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">System Protocol</p>
            <p className="text-xs font-bold text-foreground uppercase tracking-tighter">AI-Triage.v2.4</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-[2.5rem] p-10 shadow-xl dark:shadow-none relative overflow-hidden group transition-all duration-500">
              
              <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                {errorMsg && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="text-rose-500" size={20} />
                    <span className="text-sm font-bold text-rose-500 uppercase">{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Subject Identity</label>
                    <input
                      type="text" required value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      className="w-full bg-background border border-border rounded-2xl p-5 text-foreground focus:border-primary/40 outline-none font-bold placeholder:opacity-20 transition-all"
                      placeholder="SCANNING FULL LEGAL NAME..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Age (Cycles)</label>
                      <input
                        type="number" required value={formData.patient_age}
                        onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                        className="w-full bg-background border border-border rounded-2xl p-5 text-foreground focus:border-primary/40 outline-none font-bold transition-all"
                        placeholder="00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Biological Gender</label>
                      <select
                        required value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full bg-background border border-border rounded-2xl p-5 text-foreground focus:border-primary/40 outline-none font-bold appearance-none cursor-pointer"
                      >
                        <option value="" disabled>SELECT</option>
                        <option value="Male">MALE</option>
                        <option value="Female">FEMALE</option>
                        <option value="Other">OTHER</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Pulse size={12} className="text-blue-500" /> SpO2 Saturation
                    </label>
                    <input
                      type="number" required value={formData.spo2}
                      onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                      className="w-full bg-background border border-border rounded-2xl p-5 text-blue-500 focus:border-blue-500/40 outline-none font-black text-3xl font-mono"
                      placeholder="98"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Heart size={12} className="text-rose-500" /> BPM Frequency
                    </label>
                    <input
                      type="number" required value={formData.heart_rate}
                      onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                      className="w-full bg-background border border-border rounded-2xl p-5 text-rose-500 focus:border-rose-500/40 outline-none font-black text-3xl font-mono"
                      placeholder="72"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Presenting Pathologies</label>
                  <textarea
                    required rows={3} value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full bg-background border border-border rounded-2xl p-5 text-foreground focus:border-primary/40 outline-none font-bold resize-none placeholder:opacity-20 transition-all"
                    placeholder="ENTER SYMPTOMS SEPARATED BY COMMAS..."
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-6 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-4 tracking-[0.4em] uppercase text-[10px] shadow-lg active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Establish Triage Link <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden transition-all duration-500 text-center">
              
              <div className={`absolute top-0 left-0 w-full h-2 ${result.esi_level <= 2 ? 'bg-rose-500' : 'bg-emerald-500'}`} />

              <div className="mb-12">
                <div className={`mx-auto w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border-2 ${
                  result.esi_level <= 2 ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                }`}>
                  {result.esi_level <= 2 ? <ShieldAlert size={48} /> : <CheckCircle size={48} />}
                </div>
                <h2 className="text-4xl font-black text-foreground mb-2 uppercase tracking-tighter italic">Assessment Complete</h2>
                <span className={`px-6 py-2 rounded-full font-black text-[10px] tracking-[0.3em] border ${
                  result.esi_level <= 2 ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                }`}>
                  ESI PRIORITY: LEVEL {result.esi_level}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
                <div className="p-8 rounded-[2rem] bg-muted/30 border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={12} className="text-primary" /> Subject Identity
                  </p>
                  <span className="text-3xl font-black text-foreground uppercase leading-none tracking-tighter">{result.patient_name}</span>
                  <p className="text-xs font-bold text-muted-foreground mt-2">{result.patient_age} Cycles • {formData.gender}</p>
                </div>

                <div className="p-8 rounded-[2rem] bg-muted/30 border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Binary size={12} className="text-primary" /> Unit Allocation
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-primary uppercase leading-none italic tracking-tighter">{result.assigned_bed}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]" />
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Sync Active</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 p-8 rounded-[2rem] bg-muted/30 border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">Diagnostic Acuity Profile</p>
                  <div className="flex flex-col gap-1">
                    <span className={`text-2xl font-black uppercase tracking-tight ${result.esi_level <= 2 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {result.acuity} STATUS: {result.esi_level <= 2 ? 'CRITICAL CARE' : 'STABLE'}
                    </span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 italic">AI Neural Justification</p>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed italic border-l-2 border-border pl-4">
                      &quot;{result.ai_justification}&quot;
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={resetForm}
                className="w-full md:w-auto px-16 py-5 bg-foreground text-background font-black rounded-2xl transition-all shadow-xl uppercase text-[10px] tracking-[0.4em] active:scale-95"
              >
                Reset Intake Portal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}