"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import useSWR from 'swr';

interface LatencyMetrics {
  latencyScore: number;
  averageLatencyMinutes: number;
  throughputRate: number;
  isCritical: boolean;
}

interface Prediction {
  id: number;
  prediction_text: string;
  target_department: string;
  predicted_delay_minutes: number;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const endpoints = {
  latencyMetrics: 'http://127.0.0.1:8000/api/metrics/latency',
  predictions: 'http://127.0.0.1:8000/api/predictions'
};


function DepartmentNode({ position, name, urgency, isProjected }: { position: [number, number, number], name: string, urgency: number, isProjected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {

      const t = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(t * (2 + urgency * 0.1)) * (0.1 + urgency * 0.01);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = urgency > 50 ? (urgency > 80 ? '#ef4444' : '#eab308') : '#3b82f6';
  const opacity = isProjected ? 0.5 : 1;

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <meshStandardMaterial color={color} transparent opacity={opacity} emissive={color} emissiveIntensity={urgency / 100} />
      </Sphere>
      <Text position={[0, 1.5, 0]} fontSize={0.5} color="white">
        {name}
      </Text>
      {urgency > 50 && (
         <Html distanceFactor={10}>
            <div className="bg-red-900/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-red-500">
               {urgency.toFixed(0)}% Load
            </div>
         </Html>
      )}
    </group>
  );
}

function FlowLine({ start, end, activity, isProjected }: { start: [number, number, number], end: [number, number, number], activity: number, isProjected: boolean }) {
   const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
   
   return (
      <Line points={points} color={isProjected ? "white" : "#60a5fa"} lineWidth={isProjected ? 1 : 2} dashed={isProjected} dashScale={isProjected ? 10 : 0} opacity={0.5} transparent />
   );
}


export default function FlowSentinel() {
  const { data: metrics } = useSWR(endpoints.latencyMetrics, fetcher, { refreshInterval: 2000 });
  const { data: predictions } = useSWR(endpoints.predictions, fetcher);
  const [projectionMode, setProjectionMode] = useState(false);

 
  const displayMetrics = metrics || { latencyScore: 10, averageLatencyMinutes: 5, throughputRate: 10, isCritical: false };
  
  
  const effectiveUrgency = projectionMode ? (displayMetrics.latencyScore + 40) : displayMetrics.latencyScore;

  
  return (
    <div className="w-full h-[600px] bg-slate-950 relative rounded-xl overflow-hidden border border-slate-800">
      

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-xl font-bold text-white mb-2">Sentinel Flow Architecture</h2>
        <div className="flex gap-4">
        </div>
      </div>


      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 p-4 rounded-lg border border-slate-700 w-80">
         <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Temporal Projection</span>
            <span className={`text-xs px-2 py-0.5 rounded ${projectionMode ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
               {projectionMode ? '+2 HOURS' : 'LIVE'}
            </span>
         </div>
         <p className="text-slate-400 text-xs mb-3">
            {projectionMode 
               ? "Simulating predicted inflow surge based on AI models." 
               : "Visualizing real-time patient flow events."}
         </p>
         <input 
            type="range" 
            min="0" 
            max="1" 
            step="1"
            value={projectionMode ? 1 : 0}
            onChange={(e) => setProjectionMode(e.target.value === '1')}
            className="w-full accent-purple-500"
         />
      </div>


      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        

        <DepartmentNode position={[-4, 0, 0]} name="ER" urgency={projectionMode ? 85 : Math.max(20, effectiveUrgency)} isProjected={projectionMode} />
        <DepartmentNode position={[4, 0, 0]} name="ICU" urgency={projectionMode ? 92 : Math.max(10, effectiveUrgency * 0.5)} isProjected={projectionMode} />
        <DepartmentNode position={[0, 0, -4]} name="Radiology" urgency={projectionMode ? 40 : 15} isProjected={projectionMode} />
        

        <FlowLine start={[-4, 0, 0]} end={[0, 0, -4]} activity={0.5} isProjected={projectionMode} />
        <FlowLine start={[-4, 0, 0]} end={[4, 0, 0]} activity={0.8} isProjected={projectionMode} />
        <FlowLine start={[0, 0, -4]} end={[4, 0, 0]} activity={0.3} isProjected={projectionMode} />
        
        <OrbitControls enableZoom={false} />
        <gridHelper args={[20, 20, 0x1e293b, 0x1e293b]} position={[0, -2, 0]} />
      </Canvas>
    </div>
  );
}
