"use client";

import { motion } from "framer-motion";

interface PriorityOrbProps {
    score: number; // 0 - 100+
    acuity: number; // ESI 1-5
}

export default function PriorityOrb({ score, acuity }: PriorityOrbProps) {
    // Medical-grade color palette with high-contrast glow values
    const getTheme = () => {
        if (acuity <= 2) return {
            base: "bg-rose-500",
            glow: "shadow-[0_0_25px_rgba(244,63,94,0.8)]",
            aura: "bg-rose-500/20",
            border: "border-rose-500/30"
        };
        if (acuity === 3) return {
            base: "bg-amber-400",
            glow: "shadow-[0_0_25px_rgba(251,191,36,0.8)]",
            aura: "bg-amber-400/20",
            border: "border-amber-400/30"
        };
        return {
            base: "bg-emerald-400",
            glow: "shadow-[0_0_25px_rgba(52,211,153,0.8)]",
            aura: "bg-emerald-400/20",
            border: "border-emerald-400/30"
        };
    };

    const theme = getTheme();
    
    // Heartbeat logic: Higher score = more frequent and "sharp" pulses
    const pulseDuration = Math.max(0.4, 2.0 - (score / 80));

    return (
        <div className="relative flex items-center justify-center w-10 h-10 mr-2 group">
            {/* Outer Static Glass Ring */}
            <div className={`absolute inset-0 rounded-full border ${theme.border} scale-90 opacity-20`} />

            {/* Atmosphere Aura (Wide Blur) */}
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: pulseDuration * 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className={`absolute inset-0 rounded-full blur-xl ${theme.aura}`}
            />

            {/* Secondary Pulse Ring */}
            <motion.div
                animate={{
                    scale: [1, 2.5, 1],
                    opacity: [0.4, 0, 0.4],
                }}
                transition={{
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: "circOut",
                }}
                className={`absolute w-3 h-3 rounded-full border border-current ${theme.base.replace('bg-', 'text-')}`}
            />

            {/* The Core Orb */}
            <motion.div
                animate={{
                    scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className={`relative w-3 h-3 rounded-full ${theme.base} ${theme.glow} z-10`}>
                
                {/* Inner Highlight Refraction */}
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/40 rounded-full blur-[1px]" />
            </motion.div>

            {/* Tooltip on Hover (Optional ERP UX) */}
            <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[8px] font-black bg-slate-900 border border-white/10 px-2 py-0.5 rounded whitespace-nowrap text-white tracking-widest uppercase">
                    ESI {acuity} PRIORITY
                </span>
            </div>
        </div>
    );
}