// "use client";

// import React, { useEffect, useState } from 'react';
// import { Package, AlertTriangle, Activity, Box, ChevronLeft, ChevronRight, X, Clock, Plus } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '@/context/AuthContext';

// interface ResourceProps {
//   resources?: any;
//   isSimulating?: boolean;
// }

// interface InventoryItem {
//   id: number;
//   name: string;
//   category: string;
//   quantity: number;
//   reorder_level: number;
//   // New Forecast Fields
//   burn_rate: number;
//   hours_remaining: number;
//   status: "Normal" | "Warning" | "Critical";
// }

// const CircularProgress = ({ percentage, color }: { percentage: number, color: string }) => {
//   const radius = 24;
//   const circumference = 2 * Math.PI * radius;
//   const offset = circumference - (percentage / 100) * circumference;

//   return (
//     <div className="relative w-16 h-16 flex items-center justify-center">
//       <svg className="transform -rotate-90 w-full h-full">
//         <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
//         <circle
//           cx="32" cy="32" r={radius}
//           stroke="currentColor" strokeWidth="4" fill="transparent"
//           strokeDasharray={circumference}
//           strokeDashoffset={offset}
//           strokeLinecap="round"
//           className={`${color} transition-all duration-1000 ease-spring-smooth`}
//         />
//       </svg>
//       <span className={`absolute text-[10px] font-black ${color}`}>{Math.round(percentage)}%</span>
//     </div>
//   );
// };

// const Sparkline = ({ color }: { color: string }) => {
//   return (
//     <svg viewBox="0 0 100 30" className={`w-24 h-10 ${color} opacity-60`}>
//       <path
//         d="M0 25 Q 10 15, 20 25 T 40 10 T 60 20 T 80 5 T 100 15"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2.5"
//         strokeLinecap="round"
//         vectorEffect="non-scaling-stroke"
//       />
//       <path d="M0 25 Q 10 15, 20 25 T 40 10 T 60 20 T 80 5 T 100 15 V 30 H 0 Z" fill="currentColor" className="opacity-10" />
//     </svg>
//   )
// }

// const ResourceInventory: React.FC<ResourceProps> = () => {
//   const { token, role } = useAuth();
//   const [inventory, setInventory] = useState<InventoryItem[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '',
//     category: 'General',
//     quantity: 0,
//     reorder_level: 0
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [restockModalItem, setRestockModalItem] = useState<InventoryItem | null>(null);
//   const [restockQuantity, setRestockQuantity] = useState(0);

//   // [UPDATED] Fetch from Forecast Endpoint
//   const fetchInventory = async () => {
//     try {
//       const res = await fetch('http://localhost:8000/api/inventory/forecast');
//       if (res.ok) {
//         const data = await res.json();
//         setInventory(data);
//       }
//     } catch (e) { console.error("Failed to fetch inventory", e); }
//   };

//   const handleAddResource = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const res = await fetch('http://localhost:8000/api/inventory/add', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(formData)
//       });

//       if (res.ok) {
//         setIsAddModalOpen(false);
//         setFormData({ name: '', category: 'General', quantity: 0, reorder_level: 0 });
//         fetchInventory();
//       } else {
//         const error = await res.json();
//         alert(error.detail || 'Failed to add resource');
//       }
//     } catch (e) {
//       console.error("Failed to add resource", e);
//       alert('Network error. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleRestock = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!restockModalItem) return;
//     setIsSubmitting(true);

//     try {
//       const res = await fetch('http://localhost:8000/api/inventory/restock', {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           item_id: restockModalItem.id,
//           quantity_to_add: restockQuantity
//         })
//       });

//       if (res.ok) {
//         setRestockModalItem(null);
//         setRestockQuantity(0);
//         fetchInventory();
//       } else {
//         const error = await res.json();
//         alert(error.detail || 'Failed to restock');
//       }
//     } catch (e) {
//       console.error("Failed to restock", e);
//       alert('Network error. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   useEffect(() => {
//     fetchInventory();
//     const ws = new WebSocket('ws://localhost:8000/ws');
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.type === 'REFRESH_INVENTORY' || data.type === 'LOW_STOCK_ALERT') {
//         fetchInventory();
//       }
//     };
//     return () => ws.close();
//   }, []);

//   return (
//     <>
//       {/* VERTICAL TRIGGER TAB (Visible when closed) */}
//       <AnimatePresence>
//         {!isOpen && (
//           <motion.button
//             initial={{ x: 100, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: 100, opacity: 0 }}
//             transition={{ type: "spring", stiffness: 120, damping: 20 }}
//             onClick={() => setIsOpen(true)}
//             className="fixed top-1/2 -translate-y-1/2 right-0 z-[60] py-8 px-2 bg-[#0f172a] border-l border-y border-indigo-500/30 rounded-l-2xl shadow-[0_0_30px_rgba(99,102,241,0.2)] flex flex-col items-center justify-center gap-4 hover:bg-indigo-950/50 hover:border-indigo-500 transition-all cursor-pointer group"
//           >
//             <Package size={20} className="text-indigo-400 group-hover:text-white transition-colors animate-pulse" />
//             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] whitespace-nowrap group-hover:text-white transition-colors" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
//               Supply Node
//             </span>
//             <ChevronLeft size={16} className="text-slate-500 group-hover:-translate-x-1 transition-transform" />
//           </motion.button>
//         )}
//       </AnimatePresence>

//       {/* DRAWER BACKDROP */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setIsOpen(false)}
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
//           />
//         )}
//       </AnimatePresence>

//       {/* DRAWER CONTAINER */}
//       <motion.div
//         initial={{ x: '100%' }}
//         animate={{ x: isOpen ? 0 : '100%' }}
//         exit={{ x: '100%' }}
//         transition={{ type: "spring", stiffness: 120, damping: 20 }}
//         className="fixed top-0 right-0 h-screen w-1/2 min-w-[500px] bg-[#020617] border-l border-indigo-500/20 shadow-2xl z-50 flex flex-col"
//       >
//         {/* HEADER */}
//         <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0b0b0b]/50 backdrop-blur-md">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
//               <Package size={24} />
//             </div>
//             <div>
//               <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Supply Chain Node</h2>
//               <p className="text-xs text-indigo-400/60 font-bold tracking-widest uppercase">Predictive Inventory Engine Active</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             {role === 'Admin' && (
//               <button
//                 onClick={() => setIsAddModalOpen(true)}
//                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
//               >
//                 <Plus size={16} />
//                 Add Resource
//               </button>
//             )}
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
//               <div className={`w-2 h-2 rounded-full ${inventory.some(i => i.status === "Critical") ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'} animate-pulse`} />
//               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">System Operational</span>
//             </div>
//             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
//               <X size={24} className="text-slate-500 hover:text-white" />
//             </button>
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-[#020617]">
//           <style jsx global>{`
//                     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//                     .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//                     .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 9999px; }
//                 `}</style>

//           {inventory.map((item) => {
//             // Logic based on Forecast Status
//             const isCritical = item.status === "Critical";
//             const isWarning = item.status === "Warning";
//             const isLow = isCritical || isWarning;

//             const percentage = Math.min((item.quantity / (item.reorder_level * 3)) * 100, 100);

//             // Color Logic
//             let color = 'text-emerald-500';
//             if (isCritical) color = 'text-rose-500';
//             else if (isWarning) color = 'text-amber-500';

//             const borderColor = isLow ? (isCritical ? 'border-rose-500/30' : 'border-amber-500/30') : 'border-slate-800';
//             const bg = isLow ? (isCritical ? 'bg-rose-500/[0.03]' : 'bg-amber-500/[0.03]') : 'bg-[#0f172a]';
//             const glow = isCritical ? 'shadow-[0_0_30px_rgba(244,63,94,0.1)]' : (isWarning ? 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'hover:shadow-lg hover:shadow-indigo-500/5');

//             return (
//               <motion.div
//                 layout
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 key={item.id}
//                 className={`group relative p-6 rounded-3xl border ${borderColor} ${bg} ${glow} transition-all duration-300`}
//               >
//                 {/* Status Badge */}
//                 {isLow && (
//                   <div className="absolute top-0 right-0 p-4">
//                     <div className={`flex items-center gap-2 px-3 py-1 border rounded-lg animate-pulse ${isCritical ? 'bg-rose-500/20 border-rose-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
//                       <AlertTriangle size={12} className={isCritical ? "text-rose-500" : "text-amber-500"} />
//                       <span className={`text-[9px] font-black uppercase tracking-widest ${isCritical ? "text-rose-400" : "text-amber-400"}`}>
//                         {isCritical ? "Stockout Imminent" : "Reorder Advised"}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex items-center gap-6">
//                   <CircularProgress percentage={percentage} color={color} />

//                   <div className="flex-1">
//                     <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${isLow ? (isCritical ? 'text-rose-200' : 'text-amber-200') : 'text-slate-200'} group-hover:text-white transition-colors`}>{item.name}</h3>

//                     <div className="flex justify-between items-end">
//                       <div>
//                         <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{item.category}</p>
//                         <div className="flex items-baseline gap-1">
//                           <p className={`text-3xl font-black ${color} tracking-tighter`}>{item.quantity}</p>
//                           <span className="text-[10px] text-slate-600 font-bold uppercase">/ {item.reorder_level * 3}</span>
//                         </div>
//                       </div>
//                       <div className="hidden sm:block pb-1">
//                         <Sparkline color={isCritical ? 'text-rose-500' : (isWarning ? 'text-amber-500' : 'text-indigo-500')} />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Analytical Footer */}
//                 <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5">
//                   {/* Dynamic Predictive Label */}
//                   {item.burn_rate > 0.1 ? (
//                     <div className="flex items-center gap-2">
//                       <Clock size={12} className={isCritical ? "text-rose-500" : (isWarning ? "text-amber-500" : "text-slate-500")} />
//                       <span className={`text-[10px] font-bold uppercase tracking-wider ${isCritical ? "text-rose-400" : (isWarning ? "text-amber-400" : "text-slate-500")}`}>
//                         {item.hours_remaining < 999
//                           ? `Exhaustion in ${item.hours_remaining} hrs`
//                           : "Supply Stable"}
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
//                       <Activity size={12} />
//                       <span className="uppercase tracking-wider">Low Usage Detected</span>
//                     </div>
//                   )}

//                   <div className="flex items-center gap-2">
//                     <div className={`text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${isCritical ? 'bg-rose-500/10 text-rose-400' : (isWarning ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400')}`}>
//                       {item.burn_rate.toFixed(1)} Units / Hr
//                     </div>
//                     {role === 'Admin' && (
//                       <button
//                         onClick={() => {
//                           setRestockModalItem(item);
//                           setRestockQuantity(0);
//                         }}
//                         className="text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
//                       >
//                         Restock
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </motion.div>
//             );
//           })}

//           {inventory.length === 0 && (
//             <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-20">
//               <Box size={48} className="text-indigo-500/50 mb-4 animate-bounce" />
//               <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Calculated Burn Rates...</p>
//             </div>
//           )}
//         </div>
//       </motion.div>

//       {/* ADD RESOURCE MODAL */}
//       <AnimatePresence>
//         {isAddModalOpen && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black/80 backdrop-blur-md"
//               onClick={() => setIsAddModalOpen(false)}
//             />
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.9, y: 20 }}
//               className="bg-[#0b0b0b] rounded-[2.5rem] p-10 max-w-xl w-full border border-indigo-500/20 relative z-10 shadow-2xl"
//             >
//               <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
//                 <div>
//                   <h2 className="text-3xl font-black text-white tracking-tighter">Add Resource</h2>
//                   <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Supply Chain Management</p>
//                 </div>
//                 <button
//                   onClick={() => setIsAddModalOpen(false)}
//                   className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-red-500 transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>

//               <form onSubmit={handleAddResource} className="space-y-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Resource Name</label>
//                   <input
//                     required
//                     className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all"
//                     placeholder="e.g., Surgical Masks"
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Category</label>
//                   <select
//                     className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all appearance-none cursor-pointer"
//                     value={formData.category}
//                     onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                   >
//                     <option value="General">General</option>
//                     <option value="ICU">ICU</option>
//                     <option value="ER">ER</option>
//                     <option value="Surgery">Surgery</option>
//                     <option value="OPD">OPD</option>
//                   </select>
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Initial Quantity</label>
//                     <input
//                       type="number"
//                       required
//                       min="0"
//                       className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all"
//                       value={formData.quantity}
//                       onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Reorder Level</label>
//                     <input
//                       type="number"
//                       required
//                       min="0"
//                       className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all"
//                       value={formData.reorder_level}
//                       onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
//                     />
//                   </div>
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className={`w-full py-5 font-black uppercase tracking-[0.2em] rounded-2xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${isSubmitting
//                     ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
//                     : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_40px_rgba(79,70,229,0.3)]'
//                     }`}
//                 >
//                   {isSubmitting ? 'Adding...' : 'Add Resource'}
//                 </button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* RESTOCK MODAL */}
//       <AnimatePresence>
//         {restockModalItem && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black/80 backdrop-blur-md"
//               onClick={() => setRestockModalItem(null)}
//             />
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.9, y: 20 }}
//               className="bg-[#0b0b0b] rounded-[2.5rem] p-10 max-w-lg w-full border border-indigo-500/20 relative z-10 shadow-2xl"
//             >
//               <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
//                 <div>
//                   <h2 className="text-3xl font-black text-white tracking-tighter">Restock Item</h2>
//                   <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">{restockModalItem.name}</p>
//                 </div>
//                 <button
//                   onClick={() => setRestockModalItem(null)}
//                   className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-red-500 transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>

//               <div className="mb-6 p-6 bg-[#0f172a] rounded-2xl border border-slate-800">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Stock</span>
//                   <span className="text-2xl font-black text-white">{restockModalItem.quantity}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</span>
//                   <span className="text-sm font-bold text-indigo-400">{restockModalItem.category}</span>
//                 </div>
//               </div>

//               <form onSubmit={handleRestock} className="space-y-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Quantity to Add</label>
//                   <input
//                     type="number"
//                     required
//                     min="1"
//                     className="w-full p-5 bg-[#0f172a] border border-slate-800 focus:border-indigo-500 rounded-2xl text-white outline-none font-medium transition-all text-2xl text-center"
//                     placeholder="0"
//                     value={restockQuantity || ''}
//                     onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
//                   />
//                   {restockQuantity > 0 && (
//                     <p className="text-center text-sm font-bold text-emerald-400">
//                       New Total: {restockModalItem.quantity + restockQuantity}
//                     </p>
//                   )}
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={isSubmitting || restockQuantity <= 0}
//                   className={`w-full py-5 font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${isSubmitting || restockQuantity <= 0
//                     ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
//                     : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.3)]'
//                     }`}
//                 >
//                   {isSubmitting ? 'Restocking...' : 'Confirm Restock'}
//                 </button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default ResourceInventory;










"use client";

import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, Activity, Box, ChevronLeft, ChevronRight, X, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface ResourceProps {
  resources?: any;
  isSimulating?: boolean;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  reorder_level: number;
  burn_rate: number;
  hours_remaining: number;
  status: "Normal" | "Warning" | "Critical";
}

const CircularProgress = ({ percentage, color }: { percentage: number, color: string }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
        <circle
          cx="32" cy="32" r={radius}
          stroke="currentColor" strokeWidth="4" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-spring-smooth`}
        />
      </svg>
      <span className={`absolute text-[10px] font-black ${color}`}>{Math.round(percentage)}%</span>
    </div>
  );
};

const Sparkline = ({ color }: { color: string }) => {
  return (
    <svg viewBox="0 0 100 30" className={`w-24 h-10 ${color} opacity-60`}>
      <path
        d="M0 25 Q 10 15, 20 25 T 40 10 T 60 20 T 80 5 T 100 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M0 25 Q 10 15, 20 25 T 40 10 T 60 20 T 80 5 T 100 15 V 30 H 0 Z" fill="currentColor" className="opacity-10" />
    </svg>
  )
}

const ResourceInventory: React.FC<ResourceProps> = () => {
  const { token, role } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    quantity: 0,
    reorder_level: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restockModalItem, setRestockModalItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/inventory/forecast');
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (e) { console.error("Failed to fetch inventory", e); }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ name: '', category: 'General', quantity: 0, reorder_level: 0 });
        fetchInventory();
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/inventory/restock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: restockModalItem.id,
          quantity_to_add: restockQuantity
        })
      });

      if (res.ok) {
        setRestockModalItem(null);
        setRestockQuantity(0);
        fetchInventory();
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    fetchInventory();
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'REFRESH_INVENTORY' || data.type === 'LOW_STOCK_ALERT') {
        fetchInventory();
      }
    };
    return () => ws.close();
  }, []);

  return (
    <>
      {/* VERTICAL TRIGGER TAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-[60] py-8 px-2 bg-card border-l border-y border-primary/30 rounded-l-2xl shadow-2xl flex flex-col items-center justify-center gap-4 hover:bg-muted transition-all cursor-pointer group"
          >
            <Package size={20} className="text-primary group-hover:scale-110 transition-transform animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Supply Node
            </span>
            <ChevronLeft size={16} className="text-muted-foreground group-hover:-translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* DRAWER BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* DRAWER CONTAINER */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="fixed top-0 right-0 h-screen w-1/2 min-w-[500px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
      >
        {/* HEADER */}
        <div className="p-8 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 text-primary shadow-sm">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Supply Node</h2>
              <p className="text-[10px] text-primary font-black tracking-widest uppercase opacity-70">Predictive Inventory Engine Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {role === 'Admin' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus size={14} /> Add Resource
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-background">
          {inventory.map((item) => {
            const isCritical = item.status === "Critical";
            const isWarning = item.status === "Warning";
            const isLow = isCritical || isWarning;
            const percentage = Math.min((item.quantity / (item.reorder_level * 3)) * 100, 100);

            let color = 'text-emerald-500';
            if (isCritical) color = 'text-rose-500';
            else if (isWarning) color = 'text-amber-500';

            return (
              <motion.div
                layout
                key={item.id}
                className={`group relative p-6 rounded-3xl border transition-all duration-500 bg-card 
                  ${isCritical ? 'border-rose-500/30' : isWarning ? 'border-amber-500/30' : 'border-border'}`}
              >
                {isLow && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className={`flex items-center gap-2 px-3 py-1 border rounded-lg animate-pulse ${isCritical ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'}`}>
                      <AlertTriangle size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {isCritical ? "Stockout Imminent" : "Reorder Advised"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <CircularProgress percentage={percentage} color={color} />
                  <div className="flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-1 text-foreground">{item.name}</h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">{item.category}</p>
                        <div className="flex items-baseline gap-1">
                          <p className={`text-3xl font-black ${color} tracking-tighter`}>{item.quantity}</p>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">/ {item.reorder_level * 3}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block pb-1">
                        <Sparkline color={isCritical ? 'text-rose-500' : (isWarning ? 'text-amber-500' : 'text-primary')} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className={isCritical ? "text-rose-500" : (isWarning ? "text-amber-500" : "text-muted-foreground")} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isCritical ? "text-rose-600 dark:text-rose-400" : (isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}`}>
                      {item.hours_remaining < 999 ? `Exhaustion: ${item.hours_remaining} hrs` : "Supply Stable"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${isCritical ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                      {item.burn_rate.toFixed(1)} Units / Hr
                    </div>
                    {role === 'Admin' && (
                      <button
                        onClick={() => { setRestockModalItem(item); setRestockQuantity(0); }}
                        className="text-[9px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                      >
                        Restock
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* MODAL SYSTEM (RESTRICTED TEXT LOGIC RESTORED) */}
      <AnimatePresence>
        {(isAddModalOpen || restockModalItem) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => { setIsAddModalOpen(false); setRestockModalItem(null); }} />
            
            {/* ADD MODAL */}
            {isAddModalOpen && (
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-card rounded-[3rem] p-10 max-w-xl w-full border border-border relative z-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Add Resource</h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Supply Node Provisioning</p>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-muted rounded-2xl text-muted-foreground hover:bg-rose-500 hover:text-white transition-all"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddResource} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Resource Identity</label>
                    <input required className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground font-bold outline-none" placeholder="e.g., Plasma Packs" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Stock</label>
                      <input type="number" required className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground font-bold outline-none" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Reorder Point</label>
                      <input type="number" required className="w-full p-5 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground font-bold outline-none" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-6 bg-primary text-primary-foreground font-black uppercase tracking-[0.4em] rounded-2xl transition-all shadow-xl shadow-primary/20">Execute Provision</button>
                </form>
              </motion.div>
            )}

            {/* RESTOCK MODAL */}
            {restockModalItem && (
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-card rounded-[3rem] p-10 max-w-lg w-full border border-border relative z-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Restock Node</h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{restockModalItem.name}</p>
                  </div>
                  <button onClick={() => setRestockModalItem(null)} className="p-3 bg-muted rounded-2xl text-muted-foreground hover:bg-rose-500 hover:text-white transition-all"><X size={20} /></button>
                </div>
                <div className="mb-6 p-6 bg-muted/50 rounded-2xl border border-border flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Current</p>
                    <p className="text-4xl font-black text-foreground">{restockModalItem.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">New Total</p>
                    <p className="text-4xl font-black text-emerald-500">{restockModalItem.quantity + restockQuantity}</p>
                  </div>
                </div>
                <form onSubmit={handleRestock} className="space-y-6">
                  <input type="number" required min="1" className="w-full p-6 bg-muted/40 border border-border focus:border-primary rounded-2xl text-foreground font-black text-3xl text-center outline-none" value={restockQuantity || ''} onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)} />
                  <button type="submit" className="w-full py-6 bg-emerald-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20">Commit Restock</button>
                </form>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResourceInventory;