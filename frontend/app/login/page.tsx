
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Lock, User, ChevronRight } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';  // [RBAC] Import useAuth

export default function LoginPage() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const { login } = useAuth();  // [RBAC] Get login function from AuthContext

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, password })
      });

      if (res.ok) {
        const data = await res.json();

        // [RBAC] Use AuthContext login instead of direct localStorage
        login(data.access_token, data.role as UserRole, data.staff_id);

        // Advanced RBAC Redirection with slight delay for "Success" animation
        setTimeout(() => {
          if (data.role === 'Nurse') router.push('/staff/worklist');
          else if (data.role === 'Doctor') router.push('/dashboard');
          else router.push('/admin');
        }, 800);
      } else {
        alert("Unauthorized Access Attempt Detected");
        setIsAuthenticating(false);
      }
    } catch (err) {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden selection:bg-indigo-500/30">

      {/* BACKGROUND SURGICAL GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      {/* LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-1 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem]"
      >
        <div className="bg-[#0a0f1d]/90 backdrop-blur-2xl p-10 rounded-[2.4rem] border border-white/5 shadow-2xl">

          {/* BRANDING NODE */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              animate={{ boxShadow: ["0 0 20px rgba(79,70,229,0.2)", "0 0 40px rgba(79,70,229,0.4)", "0 0 20px rgba(79,70,229,0.2)"] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40"
            >
              <Activity className="text-white" size={32} />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">
              PHRELIS <span className="text-indigo-500">OS</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">Staff Authentication Node</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* STAFF ID INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Credential ID</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="e.g. N-01"
                  required
                  className="w-full h-14 pl-12 pr-4 bg-black/40 border border-white/5 focus:border-indigo-500 rounded-2xl text-white placeholder-slate-600 outline-none transition-all font-medium"
                  onChange={(e) => setStaffId(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full h-14 pl-12 pr-4 bg-black/40 border border-white/5 focus:border-indigo-500 rounded-2xl text-white placeholder-slate-600 outline-none transition-all font-medium"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              disabled={isAuthenticating}
              className="relative w-full h-14 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all overflow-hidden group shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
            >
              <AnimatePresence mode="wait">
                {isAuthenticating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Activity className="animate-spin" size={16} />
                    Verifying...
                  </motion.div>
                ) : (
                  <motion.div
                    key="static"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    Establish Link <ChevronRight size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          {/* FOOTER METRICS */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Orbital Link Encrypted</span>
            </div>
            <p className="text-[8px] text-slate-700 text-center uppercase tracking-tighter max-w-[200px]">
              By accessing this system you agree to the HIPAA Compliance Protocols. All sessions are logged.
            </p>
          </div>
        </div>
      </motion.div>

      {/* DECORATIVE GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
    </div>
  );
}