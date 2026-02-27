"use client";

import React, { useState } from 'react';
import { useQunci } from '@/context/QunciContext';
import {
  Wallet,
  ArrowUpRight,
  QrCode,
  Send,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  MoreHorizontal,
  Bell,
  Lock,
  WifiOff,
  Store,
  ScanLine
} from 'lucide-react';

// --- Sub-Components for Cleanliness ---

const StatPill = ({ label, value, colorClass, icon: Icon }: { label: string, value: string | number, colorClass: string, icon?: React.ElementType }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass}`}>
    {Icon && <Icon size={14} />}
    <span>{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
);

const TransactionItem = ({ icon: Icon, color, merchant, date, amount, status, isHeld }: { icon: React.ElementType, color: string, merchant: string, date: string, amount: number, status: string, isHeld: boolean }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{merchant}</h4>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold ${isHeld ? 'text-red-500' : 'text-gray-900'}`}>
        - Rp {amount.toLocaleString('id-ID')}
      </p>
      {isHeld ? (
        <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center justify-center gap-1 w-fit ml-auto">
          <AlertCircle size={10} /> Held by AI
        </span>
      ) : (
        <p className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ml-auto ${status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
          {status}
        </p>
      )}
    </div>
  </div>
);

// --- Main Dashboard Component ---

export default function UserDashboard() {
  const { state, showToast, addOfflineTransaction, processQRISPayment } = useQunci();
  const [showOfflineCode, setShowOfflineCode] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [qrisAmount, setQrisAmount] = useState('50000');

  const isOffline = state.network === 'OFFLINE';
  const isLocked = state.walletLocked;

  const handlePayQRIS = () => {
    if (isLocked) return;
    if (isOffline) {
      showToast("QRIS is only available Online!", "error");
    } else {
      setIsScanningQR(true);
    }
  };

  const confirmQRISPayment = () => {
    const amountNum = parseInt(qrisAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setIsScanningQR(false);
    showToast("Processing QRIS payment securely...", "info");

    // Simulate slight network delay
    setTimeout(() => {
      processQRISPayment(amountNum);
    }, 1500);
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

  const handleTopUp = async () => {
    showToast("Opening PayLabs Top Up Gateway...", "info");
    try {
      const response = await fetch('/api/paylabs/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500000 }), // Default demo amount
      });

      const data = await response.json();

      if (data.url) {
        showToast("Redirecting to PayLabs Secure Checkout...", "success");
        // Redirect the user browser to the PayLabs HTML5 Cashier
        window.location.href = data.url;
      } else {
        showToast(data.error || "Failed to generate Top Up link", "error");
        console.error("Top-Up Error:", data);
      }
    } catch (err) {
      showToast("Network Error contacting Payment Gateway", "error");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Wallet className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-blue-900">QunciPay</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hi, Budi 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back to your financial hub.</p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-2">
            <StatPill
              label="OKE Score"
              value={`${state.okeScore} (Excellent)`}
              colorClass="bg-emerald-50 border-emerald-100 text-emerald-700"
            />
            <StatPill
              label="Points"
              value={`${state.points.toLocaleString('id-ID')}`}
              colorClass="bg-amber-50 border-amber-100 text-amber-700"
              icon={TrendingUp}
            />
            <StatPill
              label="Insurance"
              value="Active"
              colorClass="bg-blue-50 border-blue-100 text-blue-700"
              icon={ShieldCheck}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (Main Content) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Balance Card */}
            <div className={`relative overflow-hidden rounded-3xl text-white shadow-xl transition-all duration-500 ${isLocked ? 'bg-red-900 shadow-red-900/20' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-blue-900/20'}`}>

              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-400 opacity-10 blur-2xl pointer-events-none"></div>

              {isLocked && (
                <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-4 text-center">
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

              {/* QRIS Scanning Mock overlay */}
              {isScanningQR && !isLocked && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-30 p-6 text-center animate-in fade-in zoom-in duration-300">
                  <ScanLine size={48} className="text-emerald-400 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">Scan QRIS</h3>
                  <p className="text-slate-300 text-sm mb-6">Enter the amount to simulate a merchant scan:</p>

                  <div className="flex bg-white/10 rounded-xl overflow-hidden mb-6 border border-white/20 w-fit focus-within:border-emerald-400 transition-colors">
                    <span className="px-4 py-3 bg-white/5 text-slate-300 font-bold border-r border-white/10">Rp</span>
                    <input
                      type="number"
                      value={qrisAmount}
                      onChange={(e) => setQrisAmount(e.target.value)}
                      className="bg-transparent text-white font-bold text-xl px-4 py-3 outline-none w-32 placeholder:text-slate-500"
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 w-full max-w-[200px]">
                    <button
                      onClick={() => setIsScanningQR(false)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmQRISPayment}
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              )}

              <div className="relative p-8 z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-blue-200 text-sm font-medium">Total Balance</p>
                      {isOffline && (
                        <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/30 backdrop-blur-sm">
                          <WifiOff size={12} /> Offline Mode
                        </div>
                      )}
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">Rp {state.userBalance.toLocaleString('id-ID')}</h2>

                    {state.pendingBalance > 0 && (
                      <div className="text-sm font-medium text-amber-300 flex items-center gap-1.5 mt-2 bg-amber-900/30 w-fit px-3 py-1 rounded-lg border border-amber-500/20">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                        Pending Sync: -Rp {state.pendingBalance.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/10">
                    <Wallet className="text-white" size={24} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleTopUp} className="flex-1 bg-white text-blue-900 py-3 px-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                    <ArrowUpRight size={18} /> Top Up
                  </button>

                  {isOffline ? (
                    <button onClick={handleOfflinePay} className="flex-1 bg-amber-500 text-slate-900 py-3 px-4 rounded-xl font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20">
                      <QrCode size={18} /> Pay Offline Code
                    </button>
                  ) : (
                    <button onClick={handlePayQRIS} className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                      <ScanLine size={18} /> Pay QRIS
                    </button>
                  )}

                  <button className="flex-none bg-blue-800/50 text-white p-3 rounded-xl hover:bg-blue-800 transition-colors border border-white/10" title="Transfer">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Spending Insights */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Spending Insights</h3>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  AI: -20% vs last month
                </span>
              </div>

              {/* Mock Chart Area */}
              <div className="h-48 w-full relative flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <div key={i} className="w-full bg-blue-50 rounded-t-md relative group hover:bg-blue-100 transition-colors cursor-pointer" style={{ height: `${height}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Rp {height * 10}k
                    </div>
                  </div>
                ))}
                {/* Gradient Overlay to make it look like a curve */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Sidebar/Activity) */}
          <div className="space-y-6">

            {/* Recent Activity Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
              </div>

              <div className="divide-y divide-gray-50">
                {state.transactions.filter((t: { type: string }) => t.type === 'PAYMENT').length > 0 ? (
                  state.transactions.filter((t: { type: string }) => t.type === 'PAYMENT').map((tx: { id: string, status: string, merchant?: string, timestamp: string, amount: number }) => (
                    <TransactionItem
                      key={tx.id}
                      icon={tx.status === 'RISK_HOLD' ? Lock : Store}
                      color={tx.status === 'RISK_HOLD' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}
                      merchant={tx.merchant || "Unknown Merchant"}
                      date={tx.timestamp}
                      amount={tx.amount}
                      status={tx.status}
                      isHeld={tx.status === 'RISK_HOLD'}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No recent transactions.</div>
                )}
              </div>
            </div>

            {/* Quick Transfer / Contacts Placeholder */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold mb-4">Quick Transfer</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-transparent group-hover:border-blue-400 transition-all flex items-center justify-center text-gray-400 group-hover:text-white">
                      <span className="font-bold">U{i}</span>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-white">User {i}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 min-w-[60px] cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-gray-700/50 border border-dashed border-gray-500 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                    <MoreHorizontal size={20} />
                  </div>
                  <span className="text-xs text-gray-400">More</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}


