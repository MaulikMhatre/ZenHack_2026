"use client";

import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';

interface TriageResult {
  severity: string;
  recommended_actions: string[];
}

import { endpoints } from '@/utils/api';

const TriageAssistant: React.FC = () => {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoints.triageAssess, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.split(',').map(s => s.trim()),
          vitals: {} 
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Triage assessment failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <Stethoscope className="w-5 h-5" /> Smart Triage
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient Symptoms (comma separated)</label>
          <textarea 
            rows={3}
            placeholder="e.g. chest pain, shortness of breath, high fever"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        
        <button 
          onClick={handleAssess}
          disabled={loading || !symptoms}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Assessing...' : 'Assess Patient'}
        </button>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-md border ${
          result.severity === 'Critical' ? 'bg-red-50 border-red-200' :
          result.severity === 'High' ? 'bg-orange-50 border-orange-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Severity Level</span>
            <span className={`text-xl font-bold ${
              result.severity === 'Critical' ? 'text-red-700' :
              result.severity === 'High' ? 'text-orange-700' :
              'text-green-700'
            }`}>
              {result.severity}
            </span>
          </div>
          
          <div className="mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Recommended Actions:</p>
            <ul className="list-disc pl-4 text-sm text-gray-700 mt-1">
              {result.recommended_actions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriageAssistant;
