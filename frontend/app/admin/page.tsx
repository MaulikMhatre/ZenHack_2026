
// "use client";
// import React, { useEffect, useState, useCallback } from 'react';
// import Link from 'next/link';
// import {
//   BedDouble, Activity, BrainCircuit, Package,
//   ArrowLeft, Plus, X, MapPin,
//   Siren, LogOut, Baby, Stethoscope,
//   ShieldAlert, HeartPulse, Timer, UserCheck
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import ResourceInventory from '@/components/ResourceInventory';
// import SurgerySection from '@/components/SurgerySection';
// import { endpoints } from '@/utils/api';
// import { useToast } from '@/context/ToastContext';
// import { useAuth } from '@/context/AuthContext';

// // --- HELPERS ---
// const formatIST = (isoString?: string) => {
//   const date = isoString ? new Date(isoString) : new Date();
//   return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
// };

// const getWardZone = (bedId: string): 'Medical' | 'Specialty' | 'Recovery' | 'Security' => {
//   const num = parseInt(bedId.replace(/^\D+/g, '') || '0');
//   if (num >= 1 && num <= 40) return 'Medical';
//   if (num >= 41 && num <= 70) return 'Specialty';
//   if (num >= 71 && num <= 90) return 'Recovery';
//   return 'Security';
// };

// const getBedGender = (bedId: string): 'Male' | 'Female' | 'Any' => {
//   const num = parseInt(bedId.replace(/^\D+/g, '') || '0');
//   if (num >= 1 && num <= 20) return 'Male';
//   if (num >= 21 && num <= 40) return 'Female';
//   return 'Any';
// };

// // --- COMPONENTS ---

// const UnitHeroCard = ({ title, icon: Icon, total, occupied, isActive, onClick, colorClass }: any) => {
//   const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
//   const isCritical = percentage >= 80;

//   const getColors = () => {
//     switch (colorClass) {
//       case 'red': return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', ring: 'ring-red-500', gradient: 'from-red-500/20' };
//       case 'blue': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', ring: 'ring-blue-500', gradient: 'from-blue-500/20' };
//       case 'indigo': return { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500', gradient: 'from-indigo-500/20' };
//       case 'emerald': return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', gradient: 'from-emerald-500/20' };
//       default: return { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500', ring: 'ring-slate-500', gradient: 'from-slate-500/20' };
//     }
//   };
//   const c = getColors();

//   return (
//     <button
//       onClick={onClick}
//       className={`relative p-6 rounded-3xl border transition-all duration-300 w-full text-left overflow-hidden group hover:-translate-y-1
//         ${isActive ? `bg-[#0f172a] ${c.border} shadow-2xl` : 'bg-[#0f172a]/40 border-slate-800 hover:border-slate-700 hover:bg-[#0f172a]/80'}`}
//     >
//       <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isActive ? 'opacity-20' : ''}`} />
//       <div className="relative z-10 flex justify-between items-start mb-6">
//         <div className={`p-4 rounded-2xl ${isActive ? `${c.bg} text-white shadow-lg` : 'bg-slate-800/50 text-slate-400'}`}>
//           <Icon size={24} />
//         </div>
//         <div className="text-right">
//           <p className="text-3xl font-black text-white">{percentage}%</p>
//           <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isActive ? c.text : 'text-slate-600'}`}>Occupancy</p>
//         </div>
//       </div>
//       <div className="relative z-10 space-y-3">
//         <h3 className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-400'}`}>{title}</h3>
//         <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
//           <motion.div
//             initial={{ width: 0 }}
//             animate={{ width: `${percentage}%` }}
//             transition={{ duration: 1, ease: "easeOut" }}
//             className={`h-full rounded-full ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : `${c.bg}`}`}
//           />
//         </div>
//         <div className="flex justify-between items-center pt-2">
//           <p className="text-[10px] text-slate-500 font-bold uppercase">Active Units</p>
//           <p className="text-xs font-mono text-white"><span className={`${c.text} font-bold`}>{occupied}</span> / {total}</p>
//         </div>
//       </div>
//     </button>
//   );
// };

// const CleaningTimer = ({ bedId, onRequestUnlock }: { bedId: string, onRequestUnlock: () => void }) => {
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [isFinished, setIsFinished] = useState(false);

//   useEffect(() => {
//     const storageKey = `cleaning_end_time_${bedId}`;
//     let endTime = localStorage.getItem(storageKey);
//     if (!endTime) {
//       const newEndTime = Date.now() + 180 * 1000;
//       localStorage.setItem(storageKey, newEndTime.toString());
//       endTime = newEndTime.toString();
//     }
//     const checkTime = () => {
//       const remaining = Math.round((parseInt(endTime!) - Date.now()) / 1000);
//       if (remaining <= 0) { setTimeLeft(0); setIsFinished(true); return true; }
//       setTimeLeft(remaining); return false;
//     };
//     if (!checkTime()) {
//       const timer = setInterval(() => { if (checkTime()) clearInterval(timer); }, 1000);
//       return () => clearInterval(timer);
//     }
//   }, [bedId]);

//   const formatTime = (s: number) => {
//     const mins = Math.floor(s / 60);
//     const secs = s % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   if (isFinished) {
//     return (
//       <button onClick={onRequestUnlock} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl animate-bounce shadow-lg shadow-emerald-500/20 transition-colors uppercase tracking-widest text-[10px]">
//         Mark Ready
//       </button>
//     );
//   }
//   return (
//     <div className="text-center py-3 bg-sky-500/10 rounded-xl border border-sky-400/20">
//       <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1">Sterilization</p>
//       <p className="text-2xl font-black text-white font-mono tracking-tighter">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</p>
//     </div>
//   );
// };

// const BedCard = ({ bed, onDischarge, onAdmit, onStartCleaning, onRefresh, accentColor, genderLock, patientGender }: any) => {
//   const { token } = useAuth();
//   const isRed = accentColor === 'red';
//   const isGreen = accentColor === 'green';
//   const isLocked = !bed.is_occupied && genderLock && genderLock !== 'Any' && patientGender && patientGender !== genderLock;

//   const occupiedStyle = isRed
//     ? 'bg-gradient-to-br from-red-950/40 to-red-900/10 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]'
//     : isGreen
//       ? 'bg-gradient-to-br from-emerald-950/40 to-emerald-900/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
//       : 'bg-gradient-to-br from-blue-950/40 to-blue-900/10 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]';

//   const textClass = isRed ? 'text-red-400' : isGreen ? 'text-emerald-400' : 'text-blue-400';

//   const handleManualUnlock = async () => {
//     try {
//       await fetch(endpoints.cleaningComplete(bed.id), {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       localStorage.removeItem(`cleaning_end_time_${bed.id}`);
//       onRefresh();
//     } catch (e) { console.error(e); }
//   };

//   if (isLocked) {
//     return (
//       <div className="p-6 rounded-3xl border border-dashed border-slate-800 bg-[#0a0a0a]/50 opacity-40 grayscale pointer-events-none relative overflow-hidden flex flex-col items-center justify-center gap-2">
//         <ShieldAlert size={24} className="text-slate-600" />
//         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Restricted</p>
//       </div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       className={`p-6 rounded-3xl border transition-all relative overflow-hidden group 
//       ${bed.status === 'OCCUPIED' ? occupiedStyle : bed.status === 'DIRTY' ? 'bg-orange-500/5 border-orange-500/20' : bed.status === 'CLEANING' ? 'bg-sky-500/5 border-sky-500/20' : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'}`}>
//       <div className="flex justify-between items-center mb-6">
//         <div className="flex items-center gap-3">
//           <p className="text-xs font-black text-slate-400 px-3 py-1.5 rounded-lg bg-[#020617] border border-slate-800">{bed.id}</p>
//           {genderLock && genderLock !== 'Any' && (
//             <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${genderLock === 'Male' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>
//               {genderLock}
//             </span>
//           )}
//         </div>
//         <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-opacity-20 ${bed.status === "AVAILABLE" ? "bg-emerald-500 ring-emerald-500" : bed.status === "OCCUPIED" ? (isRed ? "bg-red-500 ring-red-500" : "bg-blue-500 ring-blue-500") : bed.status === "DIRTY" ? "bg-orange-500 ring-orange-500" : "bg-sky-500 ring-sky-500"}`} />
//       </div>
//       {bed.status === "OCCUPIED" ? (
//         <div className="space-y-6">
//           <div>
//             <p className="text-lg font-black text-white truncate leading-tight">{bed.patient_name || "Unidentified"}</p>
//             <p className={`text-[10px] font-bold ${textClass} uppercase tracking-widest mt-1`}>{bed.condition || "General Care"}</p>
//             {bed.ventilator_in_use && <span className="inline-flex mt-3 items-center gap-1.5 text-[9px] font-black text-cyan-300 bg-cyan-950/50 px-3 py-1.5 rounded-md border border-cyan-500/30"><Activity size={10} /> VENTILATOR ONLINE</span>}
//           </div>
//           <button onClick={onDischarge} className={`w-full py-3 ${isRed ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20'} border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors`}>Initiate Discharge</button>
//         </div>
//       ) : bed.status === "DIRTY" ? (
//         <div className="space-y-4">
//           <div className="flex flex-col items-center py-4 text-orange-400/50">
//             <Baby size={32} className="mb-2 animate-pulse" />
//             <p className="text-[10px] font-bold uppercase tracking-widest">Unit Secluded</p>
//           </div>
//           <button onClick={() => onStartCleaning(bed.id)} className="w-full py-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-[10px] font-black rounded-xl uppercase tracking-widest transition-colors">Start Protocol</button>
//         </div>
//       ) : bed.status === "CLEANING" ? (
//         <CleaningTimer bedId={bed.id} onRequestUnlock={handleManualUnlock} />
//       ) : (
//         <button onClick={onAdmit} className="w-full py-10 flex flex-col items-center justify-center text-slate-700 hover:text-indigo-400 transition-all gap-3 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl bg-[#0a0a0a] group-hover:bg-[#0f172a]">
//           <div className="p-3 rounded-full bg-slate-900 group-hover:bg-indigo-500/20 transition-colors">
//             <Plus size={20} />
//           </div>
//           <span className="text-[10px] font-black uppercase tracking-widest">Assign Patient</span>
//         </button>
//       )}
//     </motion.div>
//   );
// };

// // --- MAIN PANEL ---

// const AdminPanel = () => {
//   const { token } = useAuth();
//   const { toast } = useToast();
//   const [beds, setBeds] = useState<any[]>([]);
//   const [ambulances, setAmbulances] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [activeUnit, setActiveUnit] = useState<'ICU' | 'ER' | 'Surgery' | 'Wards'>('ICU');
//   const [wardCategory, setWardCategory] = useState<'Medical' | 'Specialty' | 'Recovery' | 'Security'>('Medical');

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedBed, setSelectedBed] = useState<any | null>(null);
//   const [patientData, setPatientData] = useState({
//     name: '', age: '', gender: 'Male', condition: 'Stable',
//     surgeonName: '', duration: 60,
//     surgeryType: 'Minor', admissionUid: ''
//   });

//   const [dispatchForm, setDispatchForm] = useState({ severity: 'HIGH', location: '', eta: 10 });
//   const [dischargeBedId, setDischargeBedId] = useState<string | null>(null);

//   const fetchERPData = useCallback(async () => {
//     try {
//       const [bedsRes, ambRes] = await Promise.all([fetch(endpoints.beds), fetch(endpoints.ambulances)]);
//       const bedsData = await bedsRes.json();
//       const ambData = await ambRes.json();
//       setBeds(Array.isArray(bedsData) ? bedsData : []);
//       setAmbulances(Array.isArray(ambData) ? ambData : []);
//       setLoading(false);
//     } catch { toast("Sync Error", "error"); setLoading(false); }
//   }, [toast]);

//   useEffect(() => { fetchERPData(); }, [fetchERPData]);

//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:8000/ws");
//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (["SURGERY_UPDATE", "SURGERY_EXTENDED", "ROOM_RELEASED", "BED_UPDATE", "REFRESH_RESOURCES", "NEW_ADMISSION"].includes(data.type)) {
//           fetchERPData();
//         }
//       } catch { }
//     };
//     return () => ws.close();
//   }, [fetchERPData]);

//   const handleStartCleaning = async (id: string) => {
//     await fetch(endpoints.startCleaning(id), {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     fetchERPData();
//   };
//   const resetAmbulance = async (id: string) => {
//     await fetch(endpoints.ambulanceReset(id), {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     fetchERPData();
//   };

//   const handleDispatch = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const res = await fetch(endpoints.ambulanceDispatch, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(dispatchForm)
//       });
//       const data = await res.json();
//       toast(data.status === 'DISPATCHED' ? "Unit Authorized" : "Dispatch Failed", data.status === 'DISPATCHED' ? "success" : "error");
//       fetchERPData();
//     } catch { toast("Network Error", "error"); }
//   };

//   const confirmDischarge = async () => {
//     if (!dischargeBedId) return;
//     await fetch(endpoints.discharge(dischargeBedId), {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     toast("Patient Discharged", "success");
//     setDischargeBedId(null);
//     fetchERPData();
//   };

//   const openAdmitModal = (bed: any) => {
//     setSelectedBed(bed);
//     let defCond = activeUnit === 'ICU' ? 'Critical' : activeUnit === 'Surgery' ? 'Pre-Surgery' : 'Stable';
//     setPatientData({
//       name: '', age: '', gender: 'Male', condition: defCond,
//       surgeonName: '', duration: 60,
//       surgeryType: 'Minor', admissionUid: ''
//     });
//     setIsModalOpen(true);
//   };

//   const submitAdmission = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const staffId = localStorage.getItem('staff_id');
//     if (!staffId) { toast("Auth Error", "error"); return; }
//     try {
//       const payload: any = {
//         bed_id: String(selectedBed.id),
//         patient_name: patientData.name,
//         patient_age: Number(patientData.age),
//         condition: patientData.condition,
//         staff_id: staffId,
//         gender: patientData.gender
//       };
//       let res;
//       if (selectedBed.type === 'Surgery') {
//         res = await fetch(endpoints.startSurgery, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           },
//           body: JSON.stringify({
//             ...payload,
//             surgeon_name: patientData.surgeonName,
//             duration_minutes: Number(patientData.duration),
//             surgery_type: patientData.surgeryType,
//             admission_uid: patientData.admissionUid || null
//           })
//         });
//       } else {
//         res = await fetch(endpoints.admit, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           },
//           body: JSON.stringify(payload)
//         });
//       }
//       if (res.ok) { setIsModalOpen(false); toast("Admission Confirmed", "success"); fetchERPData(); }
//       else { toast("Admission Rejected", "error"); }
//     } catch { toast("System Error", "error"); }
//   };

//   const getDisplayBeds = () => {
//     const unitBeds = beds.filter(b => b.type === activeUnit);
//     if (activeUnit === 'Wards') {
//       return unitBeds.filter(b => {
//         const num = parseInt(b.id.replace(/^\D+/g, '') || '0');
//         if (wardCategory === 'Medical') return num >= 1 && num <= 40;
//         if (wardCategory === 'Specialty') return num >= 41 && num <= 70;
//         if (wardCategory === 'Recovery') return num >= 71 && num <= 90;
//         if (wardCategory === 'Security') return num >= 91;
//         return false;
//       });
//     }
//     return unitBeds;
//   };

//   const getUnitStats = (type: string) => {
//     const unitBeds = beds.filter(b => b.type === type);
//     return { total: unitBeds.length, occupied: unitBeds.filter(b => b.status === "OCCUPIED").length };
//   };

//   if (loading) return (
//     <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono animate-pulse text-indigo-500">
//       <Activity className="animate-spin mr-3" />
//       INITIALIZING ORBITAL LINK...
//     </div>
//   );

//   return (
//     // REMOVED h-screen overflow-y-auto from here to let the body scroll
//     <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">

//       <style jsx global>{`
//         ::-webkit-scrollbar { width: 6px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
//         ::-webkit-scrollbar-thumb:hover { background: #475569; }
//       `}</style>

//       {/* Main Container - removed h-screen and fixed layout constraints */}
//       <div className="max-w-[1900px] mx-auto grid grid-cols-12 min-h-screen">

//         {/* CONTENT AREA - removed h-screen and overflow-y-auto */}
//         <div className="col-span-12 p-8 lg:p-12 flex flex-col gap-10 pb-60">

//           {/* HEADER */}
//           <div className="flex justify-between items-end border-b border-indigo-500/10 pb-8 shrink-0">
//             <div>
//               <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">
//                 <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
//                   <Activity className="text-white" size={32} />
//                 </div>
//                 PHRELIS OS <span className="text-slate-700 font-light">| ADMIN</span>
//               </h1>
//               <p className="text-slate-500 font-mono text-sm mt-3 pl-20 flex items-center gap-3">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
//                 IST: {formatIST()} • SYSTEM ONLINE
//               </p>
//             </div>
//             <div className="flex gap-4">
//               <Link href="/admin/audit-logs" className="px-8 py-4 bg-[#0f172a] border border-slate-800 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 hover:border-blue-500/50 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10 flex items-center gap-2">
//                 <ShieldAlert size={16} className="text-blue-500" />
//                 System Sentinel
//               </Link>
//               <Link href="/" className="px-8 py-4 bg-[#0f172a] border border-slate-800 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 hover:border-indigo-500/50 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/10">
//                 Dashboard Return
//               </Link>
//             </div>
//           </div>

//           {/* LAYER 1: LOGISTICS */}
//           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 shrink-0">
//             <div className="bg-[#0b0b0b] rounded-[2rem] border border-red-900/30 p-8 relative overflow-hidden group">
//               <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-transparent pointer-events-none" />
//               <div className="relative z-10 flex justify-between items-start mb-8">
//                 <div>
//                   <h3 className="text-2xl font-black text-white flex items-center gap-3">
//                     <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
//                       <Siren className="text-red-500" size={24} />
//                     </div>
//                     EMERGENCY DISPATCH
//                   </h3>
//                   <p className="text-xs text-red-400/60 font-bold uppercase tracking-[0.2em] mt-2 pl-16">High Priority Channel</p>
//                 </div>
//                 <div className="w-3 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_20px_#ef4444]" />
//               </div>
//               <form onSubmit={handleDispatch} className="relative z-10 grid grid-cols-12 gap-4">
//                 <div className="col-span-12 xl:col-span-3">
//                   <label className="text-[10px] font-bold text-red-500 uppercase ml-2 mb-1 block">Triage Level</label>
//                   <select className="w-full h-14 px-4 bg-[#0f172a] border border-red-900/30 focus:border-red-500 rounded-xl outline-none font-bold text-sm text-white appearance-none cursor-pointer hover:bg-[#1e293b] transition-colors" value={dispatchForm.severity} onChange={e => setDispatchForm({ ...dispatchForm, severity: e.target.value })}>
//                     <option value="HIGH">CRITICAL (RED)</option>
//                     <option value="LOW">STABLE (YELLOW)</option>
//                   </select>
//                 </div>
//                 <div className="col-span-12 xl:col-span-6">
//                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Incident Coordinates</label>
//                   <div className="relative">
//                     <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
//                     <input type="text" placeholder="Location..." required className="w-full h-14 pl-12 pr-4 bg-[#0f172a] border border-slate-800 focus:border-red-500 rounded-xl text-sm font-medium text-white placeholder-slate-600 outline-none transition-all" value={dispatchForm.location} onChange={e => setDispatchForm({ ...dispatchForm, location: e.target.value })} />
//                   </div>
//                 </div>
//                 <button type="submit" className="col-span-12 xl:col-span-3 h-14 mt-auto bg-red-600 hover:bg-red-500 rounded-xl font-black text-white text-xs uppercase tracking-[0.15em] transition-all shadow-[0_5px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_5px_30px_rgba(220,38,38,0.5)] transform hover:-translate-y-0.5">
//                   AUTHORIZE UNIT
//                 </button>
//               </form>
//             </div>

//             <div className="bg-[#0b0b0b] rounded-[2rem] border border-emerald-900/30 p-8 relative overflow-hidden">
//               <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent pointer-events-none" />
//               <div className="relative z-10 flex justify-between items-start mb-6">
//                 <div>
//                   <h3 className="text-2xl font-black text-white flex items-center gap-3">
//                     <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
//                       <Activity className="text-emerald-500" size={24} />
//                     </div>
//                     FLEET COMMAND
//                   </h3>
//                   <p className="text-xs text-emerald-400/60 font-bold uppercase tracking-[0.2em] mt-2 pl-16">
//                     <span className="text-white font-black text-sm">{ambulances.filter(a => a.status === 'IDLE').length}</span> Units Active
//                   </p>
//                 </div>
//               </div>
//               <div className="relative z-10 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
//                 {ambulances.map(amb => (
//                   <div key={amb.id} className={`shrink-0 w-40 p-5 rounded-2xl border flex flex-col justify-between h-32 transition-all ${amb.status === 'IDLE' ? 'bg-[#0f172a]/80 border-emerald-500/30 hover:border-emerald-500' : 'bg-amber-950/20 border-amber-500/20'}`}>
//                     <div className="flex justify-between items-start">
//                       <span className="font-black text-white text-lg">{amb.id}</span>
//                       <div className={`w-2 h-2 rounded-full ${amb.status === 'IDLE' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
//                     </div>
//                     <div>
//                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sector</p>
//                       <div className="text-xs font-mono text-slate-300 truncate">{amb.location}</div>
//                     </div>
//                     {amb.status !== 'IDLE' && <button onClick={() => resetAmbulance(amb.id)} className="text-[9px] text-amber-500 font-bold uppercase hover:text-amber-400 text-left mt-2">Recall Unit &rarr;</button>}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* LAYER 2: UNIT SWITCHER */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
//             <UnitHeroCard title="ICU" icon={Activity} {...getUnitStats('ICU')} isActive={activeUnit === 'ICU'} onClick={() => setActiveUnit('ICU')} colorClass="red" />
//             <UnitHeroCard title="Emergency" icon={BedDouble} {...getUnitStats('ER')} isActive={activeUnit === 'ER'} onClick={() => setActiveUnit('ER')} colorClass="blue" />
//             <UnitHeroCard title="Surgery" icon={BrainCircuit} {...getUnitStats('Surgery')} isActive={activeUnit === 'Surgery'} onClick={() => setActiveUnit('Surgery')} colorClass="indigo" />
//             <UnitHeroCard title="Wards" icon={Package} {...getUnitStats('Wards')} isActive={activeUnit === 'Wards'} onClick={() => setActiveUnit('Wards')} colorClass="emerald" />
//           </div>

//           {/* LAYER 3: DYNAMIC ASSET GRID - removed h-full, fixed height, etc. */}
//           <div className="bg-[#0b0b0b] rounded-[2.5rem] border border-slate-800 p-8 relative overflow-hidden">
//             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
//             <div className="relative z-10 flex justify-between items-center mb-8">
//               <div>
//                 <h2 className="text-4xl font-black text-white tracking-tighter">{activeUnit} Grid</h2>
//                 <p className="text-xs text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Live Asset Monitoring</p>
//               </div>
//               {activeUnit === 'Wards' && (
//                 <div className="hidden xl:flex bg-[#0f172a] p-1.5 rounded-2xl border border-slate-800">
//                   {[{ id: 'Medical', icon: HeartPulse }, { id: 'Specialty', icon: Baby }, { id: 'Recovery', icon: Stethoscope }, { id: 'Security', icon: ShieldAlert }].map(cat => (
//                     <button key={cat.id} onClick={() => setWardCategory(cat.id as any)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${wardCategory === cat.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><cat.icon size={14} /> {cat.id}</button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="relative z-10">
//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={activeUnit + wardCategory}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -20 }}
//                   transition={{ type: "spring", stiffness: 200, damping: 20 }}
//                   className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
//                 >
//                   {activeUnit === 'Surgery' ? (
//                     <div className="col-span-full"><SurgerySection beds={beds} onRefresh={fetchERPData} onAdmit={openAdmitModal} /></div>
//                   ) : getDisplayBeds().map(bed => (
//                     <BedCard key={bed.id} bed={bed} onDischarge={() => setDischargeBedId(bed.id)} onAdmit={() => openAdmitModal(bed)} onStartCleaning={handleStartCleaning} onRefresh={fetchERPData} accentColor={activeUnit === 'ICU' ? 'red' : activeUnit === 'Wards' ? 'green' : 'blue'} genderLock={activeUnit === 'Wards' && wardCategory === 'Medical' ? getBedGender(bed.id) : null} patientGender={patientData.gender} />
//                   ))}
//                 </motion.div>
//               </AnimatePresence>
//             </div>
//           </div>
//         </div>

//         <ResourceInventory />
//       </div>

//       {/* MODALS RENDERED OUTSIDE SCROLL FLOW */}
//       <AnimatePresence>
//         {isModalOpen && selectedBed && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#0b0b0b] rounded-[2.5rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 relative z-10 shadow-2xl custom-scrollbar">
//               <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
//                 <div>
//                   <h2 className="text-3xl font-black text-white tracking-tighter">Admit Patient</h2>
//                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized Personnel Only</p>
//                 </div>
//                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-red-500 transition-colors"><X size={20} /></button>
//               </div>
//               <div className="grid grid-cols-12 gap-6 mb-8">
//                 <div className="col-span-12 p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
//                   <div>
//                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Target Asset</p>
//                     <p className="text-3xl font-black text-white">{selectedBed.id}</p>
//                   </div>
//                   <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center font-black">
//                     <BedDouble size={24} />
//                   </div>
//                 </div>
//               </div>
//               <form onSubmit={submitAdmission} className="space-y-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission ID (Optional)</label>
//                   <input className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-mono text-xs transition-all" placeholder="ADM-XXXXXX (Leave blank for new)" value={patientData.admissionUid} onChange={e => setPatientData({ ...patientData, admissionUid: e.target.value })} />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Full Name</label>
//                   <input required className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all" placeholder="Enter name..." value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })} />
//                 </div>
//                 <div className="grid grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
//                     <input type="number" required className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all" value={patientData.age} onChange={e => setPatientData({ ...patientData, age: e.target.value })} />
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
//                     <select className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all appearance-none" value={patientData.gender} onChange={e => setPatientData({ ...patientData, gender: e.target.value })}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
//                   </div>
//                 </div>
//                 {activeUnit === 'Surgery' && (
//                   <>
//                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
//                       <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1 flex items-center gap-2">Surgery Category</label>
//                       <select className="w-full p-5 bg-[#0f172a] border border-purple-500/30 focus:border-purple-500 rounded-2xl text-white outline-none font-medium appearance-none" value={patientData.surgeryType} onChange={e => setPatientData({ ...patientData, surgeryType: e.target.value })}>
//                         <option value="Minor">Minor (12.5k)</option>
//                         <option value="Intermediate">Intermediate (52.5k)</option>
//                         <option value="Major">Major (150k)</option>
//                         <option value="Specialized">Specialized (425k+)</option>
//                       </select>
//                     </div>
//                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
//                       <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1 flex items-center gap-2">Attending Surgeon</label>
//                       <div className="relative">
//                         <Stethoscope className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
//                         <input required className="w-full p-5 pl-14 bg-[#0f172a] border border-purple-500/30 focus:border-purple-500 rounded-2xl text-white outline-none font-medium" placeholder="Dr. Name..." value={patientData.surgeonName} onChange={e => setPatientData({ ...patientData, surgeonName: e.target.value })} />
//                       </div>
//                     </div>
//                   </>
//                 )}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condition</label>
//                   <select className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all appearance-none" value={patientData.condition} onChange={e => setPatientData({ ...patientData, condition: e.target.value })}><option>Stable</option><option>Critical</option><option>Observation</option><option>Pre-Surgery</option></select>
//                 </div>
//                 {activeUnit === 'Wards' && wardCategory === 'Medical' && getBedGender(selectedBed.id) !== 'Any' && getBedGender(selectedBed.id) !== patientData.gender && (
//                   <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-pulse"><ShieldAlert className="text-red-500" size={24} /><p className="text-xs font-black text-red-400 uppercase tracking-wide">Violation: {getBedGender(selectedBed.id)} Only Unit.</p></div>
//                 )}
//                 <button type="submit" disabled={activeUnit === 'Wards' && wardCategory === 'Medical' && getBedGender(selectedBed.id) !== 'Any' && getBedGender(selectedBed.id) !== patientData.gender} className={`w-full py-5 font-black uppercase tracking-[0.2em] rounded-2xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${(activeUnit === 'Wards' && wardCategory === 'Medical' && getBedGender(selectedBed.id) !== 'Any' && getBedGender(selectedBed.id) !== patientData.gender) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_40px_rgba(79,70,229,0.3)]'}`}>Confirm Admission</button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {dischargeBedId && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDischargeBedId(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0b0b0b] rounded-[2.5rem] p-8 max-w-sm w-full border border-red-500/20 relative z-10 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
//               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/30"><LogOut size={32} className="text-red-500" /></div>
//               <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Discharge Patient?</h2>
//               <p className="text-slate-500 text-sm mb-8 font-medium">This active bed will be marked for <span className="text-orange-400 font-bold">Sterilization Protocols</span> immediately.</p>
//               <div className="flex gap-4">
//                 <button onClick={() => setDischargeBedId(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl text-slate-300 font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">Cancel</button>
//                 <button onClick={confirmDischarge} className="flex-1 py-4 bg-red-600 rounded-2xl text-white font-bold uppercase tracking-wider hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20">Confirm</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default AdminPanel;
















"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    BedDouble, Activity, BrainCircuit, Package,
    ArrowLeft, Plus, X, MapPin,
    Siren, LogOut, Baby, Stethoscope,
    ShieldAlert, HeartPulse, Timer, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResourceInventory from '@/components/ResourceInventory';
import SurgerySection from '@/components/SurgerySection';
import { endpoints } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

// --- HELPERS ---
const formatIST = (isoString?: string) => {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
};

const getBedGender = (bedId: string): 'Male' | 'Female' | 'Any' => {
    const num = parseInt(bedId.replace(/^\D+/g, '') || '0');
    if (num >= 1 && num <= 20) return 'Male';
    if (num >= 21 && num <= 40) return 'Female';
    return 'Any';
};

// --- COMPONENTS ---

const UnitHeroCard = ({ title, icon: Icon, total, occupied, isActive, onClick, colorClass }: any) => {
    const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const isCritical = percentage >= 80;

    const getColors = () => {
        switch (colorClass) {
            case 'red': return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', gradient: 'from-red-500/20' };
            case 'blue': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', gradient: 'from-blue-500/20' };
            case 'indigo': return { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', gradient: 'from-indigo-500/20' };
            case 'emerald': return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', gradient: 'from-emerald-500/20' };
            default: return { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500', gradient: 'from-slate-500/20' };
        }
    };
    const c = getColors();

    return (
        <button
            onClick={onClick}
            className={`relative p-6 rounded-[2.5rem] border transition-all duration-500 w-full text-left overflow-hidden group hover:-translate-y-1
        ${isActive ? `bg-card ${c.border}` : 'bg-card/40 border-border hover:border-primary/30'}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isActive ? 'opacity-20' : ''}`} />
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${isActive ? `${c.bg} text-white shadow-lg` : 'bg-muted text-muted-foreground'}`}>
                    <Icon size={24} />
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-foreground">{percentage}%</p>
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isActive ? c.text : 'text-slate-600'}`}>Occupancy</p>
                </div>
            </div>
            <div className="relative z-10 space-y-3">
                <h3 className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-foreground' : 'text-slate-400'}`}>{title}</h3>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full ${isCritical ? 'bg-red-500' : `${c.bg}`}`}
                    />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Active Units</p>
                    <p className="text-xs font-mono text-foreground"><span className={`${c.text} font-bold`}>{occupied}</span> / {total}</p>
                </div>
            </div>
        </button>
    );
};

const CleaningTimer = ({ bedId, onRequestUnlock }: { bedId: string, onRequestUnlock: () => void }) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        const storageKey = `cleaning_end_time_${bedId}`;
        let endTime = localStorage.getItem(storageKey);
        if (!endTime) {
            const newEndTime = Date.now() + 180 * 1000;
            localStorage.setItem(storageKey, newEndTime.toString());
            endTime = newEndTime.toString();
        }
        const checkTime = () => {
            const remaining = Math.round((parseInt(endTime!) - Date.now()) / 1000);
            if (remaining <= 0) { setTimeLeft(0); setIsFinished(true); return true; }
            setTimeLeft(remaining); return false;
        };
        if (!checkTime()) {
            const timer = setInterval(() => { if (checkTime()) clearInterval(timer); }, 1000);
            return () => clearInterval(timer);
        }
    }, [bedId]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isFinished) {
        return (
            <button onClick={onRequestUnlock} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl animate-bounce transition-colors uppercase tracking-widest text-[10px]">
                Mark Ready
            </button>
        );
    }
    return (
        <div className="text-center py-3 bg-sky-500/10 rounded-xl border border-sky-400/20">
            <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1">Sterilization</p>
            <p className="text-2xl font-black text-foreground font-mono tracking-tighter">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</p>
        </div>
    );
};

const BedCard = ({ bed, onDischarge, onAdmit, onStartCleaning, onRefresh, accentColor, genderLock, patientGender }: any) => {
    const { token } = useAuth();
    const isRed = accentColor === 'red';
    const isGreen = accentColor === 'green';
    const isLocked = !bed.is_occupied && genderLock && genderLock !== 'Any' && patientGender && patientGender !== genderLock;

    const textClass = isRed ? 'text-red-400' : isGreen ? 'text-emerald-400' : 'text-blue-400';

    const handleManualUnlock = async () => {
        try {
            await fetch(endpoints.cleaningComplete(bed.id), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            localStorage.removeItem(`cleaning_end_time_${bed.id}`);
            onRefresh();
        } catch (e) { console.error(e); }
    };

    if (isLocked) {
        return (
            <div className="p-6 rounded-3xl border border-dashed border-border bg-muted/30 opacity-40 grayscale pointer-events-none relative overflow-hidden flex flex-col items-center justify-center gap-2">
                <ShieldAlert size={24} className="text-slate-600" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Restricted</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden group 
      ${bed.status === 'OCCUPIED'
                    ? isRed ? 'bg-red-500/5 border-red-500/30' : isGreen ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-blue-500/5 border-blue-500/30'
                    : bed.status === 'DIRTY' ? 'bg-orange-500/5 border-orange-500/20' : bed.status === 'CLEANING' ? 'bg-sky-500/5 border-sky-500/20' : 'bg-card border-border hover:border-primary/30'}`}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <p className="text-xs font-black text-slate-400 px-3 py-1.5 rounded-lg bg-muted border border-border">{bed.id}</p>
                    {genderLock && genderLock !== 'Any' && (
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${genderLock === 'Male' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
                            {genderLock}
                        </span>
                    )}
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-opacity-20 ${bed.status === "AVAILABLE" ? "bg-emerald-500 ring-emerald-500" : bed.status === "OCCUPIED" ? (isRed ? "bg-red-500 ring-red-500" : "bg-blue-500 ring-blue-500") : bed.status === "DIRTY" ? "bg-orange-500 ring-orange-500" : "bg-sky-500 ring-sky-500"}`} />
            </div>
            {bed.status === "OCCUPIED" ? (
                <div className="space-y-6">
                    <div>
                        <p className="text-lg font-black text-foreground truncate leading-tight uppercase italic">{bed.patient_name || "Unidentified"}</p>
                        <p className={`text-[10px] font-bold ${textClass} uppercase tracking-widest mt-1`}>{bed.condition || "General Care"}</p>
                        {bed.ventilator_in_use && <span className="inline-flex mt-3 items-center gap-1.5 text-[9px] font-black text-cyan-300 bg-cyan-950/50 px-3 py-1.5 rounded-md border border-cyan-500/30"><Activity size={10} /> VENTILATOR ONLINE</span>}
                    </div>
                    <button onClick={onDischarge} className={`w-full py-3 ${isRed ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20'} border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors`}>Initiate Discharge</button>
                </div>
            ) : bed.status === "DIRTY" ? (
                <div className="space-y-4">
                    <div className="flex flex-col items-center py-4 text-orange-400/50">
                        <Baby size={32} className="mb-2 animate-pulse" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Unit Secluded</p>
                    </div>
                    <button onClick={() => onStartCleaning(bed.id)} className="w-full py-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-[10px] font-black rounded-xl uppercase tracking-widest transition-colors">Start Protocol</button>
                </div>
            ) : bed.status === "CLEANING" ? (
                <CleaningTimer bedId={bed.id} onRequestUnlock={handleManualUnlock} />
            ) : (
                <button onClick={onAdmit} className="w-full py-10 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all gap-3 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl bg-muted/20 group-hover:bg-card">
                    <div className="p-3 rounded-full bg-muted group-hover:bg-primary/20 transition-colors">
                        <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Assign Patient</span>
                </button>
            )}
        </motion.div>
    );
};

// --- MAIN PANEL ---

const AdminPanel = () => {
    const { token } = useAuth();
    const { toast } = useToast();
    const [beds, setBeds] = useState<any[]>([]);
    const [ambulances, setAmbulances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeUnit, setActiveUnit] = useState<'ICU' | 'ER' | 'Surgery' | 'Wards'>('ICU');
    const [wardCategory, setWardCategory] = useState<'Medical' | 'Specialty' | 'Recovery' | 'Security'>('Medical');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBed, setSelectedBed] = useState<any | null>(null);
    const [patientData, setPatientData] = useState({
        name: '', age: '', gender: 'Male', condition: 'Stable',
        surgeonName: '', duration: 60,
        surgeryType: 'Minor', admissionUid: ''
    });

    const [dispatchForm, setDispatchForm] = useState({ severity: 'HIGH', location: '', eta: 10 });
    const [dischargeBedId, setDischargeBedId] = useState<string | null>(null);

    const fetchERPData = useCallback(async () => {
        try {
            const [bedsRes, ambRes] = await Promise.all([fetch(endpoints.beds), fetch(endpoints.ambulances)]);
            const bedsData = await bedsRes.json();
            const ambData = await ambRes.json();
            setBeds(Array.isArray(bedsData) ? bedsData : []);
            setAmbulances(Array.isArray(ambData) ? ambData : []);
            setLoading(false);
        } catch { toast("Sync Error", "error"); setLoading(false); }
    }, [toast]);

    useEffect(() => { fetchERPData(); }, [fetchERPData]);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (["SURGERY_UPDATE", "SURGERY_EXTENDED", "ROOM_RELEASED", "BED_UPDATE", "REFRESH_RESOURCES", "NEW_ADMISSION"].includes(data.type)) {
                    fetchERPData();
                }
            } catch { }
        };
        return () => ws.close();
    }, [fetchERPData]);

    const handleStartCleaning = async (id: string) => {
        await fetch(endpoints.startCleaning(id), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchERPData();
    };
    const resetAmbulance = async (id: string) => {
        await fetch(endpoints.ambulanceReset(id), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchERPData();
    };

    const handleDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(endpoints.ambulanceDispatch, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dispatchForm)
            });
            const data = await res.json();
            toast(data.status === 'DISPATCHED' ? "Unit Authorized" : "Dispatch Failed", data.status === 'DISPATCHED' ? "success" : "error");
            fetchERPData();
        } catch { toast("Network Error", "error"); }
    };

    const confirmDischarge = async () => {
        if (!dischargeBedId) return;
        await fetch(endpoints.discharge(dischargeBedId), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        toast("Patient Discharged", "success");
        setDischargeBedId(null);
        fetchERPData();
    };

    const openAdmitModal = (bed: any) => {
        setSelectedBed(bed);
        let defCond = activeUnit === 'ICU' ? 'Critical' : activeUnit === 'Surgery' ? 'Pre-Surgery' : 'Stable';
        setPatientData({
            name: '', age: '', gender: 'Male', condition: defCond,
            surgeonName: '', duration: 60,
            surgeryType: 'Minor', admissionUid: ''
        });
        setIsModalOpen(true);
    };

    const submitAdmission = async (e: React.FormEvent) => {
        e.preventDefault();
        const staffId = localStorage.getItem('staff_id');
        if (!staffId) { toast("Auth Error", "error"); return; }
        try {
            const payload: any = {
                bed_id: String(selectedBed.id),
                patient_name: patientData.name,
                patient_age: Number(patientData.age),
                condition: patientData.condition,
                staff_id: staffId,
                gender: patientData.gender
            };
            let res;
            if (selectedBed.type === 'Surgery') {
                res = await fetch(endpoints.startSurgery, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...payload,
                        surgeon_name: patientData.surgeonName,
                        duration_minutes: Number(patientData.duration),
                        surgery_type: patientData.surgeryType,
                        admission_uid: patientData.admissionUid || null
                    })
                });
            } else {
                res = await fetch(endpoints.admit, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }
            if (res.ok) { setIsModalOpen(false); toast("Admission Confirmed", "success"); fetchERPData(); }
            else { toast("Admission Rejected", "error"); }
        } catch { toast("System Error", "error"); }
    };

    const getDisplayBeds = () => {
        const unitBeds = beds.filter(b => b.type === activeUnit);
        if (activeUnit === 'Wards') {
            return unitBeds.filter(b => {
                const num = parseInt(b.id.replace(/^\D+/g, '') || '0');
                if (wardCategory === 'Medical') return num >= 1 && num <= 40;
                if (wardCategory === 'Specialty') return num >= 41 && num <= 70;
                if (wardCategory === 'Recovery') return num >= 71 && num <= 90;
                if (wardCategory === 'Security') return num >= 91;
                return false;
            });
        }
        return unitBeds;
    };

    const getUnitStats = (type: string) => {
        const unitBeds = beds.filter(b => b.type === type);
        return { total: unitBeds.length, occupied: unitBeds.filter(b => b.status === "OCCUPIED").length };
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center font-mono animate-pulse text-primary">
            <Activity className="animate-spin mr-3" />
            INITIALIZING ERP LINK...
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/30">

            <div className="max-w-[1900px] mx-auto grid grid-cols-12 min-h-screen">

                <div className="col-span-12 p-8 lg:p-12 flex flex-col gap-10 pb-60">

                    {/* HEADER */}
                    <div className="flex justify-between items-end border-b border-border pb-8 shrink-0">
                        <div>
                            <h1 className="text-5xl font-black text-foreground tracking-tighter flex items-center gap-4 uppercase italic">
                                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                                    <Activity className="text-primary-foreground" size={32} />
                                </div>
                                PHRELIS ERP <span className="text-slate-500 font-light dark:text-slate-700">| ADMIN</span>
                            </h1>
                            <p className="text-slate-500 font-mono text-sm mt-3 pl-20 flex items-center gap-3 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                IST: {formatIST()} • SYSTEM ONLINE
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/admin/audit-logs" className="px-8 py-4 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:border-primary transition-all flex items-center gap-2">
                                <ShieldAlert size={16} className="text-primary" />
                                Sentinel
                            </Link>
                            <Link href="/" className="px-8 py-4 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:border-primary transition-all">
                                Return HQ
                            </Link>
                        </div>
                    </div>

                    {/* LAYER 1: LOGISTICS */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 shrink-0">
                        <div className="bg-card rounded-[2rem] border border-rose-500/20 p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative z-10 flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-foreground flex items-center gap-3 uppercase italic tracking-tighter">
                                        <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                            <Siren className="text-rose-500" size={24} />
                                        </div>
                                        EMERGENCY DISPATCH
                                    </h3>
                                    <p className="text-xs text-rose-500/60 font-bold uppercase tracking-[0.2em] mt-2 pl-16">High Priority Channel</p>
                                </div>
                                <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                            </div>
                            <form onSubmit={handleDispatch} className="relative z-10 grid grid-cols-12 gap-4">
                                <div className="col-span-12 xl:col-span-3">
                                    <label className="text-[10px] font-bold text-rose-500 uppercase ml-2 mb-1 block">Triage Level</label>
                                    <select className="w-full h-14 px-4 bg-muted/50 border border-border focus:border-rose-500 rounded-xl outline-none font-bold text-sm text-foreground appearance-none cursor-pointer" value={dispatchForm.severity} onChange={e => setDispatchForm({ ...dispatchForm, severity: e.target.value })}>
                                        <option value="HIGH">CRITICAL (RED)</option>
                                        <option value="LOW">STABLE (YELLOW)</option>
                                    </select>
                                </div>
                                <div className="col-span-12 xl:col-span-6">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Incident Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input type="text" placeholder="Location..." required className="w-full h-14 pl-12 pr-4 bg-muted/50 border border-border focus:border-rose-500 rounded-xl text-sm font-medium text-foreground placeholder-slate-600 outline-none transition-all" value={dispatchForm.location} onChange={e => setDispatchForm({ ...dispatchForm, location: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="col-span-12 xl:col-span-3 h-14 mt-auto bg-rose-600 hover:bg-rose-500 rounded-xl font-black text-white text-xs uppercase tracking-[0.15em] transition-all active:scale-95">
                                    AUTHORIZE
                                </button>
                            </form>
                        </div>

                        <div className="bg-card rounded-[2rem] border border-border p-8 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-foreground flex items-center gap-3 uppercase italic tracking-tighter">
                                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                            <Activity className="text-primary" size={24} />
                                        </div>
                                        FLEET COMMAND
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2 pl-16">
                                        <span className="text-primary font-black text-sm">{ambulances.filter(a => a.status === 'IDLE').length}</span> Units Active
                                    </p>
                                </div>
                            </div>
                            <div className="relative z-10 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {ambulances.map(amb => (
                                    <div key={amb.id} className={`shrink-0 w-40 p-5 rounded-2xl border flex flex-col justify-between h-32 transition-all ${amb.status === 'IDLE' ? 'bg-muted/50 border-border hover:border-primary' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                        <div className="flex justify-between items-start">
                                            <span className="font-black text-foreground text-lg">{amb.id}</span>
                                            <div className={`w-2 h-2 rounded-full ${amb.status === 'IDLE' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sector</p>
                                            <div className="text-xs font-mono text-foreground truncate">{amb.location}</div>
                                        </div>
                                        {amb.status !== 'IDLE' && <button onClick={() => resetAmbulance(amb.id)} className="text-[9px] text-amber-600 font-bold uppercase hover:underline text-left mt-2">Recall Unit</button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* LAYER 2: UNIT SWITCHER */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                        <UnitHeroCard title="ICU" icon={Activity} {...getUnitStats('ICU')} isActive={activeUnit === 'ICU'} onClick={() => setActiveUnit('ICU')} colorClass="red" />
                        <UnitHeroCard title="Emergency" icon={BedDouble} {...getUnitStats('ER')} isActive={activeUnit === 'ER'} onClick={() => setActiveUnit('ER')} colorClass="blue" />
                        <UnitHeroCard title="Surgery" icon={BrainCircuit} {...getUnitStats('Surgery')} isActive={activeUnit === 'Surgery'} onClick={() => setActiveUnit('Surgery')} colorClass="indigo" />
                        <UnitHeroCard title="Wards" icon={Package} {...getUnitStats('Wards')} isActive={activeUnit === 'Wards'} onClick={() => setActiveUnit('Wards')} colorClass="emerald" />
                    </div>

                    {/* LAYER 3: DYNAMIC ASSET GRID */}
                    <div className="bg-card rounded-[2.5rem] border border-border p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.015] pointer-events-none" />
                        <div className="relative z-10 flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">{activeUnit} Grid</h2>
                                <p className="text-xs text-primary font-bold uppercase tracking-[0.2em] mt-1">Live Asset Monitoring</p>
                            </div>
                            {activeUnit === 'Wards' && (
                                <div className="hidden xl:flex bg-muted p-1.5 rounded-2xl border border-border shadow-inner">
                                    {[{ id: 'Medical', icon: HeartPulse }, { id: 'Specialty', icon: Baby }, { id: 'Recovery', icon: Stethoscope }, { id: 'Security', icon: ShieldAlert }].map(cat => (
                                        <button key={cat.id} onClick={() => setWardCategory(cat.id as any)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${wardCategory === cat.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-foreground hover:bg-card'}`}><cat.icon size={14} /> {cat.id}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeUnit + wardCategory}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                                >
                                    {activeUnit === 'Surgery' ? (
                                        <div className="col-span-full"><SurgerySection beds={beds} onRefresh={fetchERPData} onAdmit={openAdmitModal} /></div>
                                    ) : getDisplayBeds().map(bed => (
                                        <BedCard key={bed.id} bed={bed} onDischarge={() => setDischargeBedId(bed.id)} onAdmit={() => openAdmitModal(bed)} onStartCleaning={handleStartCleaning} onRefresh={fetchERPData} accentColor={activeUnit === 'ICU' ? 'red' : activeUnit === 'Wards' ? 'green' : 'blue'} genderLock={activeUnit === 'Wards' && wardCategory === 'Medical' ? getBedGender(bed.id) : null} patientGender={patientData.gender} />
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <ResourceInventory />
            </div>

            {/* Admitting Modal */}
            <AnimatePresence>
                {isModalOpen && selectedBed && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-card rounded-[2.5rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-border relative z-10 custom-scrollbar shadow-2xl dark:shadow-none">
                            <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
                                <div>
                                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Admit Patient</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Operational Protocol v4.0</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-muted rounded-full text-slate-500 hover:text-white hover:bg-red-500 transition-all"><X size={20} /></button>
                            </div>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between mb-8 shadow-inner">
                                <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Target Asset</p>
                                    <p className="text-3xl font-black text-foreground">{selectedBed.id}</p>
                                </div>
                                <BedDouble size={36} className="text-primary opacity-30" />
                            </div>
                            <form onSubmit={submitAdmission} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">UID Override (Optional)</label>
                                    <input className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground outline-none font-mono text-xs transition-all" placeholder="Leave blank for automatic UID" value={patientData.admissionUid} onChange={e => setPatientData({ ...patientData, admissionUid: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patient Identity</label>
                                    <input required className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground outline-none font-bold transition-all" placeholder="Enter Full Name..." value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</label>
                                        <input type="number" required className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground outline-none font-bold transition-all" value={patientData.age} onChange={e => setPatientData({ ...patientData, age: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                                        <select className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground outline-none font-bold transition-all appearance-none" value={patientData.gender} onChange={e => setPatientData({ ...patientData, gender: e.target.value })}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                                    </div>
                                </div>

                                {activeUnit === 'Surgery' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl animate-in zoom-in-95 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Category</label>
                                            <select className="w-full p-5 bg-card border border-border rounded-2xl text-foreground font-bold text-xs" value={patientData.surgeryType} onChange={e => setPatientData({ ...patientData, surgeryType: e.target.value })}>
                                                <option value="Minor">Minor</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Major">Major</option>
                                                <option value="Specialized">Specialized</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Surgeon</label>
                                            <div className="relative">
                                                <Stethoscope className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                                                <input required className="w-full p-5 pl-14 bg-card border border-border rounded-2xl text-foreground font-bold text-sm" placeholder="Dr. Name..." value={patientData.surgeonName} onChange={e => setPatientData({ ...patientData, surgeonName: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ESI Triage</label>
                                    <select className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground outline-none font-bold transition-all appearance-none" value={patientData.condition} onChange={e => setPatientData({ ...patientData, condition: e.target.value })}><option>Stable</option><option>Critical</option><option>Observation</option><option>Pre-Surgery</option></select>
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all">Authorize Admission</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {dischargeBedId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setDischargeBedId(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card rounded-[3rem] p-8 max-w-sm w-full border border-rose-500/20 relative z-10 text-center shadow-2xl dark:shadow-none">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20"><LogOut size={32} className="text-rose-500" /></div>
                            <h2 className="text-2xl font-black text-foreground mb-2 tracking-tighter uppercase italic leading-none">Execute Finalize?</h2>
                            <p className="text-slate-500 text-xs mb-8 font-bold uppercase tracking-widest">Asset will be locked for Sterilization.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDischargeBedId(null)} className="flex-1 py-4 bg-muted text-slate-500 font-bold uppercase tracking-wider rounded-2xl hover:bg-card transition-all">Abort</button>
                                <button onClick={confirmDischarge} className="flex-1 py-4 bg-rose-600 text-white font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-600/20 transition-all">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPanel;