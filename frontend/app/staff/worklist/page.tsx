"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock, AlertTriangle, User, Zap } from 'lucide-react';

export default function SmartWorklist() {
  const [data, setData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const staffId = typeof window !== 'undefined' ? (localStorage.getItem('staff_id') || 'N-01') : 'N-01';
  const nurseName = typeof window !== 'undefined' ? (localStorage.getItem('staff_name') || 'Nurse') : 'Nurse';

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/staff/worklist/${staffId}`);
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch dashboard", err);
    }
  }, [staffId]);

  useEffect(() => {
    fetchDashboard();

    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "REFRESH_RESOURCES" || message.type === "NEW_ADMISSION") {
        fetchDashboard();
      }
    };

    return () => socket.close();
  }, [fetchDashboard]);

  const completeTask = async (taskId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tasks/complete/${taskId}`, { 
        method: 'POST' 
      });
      if (res.ok) {
        setData((prevData: any) => ({
          ...prevData,
          tasks: prevData.tasks.filter((t: any) => t.id !== taskId)
        }));
        fetchDashboard(); 
      }
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  if (!data) return <div className="p-8 text-foreground">Connecting to Hospital Neural Grid...</div>;

  return (
    // Replaced #050505 with bg-background
    <div className="min-h-screen bg-background p-6 text-foreground font-sans transition-colors duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">System Live</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
            SMART<span className="text-blue-500">WORKLIST</span>
          </h1>
          <p className="text-primary font-bold text-xs mt-1 uppercase tracking-widest">
            Logged in as: <span className="text-foreground">{nurseName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Last Sync</p>
          <p className="text-sm font-bold text-foreground opacity-80">{lastUpdate.toLocaleTimeString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Monitor */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <User size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">My Patients</h2>
          </div>
          {data.patients && data.patients.map((patient: any) => (
            // Replaced #0f1115 with bg-card and slate-800 with border-border
            <div key={patient.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm dark:shadow-none transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                  {patient.patient_name || "Unknown Patient"} 
                </span>
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
                  Bed: {patient.bed_id}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Task Queue */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-cyan-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Task Queue</h2>
            </div>
            <span className="text-xs text-muted-foreground font-bold">{(data.tasks?.length || 0)} Pending</span>
          </div>
          
          <div className="space-y-3">
            {data.tasks?.map((task: any) => (
              // Replaced #0f1115 with bg-card and border colors with border-border
              <div 
                key={task.id} 
                className="group flex items-center justify-between p-5 rounded-2xl border border-border bg-card shadow-md dark:shadow-none transition-all"
              >
                <div className="flex gap-5 items-center">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="font-black text-lg text-foreground uppercase tracking-tight">{task.description}</p>
                    <div className="flex gap-4 text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><User size={12} className="text-blue-500"/> {task.bed_id}</span>
                      <span className="flex items-center gap-1"><Clock size={12} className="text-cyan-500"/> Due {new Date(task.due_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>
                  <button 
                  onClick={() => {
                    completeTask(task.id);
                  }}
                  className="px-6 py-2.5 bg-foreground text-background font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95"
                  >
                  Mark Complete
                </button>
              </div>
            ))}
            
            {(!data.tasks || data.tasks.length === 0) && (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-[2rem] opacity-30">
                <CheckCircle className="mx-auto mb-2 w-8 h-8" />
                <p className="font-black uppercase tracking-widest text-[10px]">All Tasks Resolved</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}