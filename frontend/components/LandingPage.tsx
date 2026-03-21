"use client";

import React from "react";
import { motion } from "framer-motion";
import Background3D from "./Background3D";

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* 3D Background */}
      <Background3D variant="full" />

      {/* Content Overlay */}
      <div className="z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          {/* Glowing backdrop for text */}
          <div className="absolute -inset-8 bg-indigo-500/10 rounded-[50%] blur-3xl opacity-50 animate-pulse"></div>
          
          <h1 className="relative text-7xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-600 tracking-tighter drop-shadow-2xl">
            PHRELIS
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-[1px] w-12 bg-indigo-500/50"></div>
            <span className="text-indigo-400 font-mono tracking-[0.5em] text-sm uppercase">Advanced Medical Intelligence</span>
            <div className="h-[1px] w-12 bg-indigo-500/50"></div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-lg md:text-xl text-slate-400 font-light tracking-wide max-w-xl leading-relaxed"
        >
          Experience the future of hospital resource optimization and predictive analytics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="pointer-events-auto"
        >
          <button
            onClick={onEnter}
            className="group relative px-10 py-5 bg-black/50 backdrop-blur-md overflow-hidden rounded-full transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-white/10 hover:border-indigo-500/50"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-full border border-white/5 group-hover:border-transparent transition-colors duration-300" />
            
            <span className="relative flex items-center gap-3 text-lg font-bold text-white tracking-widest uppercase">
              Initialize System
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>
        </motion.div>
      </div>
      
      {/* Footer / Status */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 flex items-center gap-6 text-[10px] text-slate-600 tracking-[0.2em] uppercase font-bold"
      >
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          System Online
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          v2.4.0 (Alpha)
        </span>
      </motion.div>
    </div>
  );
}



