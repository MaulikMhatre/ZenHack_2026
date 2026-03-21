"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Printer, CheckCircle, AlertCircle, Receipt, Download, Activity } from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

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
    items?: BillItem[]; // For Final
    // Estimate fields
    bed_days?: number;
    bed_charge?: number;
    surgery_charge?: number;
    resource_charge?: number;
    consultation_charge?: number;
    tax?: number;
    total?: number;
}

import { useAuth } from '@/context/AuthContext';

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

    return (
        <div className="w-full bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl overflow-hidden relative group">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                    <Receipt className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight">LEDGER <span className="text-cyan-400 not-italic">RETRIEVAL</span></h2>
                    <p className="text-xs font-bold text-slate-500 tracking-wider">SC-COMPLIANT FISCAL AUDIT</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 relative z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="AUTHENTICATION TOKEN / ADM-UID"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-sm tracking-wider"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-cyan-900/40 disabled:opacity-50 active:scale-95 uppercase text-xs tracking-widest"
                >
                    {loading ? "Decrypting..." : "Access Record"}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-300 text-sm font-bold"
                    >
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </motion.div>
                )}

                {bill && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="overflow-hidden"
                    >
                        {/* Bill Display Card */}
                        <div className="bg-white text-slate-900 p-12 rounded-none shadow-none relative printable-area min-h-[29.7cm] flex flex-col">
                            {/* Watermark/Logo Background for Digital View */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 opacity-[0.02] pointer-events-none no-print">
                                <FileText className="w-96 h-96" />
                            </div>

                            {/* PROFESSIONAL HEADER */}
                            <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                        <Activity size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none mb-1">PHRELIS MULTISPECIALTY</h1>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Medical Excellence & Digital Hub</p>
                                    </div>
                                </div>
                                <div className="text-right text-[10px] font-bold text-slate-600 uppercase leading-relaxed">
                                    <p>Plot 42, Health City, Sector 18</p>
                                    <p>New Delhi, Delhi 110025</p>
                                    <p>GSTIN: 07AABCP1234F1Z5</p>
                                    <p>Contact: +91 11 4567 8900</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 italic mb-2">TAX INVOICE</h2>
                                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Invoice: <span className="text-slate-900">{bill.bill_no || "DRAFT-EST"}</span></span>
                                        <span>•</span>
                                        <span>Date: <span className="text-slate-900">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                                    </div>
                                </div>
                                {bill.status === "ESTIMATE" && (
                                    <div className="px-4 py-2 bg-amber-100 text-amber-800 text-[10px] font-black tracking-[0.2em] rounded-lg border border-amber-200 no-print">
                                        NOT A FINAL BILL
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-12 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Patient Information</p>
                                    <p className="font-black text-2xl text-slate-900 leading-none mb-2">{bill.patient_name}</p>
                                    <p className="text-xs font-mono font-bold text-slate-600">UID: {bill.admission_uid}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Billing Reference</p>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
                                        Type: {bill.status === "ESTIMATE" ? "Pre-Settlement" : "Final Settlement"}<br />
                                        Facility: Hub Delta-1 / Ward 4B<br />
                                        Auth: SYS-ADMIN-PROX
                                    </p>
                                </div>
                            </div>

                            <div className="mb-10 overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4 rounded-l-xl">Description of Service/Resource</th>
                                            <th className="p-4 text-center">Qty</th>
                                            <th className="p-4 text-right">GST %</th>
                                            <th className="p-4 text-right rounded-r-xl font-mono">Total (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic">
                                        {/* ALL BILLABLE ITEMS (Detailed from API) */}
                                        {bill.items?.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                <td className="p-4 font-black text-slate-800 text-sm">
                                                    <div className="flex flex-col">
                                                        <span>{item.description}</span>
                                                        {item.tax_amount > 0 && <span className="text-[9px] text-slate-400 font-bold tracking-tight">CGST/SGST Included</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-500">{item.quantity}</td>
                                                <td className="p-4 text-right font-bold text-slate-500">{item.tax_percent}%</td>
                                                <td className="p-4 text-right font-black text-slate-900 italic">₹{(item.total_price).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end">
                                <div className="w-80 bg-slate-100 p-8 rounded-3xl border border-slate-200">
                                    <div className="flex justify-between mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Net Value</span>
                                        <span>₹{((bill.total || bill.grand_total || 0) - (bill.tax || bill.tax_amount || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Tax Aggregate</span>
                                        <span>₹{(bill.tax || bill.tax_amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-300 mt-4 pt-4 flex justify-between font-black text-2xl text-cyan-700 italic">
                                        <span className="text-slate-900 not-italic">TOTAL</span>
                                        <span>₹{(bill.total || bill.grand_total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-12 border-t border-slate-200">
                                <div className="grid grid-cols-2 gap-20">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                                        <p className="text-slate-900 mb-2">Terms & Conditions:</p>
                                        <p>1. This is a computer-generated invoice and does not require a physical signature for digital validation.</p>
                                        <p>2. Please check all details carefully. Any discrepancies must be reported within 24 hours.</p>
                                        <p>3. All disputes are subject to New Delhi Jurisdictions only.</p>
                                    </div>
                                    <div className="flex flex-col items-end justify-end">
                                        <div className="w-48 border-b-2 border-slate-900 mb-2" />
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Signatory</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Phrelis Financial Operations</p>
                                    </div>
                                </div>
                                <div className="mt-8 text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
                                    SECURE-HASH: {bill.admission_uid}-{(bill.grand_total || 0).toFixed(0)}-INV
                                </div>
                            </div>
                        </div>

                        {/* Actions Overlay */}
                        <div className="mt-4 no-print">
                            <button
                                onClick={() => window.print()}
                                className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-3xl transition-all uppercase text-[12px] tracking-[0.3em] shadow-2xl shadow-slate-900/40 relative overflow-hidden group"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <Printer className="w-5 h-5 group-hover:animate-bounce" />
                                PRINT OFFICIAL BILL (DETAILED)
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
