"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Users, Clipboard, Clock, ShieldAlert, ArrowLeft, Bed, Briefcase, CheckCircle } from 'lucide-react';
import Background3D from '@/components/Background3D';
import { useToast } from '@/context/ToastContext';
import { endpoints } from '@/utils/api';

const StaffPortal = () => {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [stats, setStats] = useState({ nurses_on_shift: 0, doctors_on_shift: 0 });
  const [assignments, setAssignments] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Login Simulation
  const [currentUser, setCurrentUser] = useState<string | null>(null); 
  const [myDashboard, setMyDashboard] = useState<any>(null);

  const fetchStaffData = async () => {
    try {
      const [staffRes, bedRes] = await Promise.all([
        fetch(endpoints.staff),
        fetch(endpoints.beds)
      ]);
      if (staffRes.ok && bedRes.ok) {
        const staffData = await staffRes.json();
        const bedData = await bedRes.json();
        
        setStaffList(staffData.staff || []);
        setStats(staffData.stats || { nurses_on_shift: 0, doctors_on_shift: 0 });
        setAssignments(staffData.assignments || []);
        setBeds(bedData || []);
      }
    } catch (e) {
      toast("Failed to load staff data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaffData(); }, []);

  const handleClockIn = async (id: string) => {
    try {
      await fetch(endpoints.staffClock, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff_id: id })
      });
      toast(`Staff status updated`, "success");
      fetchStaffData();
    } catch (e) {
      toast("Failed to update status", "error");
    }
  };

  const handleLogin = async (id: string) => {
    setCurrentUser(id);
    try {
      const res = await fetch(endpoints.staffDashboard(id));
      if (res.ok) {
        const data = await res.json();
        setMyDashboard(data);
      } else {
        toast("Failed to access dashboard", "error");
      }
    } catch (e) {
      toast("Dashboard error", "error");
    }
  };

  const assignBed = async (staffId: string, bedId: string, role: string) => {
      try {
        const targetBed = beds.find(b => b.id === bedId);
        const patientName = targetBed?.patient_name || "Unknown Patient";

        const res = await fetch(endpoints.staffAssign, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: staffId, bed_id: bedId, role: role })
        });
        
        if (!res.ok) {
            const err = await res.json();
            toast(err.detail || "Assignment limit reached", "warning");
        } else {
           toast(`Assigned to ${patientName} (${bedId})`, "success");
           fetchStaffData();
           if (currentUser === staffId) handleLogin(staffId); 
        }
      } catch (e) {
          toast("Assignment Failed", "error");
      }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">Establishing Phrelis Uplink...</div>
      </div>
    </div>
  );

  // --- INDIVIDUAL STAFF DASHBOARD (LOGGED IN VIEW) ---
  if (currentUser && myDashboard) {
      return (
          <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors duration-500">
              <Background3D variant="subtle" />
              
              <div className="relative z-10 p-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8 bg-card border border-border p-6 rounded-[2.5rem] shadow-xl transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg">
                            {myDashboard.role[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground uppercase italic">{staffList.find(s => s.id === currentUser)?.name}</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{myDashboard.role} Terminal Active</p>
                        </div>
                    </div>
                    <button 
                      onClick={() => setCurrentUser(null)} 
                      className="px-8 py-3 bg-muted hover:bg-rose-500 hover:text-white border border-border rounded-xl text-[10px] font-black tracking-widest transition-all"
                    >
                      LOGOUT
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-2 mb-4">
                            <Clipboard size={14} /> My Rounds / Assignments
                        </h2>
                        
                        {myDashboard.my_beds.length === 0 ? (
                            <div className="p-12 text-center bg-card rounded-[2rem] border border-dashed border-border text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                                No active assignments detected.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myDashboard.my_beds.map((bed: any) => (
                                    <div key={bed.id} className="bg-card border-l-4 border-l-primary border-t border-r border-b border-border p-6 rounded-2xl shadow-lg group hover:bg-muted/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-2xl font-black text-foreground">{bed.id}</span>
                                            {bed.type === 'ICU' && <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black rounded-lg uppercase tracking-widest">Critical</span>}
                                        </div>
                                        <div className="space-y-1 mb-6">
                                            <p className="font-black text-lg text-foreground uppercase tracking-tight">{bed.patient_name || "Empty Bed"}</p>
                                            <p className="text-xs text-primary font-bold">{bed.condition}</p>
                                        </div>
                                        <div className="pt-4 border-t border-border space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                                <Clock size={12} className="text-orange-500"/> Vitals Due: 15m
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                                <CheckCircle size={12} className="text-emerald-500"/> Meds Administered
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card p-8 rounded-[2.5rem] border border-border h-fit sticky top-6 shadow-2xl transition-all">
                        <h3 className="font-black text-foreground mb-8 flex items-center gap-3 uppercase tracking-tighter text-xl italic">
                          <Bed size={22} className="text-primary"/>
                          Bed Assignment
                        </h3>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {beds.filter(b => b.is_occupied).map(bed => (
                                <div key={bed.id} className="flex justify-between items-center p-4 bg-muted/50 hover:bg-primary/5 rounded-2xl border border-border transition-all group">
                                    <div>
                                        <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{bed.id}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground truncate w-24">{bed.patient_name}</p>
                                    </div>
                                    <button 
                                        onClick={() => assignBed(currentUser, bed.id, myDashboard.role === 'Nurse' ? 'Primary Nurse' : 'Attending Physician')}
                                        className="px-4 py-2 bg-primary text-primary-foreground text-[10px] font-black rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        CLAIM
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors duration-500">
      <Background3D variant="subtle" />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto pt-24">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic mb-2">
              Staff <span className="text-primary">Portal</span>
            </h1>
            <p className="text-primary font-black flex items-center gap-3 text-xs tracking-[0.4em] uppercase">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]"></span>
              Operational Resource Hub
            </p>
          </div>
          <Link href="/" className="group flex items-center gap-3 px-8 py-4 bg-card border border-border rounded-full hover:border-primary transition-all shadow-lg">
            <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-colors" /> 
            <span className="text-[10px] font-black tracking-widest text-foreground uppercase">Return to Terminal</span>
          </Link>
        </header>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="p-8 bg-card rounded-[2rem] border border-border hover:border-primary/40 transition-all group shadow-xl">
                <div className="flex items-center gap-3 mb-6 text-primary">
                    <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                      <Users size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Nurses Active</span>
                </div>
                <p className="text-6xl font-black text-foreground tracking-tighter">{stats.nurses_on_shift}</p>
            </div>
            <div className="p-8 bg-card rounded-[2rem] border border-border hover:border-blue-500/40 transition-all group shadow-xl">
                <div className="flex items-center gap-3 mb-6 text-blue-500">
                    <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                      <Briefcase size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Doctors Active</span>
                </div>
                <p className="text-6xl font-black text-foreground tracking-tighter">{stats.doctors_on_shift}</p>
            </div>
        </div>

        {/* STAFF ROSTER */}
        <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-2xl transition-all">
            <div className="p-8 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-black text-2xl text-foreground tracking-tighter uppercase italic">Registry Database</h3>
                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Live Uplink
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                        <tr>
                            <th className="p-6">ID Node</th>
                            <th className="p-6">Staff Identity</th>
                            <th className="p-6">Designation</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Protocol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {staffList.map((staff) => (
                            <tr key={staff.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="p-6 font-mono text-muted-foreground text-xs font-bold">{staff.id}</td>
                                <td className="p-6 font-black text-foreground text-sm uppercase tracking-tight">{staff.name}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                      staff.role === 'Doctor' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                      'bg-primary/10 text-primary border-primary/20'
                                    }`}>
                                      {staff.role}
                                    </span>
                                </td>
                                <td className="p-6">
                                    {staff.is_clocked_in ? (
                                        <span className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-tighter">
                                            <CheckCircle size={14} /> On Duty
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-muted-foreground text-xs font-black uppercase tracking-tighter opacity-50">
                                            <Clock size={14} /> Off Duty
                                        </span>
                                    )}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-3 transition-opacity">
                                      {!staff.is_clocked_in ? (
                                          <button 
                                              onClick={() => handleClockIn(staff.id)}
                                              className="px-6 py-2.5 bg-foreground text-background text-[10px] font-black rounded-xl hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest"
                                          >
                                              Shift Start
                                          </button>
                                      ) : (
                                          <button 
                                              onClick={() => handleLogin(staff.id)}
                                              className="px-6 py-2.5 bg-primary text-primary-foreground text-[10px] font-black rounded-xl shadow-lg transition-all uppercase tracking-widest active:scale-95"
                                          >
                                              Access Portal
                                          </button>
                                      )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPortal;