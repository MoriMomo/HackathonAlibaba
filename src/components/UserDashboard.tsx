"use client";
import { useQunci } from '@/context/QunciContext';
import { useState } from 'react';
import { ScanLine, ArrowUpRight, Lock, WifiOff, Store, ShieldCheck, QrCode } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_CHART_DATA = [
  { name: 'Week 1', spend: 400000 },
  { name: 'Week 2', spend: 300000 },
  { name: 'Week 3', spend: 550000 },
  { name: 'Week 4', spend: 200000 },
];

export default function UserDashboard() {
  const { state, showToast, topUpUser, addOfflineTransaction } = useQunci();
  const [showOfflineCode, setShowOfflineCode] = useState(false);
  const isOffline = state.network === 'OFFLINE';
  const isLocked = state.walletLocked;

  const handlePayQRIS = () => {
    if (isLocked) return;
    if (isOffline) {
      showToast("QRIS is only available Online!", "error");
    } else {
      showToast("QRIS Payment Successful. Protected by Qunci Shield.", "success");
    }
  };

  const handleOfflinePay = () => {
    if (isLocked) return;
    setShowOfflineCode(true);
    // Simulate merchant scanning it after 3 seconds
    setTimeout(() => {
      addOfflineTransaction(50000, "Offline Merchant");
      setShowOfflineCode(false);
      showToast("Offline Payment Created. Will sync when online.", "info");
    }, 3000);
  };

  const handleTopUp = () => {
    showToast("Opening PayLabs Top Up Gateway...", "info");
    setTimeout(() => {
      topUpUser(500000);
      showToast("Top Up Rp 500.000 via PayLabs Successful!", "success");
    }, 1500)
  };

  return (
    <div className="max-w-md mx-auto space-y-6">

      {/* Header Profile */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hi, Budi 👋</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">
              OKE Score: {state.okeScore} (Excellent)
            </div>
            <div className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-bold border border-orange-200 flex items-center gap-1">
              ⭐ {state.points} Pts
            </div>
          </div>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1.5 shadow-sm">
          <ShieldCheck size={14} className="text-blue-600" /> Asuransi: Dilindungi
        </div>
      </div>

      {/* Wallet Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl transition-all duration-500 ${isLocked ? 'bg-red-900' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900'}`}>

        {/* Glassmorphism decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        {isLocked && (
          <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-4 text-center">
            <Lock size={48} className="mb-4 text-red-200 animate-pulse" />
            <h3 className="text-2xl font-black tracking-tight">Wallet Locked</h3>
            <p className="text-red-200 text-sm mt-2 font-medium max-w-[250px]">Verification required. Suspicious activity detected by Qunci Engine.</p>
          </div>
        )}

        {showOfflineCode && !isLocked && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-20 p-4 text-center">
            <QrCode size={64} className="mb-4 text-white animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Show to Merchant</h3>
            <p className="text-slate-300 text-sm font-mono bg-white/10 px-4 py-2 rounded-lg tracking-widest">QNC-882-910-OFF</p>
            <p className="text-xs text-slate-400 mt-4">Waiting for merchant scan...</p>
          </div>
        )}

        <div className="flex justify-between items-start mb-6 relative z-10">
          <span className="text-blue-100 text-sm font-medium tracking-wide">QunciPay Balance</span>
          {isOffline && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/30 backdrop-blur-sm">
              <WifiOff size={12} /> Offline Mode
            </div>
          )}
        </div>

        <div className="text-4xl font-black mb-1 relative z-10 tracking-tight">
          Rp {state.userBalance.toLocaleString('id-ID')}
        </div>

        {state.pendingBalance > 0 && (
          <div className="text-sm font-medium text-amber-300 flex items-center gap-1.5 mt-2 relative z-10 bg-amber-900/30 w-fit px-3 py-1 rounded-lg border border-amber-500/20">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            Pending Sync: -Rp {state.pendingBalance.toLocaleString('id-ID')}
          </div>
        )}

        {/* Primary Actions */}
        <div className="mt-8 flex gap-3 relative z-10">
          <button onClick={handleTopUp} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-white/10">
            <ArrowUpRight size={18} /> Top Up
          </button>

          {isOffline ? (
            <button
              onClick={handleOfflinePay}
              className="flex-[1.5] bg-amber-500 hover:bg-amber-400 text-slate-900 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
            >
              <QrCode size={18} /> Pay Offline Code
            </button>
          ) : (
            <button
              onClick={handlePayQRIS}
              className="flex-[1.5] bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
            >
              <ScanLine size={18} /> Pay QRIS
            </button>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Spending Insights</h3>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium">AI: -20% vs last month</span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <Tooltip />
              <Area type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* Recent Transactions */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 px-1">Recent Activity</h3>
        {state.transactions.filter((t: { type: string }) => t.type === 'PAYMENT').map((tx: { id: string; status: string; timestamp: string; merchant?: string; amount: number; }) => (
          <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'RISK_HOLD' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                {tx.status === 'RISK_HOLD' ? <Lock size={18} /> : <Store size={18} />}
              </div>
              <div>
                <p className="font-medium text-slate-900">{tx.merchant}</p>
                <p className="text-xs text-slate-500">{tx.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">- Rp {tx.amount.toLocaleString('id-ID')}</p>
              <p className={`text-xs font-medium ${tx.status === 'COMPLETED' ? 'text-emerald-600' :
                tx.status === 'RISK_HOLD' ? 'text-red-600' : 'text-amber-600'
                }`}>
                {tx.status === 'RISK_HOLD' ? 'Held by AI' : tx.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


