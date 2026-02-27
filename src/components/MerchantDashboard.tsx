"use client";
import React, { useState } from 'react';
import { useQunci } from '@/context/QunciContext';
import {
  Wallet,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  QrCode,
  ShieldAlert,
  ArrowUpRight,
  BarChart3,
  Users,
  MoreHorizontal,
} from 'lucide-react';

// --- Types ---
interface StatCardProps {
  title: string;
  value: string;
  subtext?: React.ReactNode;
  icon: React.ElementType;
  color: string;
  highlight?: boolean;
}

interface TxData {
  id: string;
  merchant?: string;
  amount: number | string;
  date?: string;
  timestamp?: string;
  status: string;
}

// --- Components ---

const StatCard = ({ title, value, subtext, icon: Icon, color, highlight = false }: StatCardProps) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 border ${highlight ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-md shadow-emerald-100/50' : 'bg-white border-gray-100 shadow-sm'}`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    {subtext && (
      <div className="flex items-center gap-2 text-xs">
        {subtext}
      </div>
    )}
  </div>
);

const TransactionRow = ({ tx }: { tx: TxData }) => {
  const isRisk = tx.status === 'RISK_HOLD';
  const isPending = !!(tx.status === 'PENDING' || tx.status === 'PENDING_SYNC');

  // Format amount safely depending on if it's arriving as number (from Context) or string (from dummy prop)
  const displayAmount = typeof tx.amount === 'number' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : tx.amount;
  const displayDate = tx.timestamp || tx.date || '';

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isRisk ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50 hover:border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-full ${isRisk ? 'bg-red-100 text-red-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isRisk ? <ShieldAlert size={20} /> : isPending ? <Clock size={20} /> : <CheckCircle size={20} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">{tx.merchant || 'QunciPay User'}</h4>
            {isRisk && (
              <span className="px-2 py-0.5 bg-red-200 text-red-700 text-[10px] font-bold uppercase rounded-full">
                Risk Hold
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{displayDate} • {tx.id}</p>
          {isRisk && (
            <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> Unusual activity detected
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${isRisk ? 'text-red-700' : 'text-gray-900'}`}>
          {displayAmount}
        </p>
        <div className="mt-1">
          {isRisk ? (
            <button className="text-xs font-semibold text-red-600 hover:text-red-700 underline">
              Resolve Issue
            </button>
          ) : (
            <span className={`text-[10px] uppercase font-bold ${isPending ? 'text-amber-600' : 'text-emerald-600'}`}>
              {tx.status === 'COMPLETED' ? 'Settled' : tx.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MerchantDashboard() {
  const { state, showToast, cashOutMerchant, generateMerchantQR } = useQunci();
  const [showQR, setShowQR] = useState(false);
  const [qrisAmount, setQrisAmount] = useState('');
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCashOut = async () => {
    if (state.merchantBalance <= 0) {
      showToast("No balance to cash out.", "error");
      return;
    }
    showToast("Requesting Settlement via PayLabs...", "info");

    const dummyBankCode = "BCA";
    const dummyAccountNo = "1234567890";
    const dummyAccountName = "Warung Bu Siti";

    const success = await cashOutMerchant(state.merchantBalance, dummyBankCode, dummyAccountNo, dummyAccountName);

    if (success) {
      showToast("Settlement Successful! Funds transferred to designated bank.", "success");
    } else {
      showToast("Settlement encountered an error. Check logs.", "error");
    }
  };

  const handleGenerateQR = async () => {
    const amount = Number(qrisAmount);
    if (amount < 1000) {
      showToast("Minimum QRIS amount is Rp 1.000", "error");
      return;
    }
    setIsGenerating(true);
    showToast("Generating QRIS via PayLabs...", "info");

    const url = await generateMerchantQR(amount);
    if (url) {
      setQrisUrl(url);
    } else {
      showToast("Failed to generate QRIS", "error");
    }
    setIsGenerating(false);
  };

  const closeQRModal = () => {
    setShowQR(false);
    setQrisUrl(null);
    setQrisAmount('');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-12">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900 leading-tight">Warung Bu Siti</h1>
                <p className="text-xs text-gray-500">Merchant ID: #WRG-8821</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQR(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                <QrCode size={18} />
                Generate QR
              </button>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                BS
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* QR Code Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-slate-200">
            {!qrisUrl ? (
              <div className="w-full flex flex-col items-center">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-4">
                  <QrCode size={32} />
                </div>
                <h3 className="font-bold text-xl mb-1 text-slate-900">Create Dynamic QRIS</h3>
                <p className="text-slate-500 text-sm mb-6 text-center">Enter the nominal amount to generate a unique PayLabs payment code.</p>

                <div className="w-full mb-6">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">Nominal (Rp)</label>
                  <div className="flex border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <span className="bg-slate-50 px-4 py-3 text-slate-500 font-bold border-r border-slate-300">Rp</span>
                    <input
                      type="number"
                      value={qrisAmount}
                      onChange={(e) => setQrisAmount(e.target.value)}
                      className="w-full px-4 py-3 text-slate-900 font-bold outline-none"
                      placeholder="e.g. 50000"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button onClick={closeQRModal} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateQR}
                    disabled={isGenerating || !qrisAmount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {isGenerating ? "Processing..." : "Generate"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <h3 className="font-bold text-xl text-slate-900 mb-1">Scan to Pay</h3>
                <p className="text-slate-500 text-sm mb-6">Powered by PayLabs QRIS</p>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 w-full flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrisUrl} alt="QRIS Code" className="w-[240px] h-[240px] object-cover rounded-lg" />
                </div>

                <div className="bg-emerald-50 text-emerald-700 w-full py-3 rounded-xl text-center mb-6">
                  <p className="text-sm font-medium">Total Payment:</p>
                  <p className="font-black text-2xl tracking-tight">Rp {Number(qrisAmount).toLocaleString('id-ID')}</p>
                </div>

                <button onClick={closeQRModal} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors">
                  Close Terminal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Sales (Today)"
            value="Rp 1.250.000"
            color="bg-blue-500"
            icon={TrendingUp}
            subtext={<span className="text-emerald-600 font-medium flex items-center gap-1"><TrendingUp size={12} /> +12% vs yesterday</span>}
          />

          <StatCard
            title="Pending Settlement"
            value="Rp 150.000"
            color="bg-amber-500"
            icon={Clock}
            subtext={<span className="text-amber-600 font-medium flex items-center gap-1"><AlertTriangle size={12} /> Auto-settles at 23:59</span>}
          />

          <StatCard
            title="Available for Cash Out"
            value={`Rp ${state.merchantBalance.toLocaleString('id-ID')}`}
            color="bg-emerald-500"
            icon={Wallet}
            highlight={true}
            subtext={
              <button onClick={handleCashOut} className="w-full mt-3 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                <ArrowUpRight size={16} /> Cairkan via PayLabs
              </button>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Analytics & Queue */}
          <div className="lg:col-span-2 space-y-8">

            {/* AI Analytics - Redesigned to be lighter and more integrated */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Qunci AI Insights</h3>
                    <p className="text-xs text-gray-500">Premium Analytics • <span className="text-indigo-600 cursor-pointer hover:underline">Upgrade for $5/mo</span></p>
                  </div>
                </div>
                <button className="text-sm text-gray-600 font-medium hover:text-gray-900">View Full Report</button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Chart Placeholder */}
                <div className="h-40 bg-gray-50 rounded-xl border border-gray-100 relative flex items-end justify-between px-4 pb-2">
                  {/* Simple CSS Bars */}
                  {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                    <div key={i} className="w-3 bg-indigo-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                  ))}
                  <div className="absolute top-2 right-2 text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                    Peak: 19:00
                  </div>
                </div>

                {/* Insights List */}
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <Users className="text-indigo-600 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-sm font-bold text-indigo-900">Customer Retention</h4>
                        <p className="text-xs text-indigo-700 mt-1">42% of buyers today are returning customers.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="text-emerald-600 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">Sales Prediction</h4>
                        <p className="text-xs text-emerald-700 mt-1">Expect 20% higher traffic tonight due to local event.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Queue */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Live Transaction Queue</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Real-time Sync
                </div>
              </div>

              <div className="space-y-3">
                {state.transactions.length > 0 ? (
                  state.transactions.map((tx: TxData) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-100">
                    No transactions yet. Generate a QR code to receive payments!
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Quick Actions & Settings */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowQR(true)} className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group">
                  <QrCode className="text-gray-400 group-hover:text-blue-600" size={24} />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">Show QR</span>
                </button>
                <button className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group">
                  <Download className="text-gray-400 group-hover:text-blue-600" size={24} />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">Export CSV</span>
                </button>
                <button className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group">
                  <Users className="text-gray-400 group-hover:text-blue-600" size={24} />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">Customers</span>
                </button>
                <button className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group">
                  <MoreHorizontal className="text-gray-400 group-hover:text-blue-600" size={24} />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">More</span>
                </button>
              </div>
            </div>

            {/* PayLabs Status */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Wallet size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">PayLabs Connected</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Auto-Settlement</h3>
                <p className="text-sm text-blue-200 mb-4">Your pending funds will be automatically transferred to your BCA account ending in 8821 tonight.</p>
                <button onClick={handleCashOut} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Change Bank Account
                </button>
              </div>
              {/* Decor */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
