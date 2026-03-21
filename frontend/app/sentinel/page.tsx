import React from 'react';
import FlowSentinel from '@/components/FlowSentinel';
import GlobalAlertBanner from '@/components/GlobalAlertBanner';

export default function SentinelPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-24 px-6">
        <GlobalAlertBanner />
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Sentinel Command Center</h1>
            <p className="text-gray-400">Real-time hospital flow architecture and predictive analytics.</p>
        </div>

        <FlowSentinel />
      </div>
    </div>
  );
}
