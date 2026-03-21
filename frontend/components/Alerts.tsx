
"use client";

import React from 'react';
import { AlertTriangle, UserMinus, ShieldAlert, Activity } from 'lucide-react';

interface Alert {
  id?: string;
  type: string;
  title?: string;
  message: string;
  level: string;
  timestamp?: string;
}

interface AlertsProps {
  alerts: Alert[];
}

const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-emerald-500 flex items-center gap-3">
        <div className="bg-emerald-100 p-2 rounded-full">
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-tight">System Status: Nominal</h3>
          <p className="text-xs text-emerald-600">Monitoring real-time vitals stream...</p>
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL_VITALS':
        return <ShieldAlert className="w-6 h-6 text-red-600 animate-pulse" />;
      case 'STAFF_CRISIS':
        return <UserMinus className="w-6 h-6 text-rose-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {alerts.map((alert, index) => (
        <div 
          key={alert.id || index} 
          className={`p-4 rounded-lg shadow-sm border-l-4 flex items-start gap-3 transition-all animate-in slide-in-from-right-4 ${
            alert.level === 'High' || alert.level === 'Critical' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
          }`}
        >
          {getIcon(alert.type)}
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className={`text-sm font-bold uppercase ${
                alert.level === 'High' || alert.level === 'Critical' ? 'text-red-800' : 'text-amber-800'
              }`}>
                {alert.type.replace('_', ' ')}
              </h3>
              {alert.timestamp && (
                <span className="text-[10px] font-mono text-gray-400">{alert.timestamp}</span>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-1 leading-tight font-medium">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alerts;