"use client";
import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    DollarSign, TrendingUp, Users, Activity,
    CreditCard, ShieldCheck, Clock, Search, Printer, ArrowUpRight
} from 'lucide-react';
import BillingSearch from '@/components/BillingSearch';
import { API_BASE_URL } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

export default function RevenueDashboard() {
    const { token } = useAuth();
    const [timeframe, setTimeframe] = useState("24h");
    const [ledgerSearch, setLedgerSearch] = useState("");
    const [ledgerPage, setLedgerPage] = useState(1);

    const authFetcher = async (url: string) => {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Systems Offline');
        return res.json();
    };

    const { data, error } = useSWR(
        token ? `${API_BASE_URL}/api/finance/revenue/analytics?timeframe=${timeframe}` : null,
        authFetcher,
        { refreshInterval: 10000 }
    );

    const { data: ledgerData } = useSWR(
        token ? `${API_BASE_URL}/api/finance/ledger?search=${ledgerSearch}&page=${ledgerPage}` : null,
        authFetcher,
        { refreshInterval: 5000 }
    );

    const handlePrint = (bill_no: string) => {
        const printUrl = `${API_BASE_URL}/api/finance/print/${bill_no}?token=${token}`;
        window.open(printUrl, '_blank');
    };

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-rose-500 font-bold italic tracking-widest uppercase animate-pulse">
                Critical System Error: Connection to Central Ledger Severed
            </p>
        </div>
    );

    const kpis = [
        { title: "Total Revenue", value: data?.kpi ? `₹${data.kpi.total_revenue.toLocaleString()}` : "...", growth: data?.kpi?.growth, icon: DollarSign, color: "text-cyan-500", glow: "shadow-cyan-500/20" },
        { title: "Pipeline Value", value: data?.kpi ? `₹${Math.round(data.kpi.potential_revenue).toLocaleString()}` : "...", sub: "Active Estimates", icon: TrendingUp, color: "text-purple-500", glow: "shadow-purple-500/20" },
        { title: "Tax (GST)", value: data?.kpi ? `₹${Math.round(data.kpi.total_tax).toLocaleString()}` : "...", sub: "Compliance Secure", icon: ShieldCheck, color: "text-amber-500", glow: "shadow-amber-500/20" },
        { title: "Avg / Patient", value: data?.kpi ? `₹${Math.round(data.kpi.arpp).toLocaleString()}` : "...", sub: `${Math.round(data?.kpi?.occupancy_rate || 0)}% Cap.`, icon: Users, color: "text-blue-500", glow: "shadow-blue-500/20" },
    ];

    const categoryData = data?.breakdown ? [
        { name: 'Hospitalization', value: data.breakdown.bed_revenue || 0 },
        { name: 'Surgical Units', value: data.breakdown.surgery_revenue || 0 },
        { name: 'Medical Supply', value: data.breakdown.pharmacy_revenue || 0 },
        { name: 'Consultations', value: data.breakdown.consultation_revenue || 0 },
    ].filter(v => v.value > 0) : [];

    const COLORS = ['#22d3ee', '#a855f7', '#f59e0b', '#3b82f6'];

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
            {/* Header */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <CreditCard className="text-primary" size={24} />
                        </div>
                        <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Financial Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight mb-2 italic uppercase">
                        REVENUE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 not-italic">COMMAND</span>
                    </h1>
                </motion.div>

                <div className="flex items-center gap-4 bg-muted/50 p-1.5 rounded-2xl border border-border backdrop-blur-xl">
                    {["24h", "7D", "1M", "1Y"].map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${timeframe === t ? 'bg-background text-primary shadow-lg shadow-black/10 translate-y-[-1px]' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>
                    ))}
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {kpis.map((k, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`p-6 bg-card border border-border rounded-3xl relative overflow-hidden shadow-2xl ${k.glow}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-5"><k.icon size={80} /></div>
                        <div className={`p-4 rounded-2xl bg-muted border border-border w-fit mb-6 ${k.color}`}><k.icon size={24} /></div>
                        <h3 className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-1">{k.title}</h3>
                        <p className="text-3xl font-black">{k.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                {/* Trajectory Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="xl:col-span-2 p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"><Activity className="text-primary" size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic leading-none mb-1">Fiscal Trajectory</h3>
                            <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Live-Sync Monitoring (IST)</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trend} margin={{ bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="10 10" stroke="currentColor" className="opacity-10" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    stroke="currentColor"
                                    className="opacity-40"
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 800 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={15}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        if (isNaN(date.getTime())) return str;
                                        // Adaptive X-Axis logic
                                        if (timeframe === "24h") {
                                            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                                        }
                                        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
                                    }}
                                />
                                <YAxis
                                    stroke="currentColor"
                                    className="opacity-40"
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 800 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                                    contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '16px' }}
                                    itemStyle={{ color: 'white', fontWeight: 900 }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={4} fill="url(#colorRev)" animationDuration={1000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pie Chart Section */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl flex flex-col items-center">
                    <h3 className="text-xl font-black uppercase italic mb-8 w-full text-left">Segment Distribution</h3>
                    <div className="h-[280px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={categoryData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={70} 
                                    outerRadius={100} 
                                    paddingAngle={8} 
                                    dataKey="value" 
                                    stroke="none"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '12px' }}
                                    itemStyle={{ color: 'white', fontWeight: 900 }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Total']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Pie Chart Index (Legend) */}
                    <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                <BillingSearch />

                {/* Ledger Section */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3 text-primary">
                            <Clock size={20} />
                            <h3 className="text-xl font-black uppercase italic text-foreground">Global Ledger</h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Search UID..."
                            value={ledgerSearch}
                            onChange={(e) => setLedgerSearch(e.target.value)}
                            className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs font-bold w-44 focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div className="space-y-4">
                        {ledgerData?.transactions?.map((bill: any) => (
                            <div key={bill.bill_no} className="p-4 bg-muted/30 border border-border rounded-2xl flex justify-between items-center group hover:border-primary/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase">{bill.patient_name}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground">{bill.bill_no}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-black text-primary italic">₹{bill.amount.toLocaleString()}</p>
                                    <button 
                                        onClick={() => handlePrint(bill.bill_no)} 
                                        className="p-2 bg-background border border-border rounded-lg text-muted-foreground hover:text-primary transition-colors shadow-sm"
                                    >
                                        <Printer size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}