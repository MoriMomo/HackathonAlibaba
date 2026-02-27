"use client";
import { useQunci } from '@/context/QunciContext';
import { DollarSign, Download, AlertTriangle, QrCode, TrendingUp, Users, Crown, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const MOCK_ANALYTICS = [
  { time: '08:00', sales: 120000 },
  { time: '12:00', sales: 450000 },
  { time: '16:00', sales: 300000 },
  { time: '20:00', sales: 850000 },
];

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

    // DUMMY DATA explicitly for testing the PayLabs SIT environment. 
    // In Production this would come from a Merchant Bank Settings Form.
    const dummyBankCode = "BCA";
    const dummyAccountNo = "1234567890";
    const dummyAccountName = "Budi Santoso";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Warung Bu Siti Dashboard</h2>
        <button onClick={() => setShowQR(true)} className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 flex items-center gap-2 transition-transform active:scale-95">
          <QrCode size={18} /> Generate Merchant QR
        </button>
      </div>

      {showQR && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-4">

          {!qrisUrl ? (
            <div className="w-full max-w-sm flex flex-col items-center">
              <h3 className="font-bold text-lg mb-4">Create dynamic QRIS</h3>
              <div className="w-full mb-4">
                <label className="text-xs text-slate-400 mb-1 block">Nominal (Rp)</label>
                <input
                  type="number"
                  value={qrisAmount}
                  onChange={(e) => setQrisAmount(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 50000"
                />
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Code"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrisUrl} alt="QRIS Code" className="w-[200px] h-[200px] object-cover" />
              </div>
              <h3 className="font-bold text-lg text-emerald-400">Scan to Pay</h3>
              <p className="text-white font-black text-2xl mt-1 mb-4">Rp {Number(qrisAmount).toLocaleString('id-ID')}</p>
            </div>
          )}

          <button onClick={closeQRModal} className="text-slate-400 hover:text-white text-sm mt-4">Close / Cancel</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-500 text-sm font-medium">Total Sales (Today)</p>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">Rp 1.250.000</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-500 text-sm font-medium">Pending Settlement</p>
          <p className="text-3xl font-black text-amber-500 mt-2 tracking-tight">Rp 150.000</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit font-medium">
            <AlertTriangle size={12} /> Automatically sent at 23:59
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <p className="text-emerald-800 text-sm font-bold">Available for Cash Out</p>
          <p className="text-3xl font-black text-emerald-600 mt-1 tracking-tight">Rp {state.merchantBalance.toLocaleString('id-ID')}</p>
          <button onClick={handleCashOut} className="mt-4 w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 relative z-10">
            <Download size={16} /> Cairkan via PayLabs
          </button>
          <p className="text-[10px] text-emerald-700/60 mt-2 text-center font-medium relative z-10">MDR Fee: 1.5% applied automatically</p>
        </div>
      </div>

      {/* Premium AI Analytics SaaS Block */}
      <div className="bg-slate-900 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
        <div className="bg-slate-900 rounded-[22px] p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Crown className="text-amber-400" size={20} /> Premium AI Analytics
              </h3>
              <p className="text-slate-400 text-sm mt-1">Unlock deeper insights with Qunci AI. <span className="text-blue-400 font-medium cursor-pointer hover:underline">Subscribe for $5/mo</span></p>
            </div>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 border border-white/5">
              View Full Report <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_ANALYTICS}>
                  <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-emerald-400 mb-1">
                  <TrendingUp size={16} /> <span className="font-bold text-sm">Peak Hours Predictor</span>
                </div>
                <p className="text-slate-300 text-xs">AI predicts highest traffic today between 19:00 - 21:00 based on local events.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-blue-400 mb-1">
                  <Users size={16} /> <span className="font-bold text-sm">Customer Retention</span>
                </div>
                <p className="text-slate-300 text-xs">42% of buyers today are returning customers. Send a loyalty promo to boost sales!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Queue */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Live Transaction Queue</h3>
          <span className="text-xs text-slate-500">Real-time Sync</span>
        </div>
        <div className="divide-y divide-slate-100">
          {state.transactions.map((tx: { id: string; status: string; timestamp: string; merchant?: string; amount: number; }) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                  tx.status === 'RISK_HOLD' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                  {tx.status === 'RISK_HOLD' ? <AlertTriangle size={20} /> : <DollarSign size={20} />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">Transaction #{tx.id}</p>
                  <p className="text-xs text-slate-500">{tx.timestamp} • {tx.merchant}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">Rp {tx.amount.toLocaleString('id-ID')}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  tx.status === 'RISK_HOLD' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                  {tx.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
