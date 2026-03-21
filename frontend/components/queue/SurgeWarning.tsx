
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ChevronRight } from "lucide-react";

interface SurgeWarningProps {
    show: boolean;      
    score: number;     
    onActivate: () => void; 
    isActive: boolean;
}

export default function SurgeWarning({ show, score, onActivate, isActive }: SurgeWarningProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative border-b border-rose-500/30 overflow-hidden z-[100]"
                >
                    {/* Phrelis Hazard Pattern Layer - Theme Aware Opacity */}
                    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none" 
                         style={{ backgroundImage: `repeating-linear-gradient(45deg, #f43f5e 0, #f43f5e 2px, transparent 0, transparent 50%)`, backgroundSize: '15px 15px' }} 
                    />

                    {/* Kinetic Scanline Effect */}
                    <motion.div 
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent w-1/2 skew-x-12 pointer-events-none"
                    />

                    {/* Semantic Background: bg-card/80 provides frosting in light and dark mode */}
                    <div className="bg-card/80 backdrop-blur-2xl relative z-10 transition-colors duration-500">
                        <div className="max-w-[1800px] mx-auto px-10 py-3 flex items-center justify-between">
                            
                            <div className="flex items-center gap-6">
                                {/* Aggressive Alert Icon */}
                                <div className="relative">
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute inset-0 bg-rose-500 blur-md rounded-full"
                                    />
                                    <div className="relative p-2.5 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-500/20 border border-rose-400/50">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-black text-rose-600 dark:text-rose-500 text-xs tracking-[0.2em] uppercase italic leading-none">
                                            Critical Surge Detected
                                        </h4>
                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                                        <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">
                                            Load: High
                                        </span>
                                    </div>
                                    <p className="text-foreground/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                        Mean Acuity <span className="text-rose-600 dark:text-rose-500 tabular-nums font-black">{Math.round(score)}</span> 
                                        <span className="opacity-20">|</span> 
                                        Bypass Protocol: <span className="text-rose-600 dark:text-rose-400">Active</span>
                                        <span className="opacity-20">|</span> 
                                        Est. Delay: <span className="text-rose-600 dark:text-rose-500">+45m</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                {/* Live Metric Visualizer */}
                                <div className="hidden xl:flex items-center gap-4 px-5 py-2 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-rose-500/40 uppercase tracking-widest">Throughput</div>
                                        <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">Impaired</div>
                                    </div>
                                    <div className="flex gap-1 items-end h-6 w-12">
                                        {[0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
                                            <motion.div 
                                                key={i}
                                                animate={{ height: [`${h*100}%`, `${(h*0.4)*100}%`, `${h*100}%`] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                                                className="flex-1 bg-rose-500/40 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Action Button: Inverts based on state */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onActivate}
                                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg 
                                        ${isActive 
                                            ? "bg-rose-500 text-white shadow-rose-500/40" 
                                            : "bg-foreground text-background shadow-black/20"
                                        }`}
                                >
                                    {isActive ? "Triage Active" : "Activate Triage"}
                                    <ChevronRight className={`w-3 h-3 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}