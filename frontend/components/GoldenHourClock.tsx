
"use client";

import React from 'react';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';

interface GoldenHourProps {
  currentWait: number; 
  predictedWait: number; 
}

const GoldenHourClock: React.FC<GoldenHourProps> = ({ currentWait, predictedWait }) => {
  // Logic: High occupancy (>80%) triggers a warning
  const totalBeds = currentWait + predictedWait;
  const occupancyRate = totalBeds > 0 ? (currentWait / totalBeds) * 100 : 0;
  const isCritical = occupancyRate > 85;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-blue-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Bed Orchestration</h2>
        </div>
        {isCritical ? <TrendingUp className="text-red-500 w-5 h-5" /> : <TrendingDown className="text-emerald-500 w-5 h-5" />}
      </div>
      
      <div className="flex w-full justify-around items-center">
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Occupied</p>
          <p className="text-4xl font-black text-gray-900">{currentWait}</p>
        </div>
        
        <div className="h-10 w-px bg-gray-100"></div>
        
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Available</p>
          <p className={`text-4xl font-black ${predictedWait < 5 ? 'text-red-600' : 'text-blue-600'}`}>
            {predictedWait}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
          <span>Utilization</span>
          <span>{Math.round(occupancyRate)}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-blue-600'}`}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </div>
      
      {isCritical && (
        <div className="mt-3 text-center py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold animate-pulse uppercase">
          Resource Saturation Imminent
        </div>
      )}
    </div>
  );
};

export default GoldenHourClock;