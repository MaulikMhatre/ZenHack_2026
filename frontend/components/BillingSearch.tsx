"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Printer, AlertCircle, Receipt, Activity, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface BillItem {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    tax_percent: number;
    tax_amount: number;
}

interface BillData {
    status: "ESTIMATE" | "FINAL";
    admission_uid: string;
    patient_name: string;
    bill_no?: string;
    grand_total: number;
    tax_amount: number;
    items?: BillItem[];
}

export default function BillingSearch() {
    const { token } = useAuth();
    const [uid, setUid] = useState('');
    const [bill, setBill] = useState<BillData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        const trimmedUid = uid.trim();
        if (!trimmedUid) return;
        setLoading(true);
        setError('');
        setBill(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/finance/bill/${trimmedUid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 404) throw new Error("Admission UID not found");
                throw new Error("Internal Ledger Access Error");
            }
            const data = await res.json();
            setBill(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // CALLS THE BACKEND AUTOMATED PDF ENGINE
    const handleOfficialPrint = () => {
        if (!bill) return;
        const identifier = bill.bill_no || uid.trim();
        const printUrl = `${API_BASE_URL}/api/finance/print/${identifier}?token=${token}`;
        window.open(printUrl, '_blank');
    };

    return (
        <div className="w-full bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl overflow-hidden relative group">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                    <Receipt className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Ledger <span className="text-cyan-400 not-italic">Retrieval</span></h2>
                    <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">SC-Compliant Fiscal Audit</p>
                </div>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10 relative z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="AUTHENTICATION TOKEN / ADM-UID"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-12 pr-4 py-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-sm tracking-wider"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-cyan-900/40 disabled:opacity-50 uppercase text-xs tracking-widest flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Access Record"}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-300 text-sm font-bold"
                    >
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </motion.div>
                )}

                {bill && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                        {/* --- THE BILL VIEW (Matches image_9701ad.png) --- */}
                        <div className="bg-white text-slate-900 p-10 rounded-3xl relative flex flex-col shadow-inner">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none mb-1 uppercase">PHRELIS MULTISPECIALTY</h1>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Medical Excellence & Digital Hub</p>
                                    </div>
                                </div>
                                <div className="text-right text-[8px] font-bold text-slate-600 uppercase leading-tight">
                                    <p>Plot 42, Health City, Sector 18, New Delhi</p>
                                    <p>GSTIN: 07AABCP1234F1Z5</p>
                                    <p>Contact: +91 11 4567 8900</p>
                                </div>
                            </div>

                            {/* Title Section */}
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic mb-1 uppercase">Tax Invoice</h2>
                                    <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Invoice: <span className="text-slate-900">{bill.bill_no || "DRAFT-EST"}</span></span>
                                        <span>•</span>
                                        <span>Date: <span className="text-slate-900">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</span></span>
                                    </div>
                                </div>
                                <div className={`px-4 py-1.5 text-[9px] font-black tracking-[0.1em] rounded-md border ${bill.status === 'ESTIMATE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-900 text-white'}`}>
                                    {bill.status === "ESTIMATE" ? "PRE-SETTLEMENT DRAFT" : "FINAL SETTLEMENT"}
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="grid grid-cols-2 gap-8 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">Patient Information</p>
                                    <p className="font-black text-xl text-slate-900 leading-none mb-1 uppercase">{bill.patient_name}</p>
                                    <p className="text-[10px] font-mono font-bold text-slate-600 uppercase">UID: {bill.admission_uid}</p>
                                </div>
                                <div className="text-right text-[8px] font-bold text-slate-700 leading-relaxed uppercase">
                                    <p className="text-slate-400 mb-3 border-b border-slate-200 pb-1">Billing Reference</p>
                                    <p>Facility: Hub Delta-1 / Ward 4B</p>
                                    <p>Auth: SYS-ADMIN-PROX</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-left text-[10px] mb-8">
                                <thead className="bg-slate-900 text-white font-black uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Description of Service/Resource</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-center">GST %</th>
                                        <th className="p-3 text-right rounded-r-lg">Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="italic">
                                    {bill.items?.map((item, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="p-3 font-black text-slate-800 uppercase">{item.description}</td>
                                            <td className="p-3 text-center font-bold text-slate-500">{item.quantity}</td>
                                            <td className="p-3 text-center font-bold text-slate-500">{item.tax_percent}%</td>
                                            <td className="p-3 text-right font-black text-slate-900 italic">₹{item.total_price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary Card (Matches image_97018b.png) */}
                            <div className="flex justify-end">
                                <div className="w-72 bg-[#f1f5f9] p-6 rounded-[2rem] border border-slate-200">
                                    <div className="flex justify-between mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>Net Value</span>
                                        <span className="text-slate-900">₹{(bill.grand_total - bill.tax_amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between mb-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>Tax Aggregate</span>
                                        <span className="text-slate-900">₹{bill.tax_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-300 mt-3 pt-3 flex justify-between font-black text-2xl italic">
                                        <span className="text-slate-900 not-italic">TOTAL</span>
                                        <span className="text-[#0891b2]">₹{bill.grand_total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
                                <div className="text-[7px] font-bold text-slate-400 uppercase leading-relaxed max-w-[250px]">
                                    <p className="text-slate-900 mb-1">Terms & Conditions:</p>
                                    <p>1. Computer-generated invoice. No physical signature required.</p>
                                    <p>2. Discrepancies must be reported within 24 hours.</p>
                                    <p>3. All disputes subject to New Delhi Jurisdictions only.</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-28 border-b-2 border-slate-900 mb-1 mx-auto" />
                                    <p className="text-[8px] font-black text-slate-900 uppercase">Authorized Signatory</p>
                                    <p className="text-[7px] font-bold text-slate-400 uppercase">Phrelis Financial Operations</p>
                                </div>
                            </div>
                        </div>

                        {/* FINAL PRINT BUTTON */}
                        <div className="mt-6">
                            <button
                                onClick={handleOfficialPrint}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#0f172a] hover:bg-slate-800 text-white font-black rounded-2xl transition-all uppercase text-[11px] tracking-[0.2em] shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <Printer className="w-4 h-4 text-cyan-400" />
                                Print Official Bill (Detailed)
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}