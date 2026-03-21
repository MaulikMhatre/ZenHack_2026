
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, Clock, ArrowRight, X } from 'lucide-react';

interface Recommendation {
    hospital: string;
    distance: number;
    available_beds: number;
    load_index: number;
    eta_minutes: number;
}

const DiversionBanner = () => {
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const fetchRecommendation = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/diversion/recommend');
            const data = await res.json();
            if (data.recommendation) {
                setRecommendation(data.recommendation);
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        } catch (error) {
            console.error("Failed to fetch diversion recommendation", error);
        }
    };

    useEffect(() => {
        fetchRecommendation();
        const interval = setInterval(fetchRecommendation, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && recommendation && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-amber-500 text-black overflow-hidden"
                >
                    <div className="max-w-[1600px] mx-auto px-8 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-black/10 rounded-full">
                                <AlertTriangle className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-wider">
                                    Critical Capacity Alert: Diversion Protocol Active
                                </span>
                                <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                                    Local beds are 100% occupied. Redirecting to nearest partner.
                                </span>
                            </div>

                            <div className="hidden md:flex items-center gap-6 ml-8 pl-8 border-l border-black/10">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="opacity-70" />
                                    <span className="text-sm font-black whitespace-nowrap">{recommendation.hospital}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="opacity-70" />
                                    <span className="text-sm font-black whitespace-nowrap">{recommendation.eta_minutes} Min ETA</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-black/20 rounded text-[10px] font-black">
                                        {recommendation.available_beds} BEDS AVAIL
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-black/80 transition-all rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg"
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recommendation.hospital)}`, '_blank')}
                            >
                                <span>Navigate</span>
                                <ArrowRight size={12} />
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 hover:bg-black/10 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DiversionBanner;
