"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Ambulance, Activity } from 'lucide-react';
import Link from 'next/link';
import { endpoints } from '@/utils/api';

interface Alert {
  type: string;
  message: string;
  level: string;
}

const GlobalAlertBanner = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latencyCritical, setLatencyCritical] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [statsRes, latencyRes] = await Promise.all([
           fetch(endpoints.dashboardStats),
           fetch(endpoints.latencyMetrics)
        ]);
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setAlerts(data.alerts || []);
        }

        if (latencyRes.ok) {
           const latencyData = await latencyRes.json();
           setLatencyCritical(latencyData.isCritical);
        }

      } catch (e) {
        // console.error("Failed to fetch alerts");
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0 && !latencyCritical) return null;

  return (
    <div className={`text-white px-4 py-2 shadow-md animate-pulse ${latencyCritical ? 'bg-yellow-600' : 'bg-red-600'}`}>
      <div className="container mx-auto flex items-center justify-center gap-4">
        <AlertTriangle className="w-6 h-6" />
        <span className="font-bold text-lg uppercase tracking-wider">
          {latencyCritical ? 'CODE YELLOW: FLOW OBSTRUCTION' : 'CRITICAL SYSTEM ALERT:'}
        </span>
        <div className="flex gap-4 items-center">
          {alerts.map((alert, i) => (
             <span key={i} className="font-semibold">{alert.type}: {alert.message}</span>
          ))}
          {latencyCritical && (
             <div className="flex items-center gap-2">
                <span className="font-semibold">Latency Spike Detected.</span>
                <Link href="/sentinel" className="underline font-bold bg-black/20 px-2 py-1 rounded hover:bg-black/40">
                   CLEAR THE PATH
                </Link>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalAlertBanner;
