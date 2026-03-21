"use client";

import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

const colorMap = {
  blue: "bg-indigo-500/20",
  purple: "bg-purple-500/20",
  green: "bg-emerald-500/20",
  red: "bg-rose-500/20",
  orange: "bg-orange-500/20"
};

export const GlowCard = ({ children, className = '', glowColor = 'blue' }: GlowCardProps) => {
  return (
    <div className={`relative group rounded-[2.5rem] border bg-card border-border transition-all duration-500 overflow-hidden ${className}`}>
      
      {/* The Animated Glow Core */}
      <div className={`absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[40px] animate-slow-glow transition-colors duration-700 ${colorMap[glowColor]} pointer-events-none`} />
      
      {/* Subtle Bottom Glow */}
      <div className={`absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[60px] opacity-20 transition-colors duration-700 ${colorMap[glowColor]} pointer-events-none`} />

      {/* Content Layer */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>

      {/* Interactive Border Highlight on Hover */}
      <div className="absolute inset-0 border border-primary/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};



