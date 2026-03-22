
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AccessDeniedPage() {
    const router = useRouter();
    const { role } = useAuth();

    // Role-specific allowed modules
    const rolePermissions: any = {
        Admin: ['All Modules', 'Revenue Analytics', 'User Management', 'Surgery', 'Billing'],
        Doctor: ['OPD', 'Triage', 'Smart Nursing', 'Admin', 'Staff'],
        Nurse: ['OPD', 'Triage', 'Staff (Attendance)', 'Smart Nursing']
    };

    const allowedModules = role ? rolePermissions[role] : [];

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden transition-colors duration-500">

            {/* Background Effects - Dynamic Opacity based on theme */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 dark:bg-rose-500/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 dark:bg-amber-600/20 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-2xl mx-auto p-8"
            >
                <div className="bg-card/90 backdrop-blur-2xl p-10 md:p-14 rounded-[3rem] border border-border shadow-2xl transition-all duration-500">

                    {/* Security Icon Container */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 mx-auto mb-10 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center relative shadow-inner"
                    >
                        <ShieldX className="w-12 h-12 text-rose-500" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg">
                            <Lock className="w-4 h-4 text-amber-500" />
                        </div>
                    </motion.div>

                    {/* Dynamic Title */}
                    <h1 className="text-4xl md:text-5xl font-black text-foreground text-center mb-4 tracking-tighter uppercase italic">
                        Access <span className="text-rose-500">Denied</span>
                    </h1>

                    {/* Message */}
                    <p className="text-muted-foreground text-center mb-10 text-lg font-medium leading-relaxed">
                        Security Clearance Insufficient. <br/>
                        Unauthorized module access attempt logged.
                    </p>

                    {/* Role Credentials Block */}
                    <div className="bg-muted/40 border border-border rounded-[2.5rem] p-8 mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">
                                Verified Role: {role || 'GUEST'}
                            </p>
                        </div>

                        <p className="text-[10px] font-black text-muted-foreground mb-4 uppercase tracking-widest">Authorized Access Nodes:</p>

                        <div className="flex flex-wrap gap-2.5">
                            {allowedModules.map((module: string, index: number) => (
                                <motion.div
                                    key={module}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                    className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-tight text-primary"
                                >
                                    {module}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Action Hub */}
                    <div className="flex flex-col sm:flex-row gap-5">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 h-16 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group border border-border"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return
                        </button>

                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-primary/20"
                        >
                            Terminal Home
                        </button>
                    </div>

                    {/* System Footer */}
                    <div className="flex flex-col items-center mt-10 space-y-2 opacity-30">
                        <p className="text-[9px] font-black text-foreground uppercase tracking-[0.5em]">
                            Phrelis Sentinel System
                        </p>
                        <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            Protocol HIPAA-OS 2.4.9
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Decorative Theme-Aware Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.03] pointer-events-none" />
        </div>
    );
}