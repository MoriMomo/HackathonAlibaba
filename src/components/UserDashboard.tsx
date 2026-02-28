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
  ShieldAlert,
  Lock,
  Wifi,
  WifiOff,
  Store,
  ScanLine,
  Clock,
  X
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
  const { state, showToast, addOfflineTransaction, processQRISPayment, processTransfer, toggleNetwork, transferToOffline, transferToOnline } = useQunci();
  const [showOfflineCode, setShowOfflineCode] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [qrisAmount, setQrisAmount] = useState('50000');
  const qrInputRef = React.useRef<HTMLInputElement>(null);

  const [isTransferring, setIsTransferring] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [vaultTransferAmount, setVaultTransferAmount] = useState('');
  const [transferMerchantId, setTransferMerchantId] = useState('');
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const transferInputRef = React.useRef<HTMLInputElement>(null);

  const quickTransferUsers = [
    { id: 'USR-881', name: 'Budi', initial: 'B' },
    { id: 'MER-992', name: 'Siti', initial: 'S' },
    { id: 'USR-443', name: 'Agus', initial: 'A' },
    { id: 'USR-224', name: 'Rina', initial: 'R' }
  ];

  const handleQuickTransfer = (userId: string) => {
    setTransferMerchantId(userId);
    setIsTransferring(true);
  };

  // Dynamic Insights calculation based on actual transaction history
  const spendingData = React.useMemo(() => {
    const baseHeights = [40, 65, 45, 80, 55, 60, 20]; // Baseline weekly graph

    // Calculate total recent spending to animate the "Today" bar
    const txTotal = state.transactions
      .filter((t: { type?: string }) => t.type === 'PAYMENT')
      .reduce((sum: number, t: { amount?: number }) => sum + (t.amount || 0), 0);

    // Every 10k spent adds height to the 'Today' (Sun) column up to 100% max
    const addedSpend = Math.min(Math.floor(txTotal / 10000), 80);
    baseHeights[6] = Math.min(baseHeights[6] + addedSpend, 100);

    return baseHeights;
  }, [state.transactions]);

  // Auto-focus input when QR modal opens
  React.useEffect(() => {
    if (isScanningQR && qrInputRef.current) {
      qrInputRef.current.focus();
      qrInputRef.current.select();
    }
  }, [isScanningQR]);

  // Auto-focus input when Transfer modal opens
  React.useEffect(() => {
    if (isTransferring && transferInputRef.current) {
      transferInputRef.current.focus();
    }
  }, [isTransferring]);

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

  const confirmTransfer = () => {
    const amountNum = parseInt(transferAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (!transferMerchantId.trim()) {
      showToast("Please enter a Merchant ID", "error");
      return;
    }

    setIsTransferring(false);

    // Pass it to context to handle balance deduction and simulated network delay
    processTransfer(amountNum, transferMerchantId);
    setTransferAmount('');
    setTransferMerchantId('');
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
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative" title="Notifications" aria-label="View notifications">
                <Bell size={20} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
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
            <div className={`relative overflow-hidden rounded-3xl text-white shadow-xl transition-all duration-500 ${isLocked ? 'bg-red-900 shadow-red-900/20' : 'bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-blue-900/20'}`}>

              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-400 opacity-10 blur-2xl pointer-events-none"></div>

              {isLocked && (
                <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-4 text-center">
                  <Lock size={48} className="mb-4 text-red-200 animate-pulse" />
                  <h3 className="text-2xl font-black tracking-tight">Wallet Locked</h3>
                  <p className="text-red-200 text-sm mt-2 font-medium max-w-62.5">Verification required. Suspicious activity detected by Qunci Engine.</p>
                  <button
                    onClick={() => setShowVerificationInfo(true)}
                    className="mt-6 px-6 py-3 bg-white text-red-900 font-bold rounded-lg hover:bg-red-50 transition-colors"
                  >
                    How to Get Verified
                  </button>
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
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in zoom-in duration-300">
                  <ScanLine size={48} className="text-emerald-400 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">Scan QRIS</h3>
                  <p className="text-slate-300 text-sm mb-6">Enter the amount to simulate a merchant scan:</p>

                  <div className="flex bg-gray-800 rounded-xl overflow-hidden mb-6 border border-gray-600 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400 transition-all max-w-xs mx-auto shadow-2xl">
                    <span className="px-4 py-3 bg-gray-700 text-slate-300 font-bold border-r border-gray-600 select-none">Rp</span>
                    <input
                      ref={qrInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={qrisAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setQrisAmount(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          confirmQRISPayment();
                        }
                      }}
                      className="bg-gray-800 text-white font-bold text-xl px-4 py-3 outline-none w-full placeholder:text-gray-500 caret-emerald-400"
                      placeholder="50000"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>

                  <div className="flex gap-3 w-full max-w-50">
                    <button
                      onClick={() => setIsScanningQR(false)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmQRISPayment}
                      disabled={!qrisAmount || parseInt(qrisAmount) <= 0}
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                    >
                      Pay
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-4">Press Enter to confirm</p>
                </div>
              )}

              {/* Verification Help Modal */}
              {showVerificationInfo && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in duration-200">
                  <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
                    <button
                      onClick={() => setShowVerificationInfo(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Close"
                    >
                      <X size={24} />
                    </button>

                    <div className="flex justify-center mb-6">
                      <div className="p-4 bg-red-100 rounded-full">
                        <ShieldAlert className="text-red-600" size={32} />
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-2">Account Verification Required</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-6">Wallet Locked - Follow Steps Below</p>

                    {/* Step by step verification process */}
                    <div className="space-y-4 text-left mb-8">
                      <div className="flex gap-4 pb-4 border-b border-slate-200">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                            1
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">Contact Customer Service</h3>
                          <p className="text-sm text-slate-600">Reach out to our support team via any of the channels below within 24 hours</p>
                        </div>
                      </div>

                      <div className="flex gap-4 pb-4 border-b border-slate-200">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                            2
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">Provide Identity Verification</h3>
                          <p className="text-sm text-slate-600">Share your KTP/ID, phone number verification, and transaction history</p>
                        </div>
                      </div>

                      <div className="flex gap-4 pb-4 border-b border-slate-200">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                            3
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">Admin Review & Approval</h3>
                          <p className="text-sm text-slate-600">Our fraud team will review your account (typically 2-4 hours)</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white font-bold text-sm">
                            ✓
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-700 mb-1">Wallet Unlocked</h3>
                          <p className="text-sm text-slate-600">Your account will be reactivated and you can resume transactions</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Service Contact */}
                    <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-4 text-left">Contact Customer Service</h3>
                      <div className="space-y-3 text-left">
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 mt-1">📞</div>
                          <div>
                            <p className="font-semibold text-slate-900">Phone Support</p>
                            <p className="text-sm text-slate-600">+62 21 1234 5678</p>
                            <p className="text-xs text-slate-500">Available 24/7</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 mt-1">💬</div>
                          <div>
                            <p className="font-semibold text-slate-900">Live Chat</p>
                            <p className="text-sm text-slate-600">support.qunci.co.id</p>
                            <p className="text-xs text-slate-500">Average response: 2 minutes</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 mt-1">📧</div>
                          <div>
                            <p className="font-semibold text-slate-900">Email Support</p>
                            <p className="text-sm text-slate-600">verify@qunci.co.id</p>
                            <p className="text-xs text-slate-500">Response within 1 hour</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 mt-1">📍</div>
                          <div>
                            <p className="font-semibold text-slate-900">Visit us</p>
                            <p className="text-sm text-slate-600">Qunci HQ, Jakarta CBD</p>
                            <p className="text-xs text-slate-500">Business hours 09:00-18:00 WIB</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <a
                        href="tel:+62212123456789"
                        className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📞</span> Call Support
                      </a>
                      <a
                        href="mailto:verify@qunci.co.id"
                        className="flex-1 py-3 px-4 bg-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📧</span> Email Now
                      </a>
                    </div>

                    <button
                      onClick={() => setShowVerificationInfo(false)}
                      className="w-full mt-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Transfer Mock overlay */}
              {isTransferring && !isLocked && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in duration-200">
                  <div className="w-full max-w-sm bg-slate-100 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                    <button
                      onClick={() => setIsTransferring(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Close" aria-label="Close transfer dialog"
                    >
                      <X size={24} />
                    </button>

                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-left">Pay by Merchant ID</h3>

                    <div className="space-y-4 text-left">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">Merchant ID</label>
                        <input
                          type="text"
                          value={transferMerchantId}
                          onChange={(e) => setTransferMerchantId(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
                          placeholder="e.g. QUNCI_MERCHANT_8829"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">Amount (Rp)</label>
                        <div className="relative flex bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                          <span className="px-4 py-3 text-slate-500 font-medium border-r border-slate-100 bg-slate-50">Rp</span>
                          <input
                            ref={transferInputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={transferAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setTransferAmount(val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                confirmTransfer();
                              }
                            }}
                            className="bg-transparent text-slate-900 font-bold px-4 py-3 outline-none w-full placeholder:text-slate-300"
                            placeholder="0"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={confirmTransfer}
                      disabled={!transferAmount || parseInt(transferAmount) <= 0 || !transferMerchantId.trim()}
                      className="w-full mt-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(29,78,216,0.39)] transition-all"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              )}

              <div className="relative p-8 z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">
                          {isOffline ? "Offline Vault Balance" : "Main Online Balance"}
                        </p>
                        {isOffline && (
                          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/30 backdrop-blur-sm animate-pulse">
                            <WifiOff size={12} /> SECURE OFFLINE
                          </div>
                        )}
                      </div>

                      {/* Prominent Network Toggle */}
                      <button
                        onClick={toggleNetwork}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${isOffline ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-900/50 scale-105' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20'}`}
                      >
                        {isOffline ? (
                          <><Wifi size={16} /> Return Online</>
                        ) : (
                          <><WifiOff size={16} /> Switch to Offline Vault</>
                        )}
                      </button>
                    </div>

                    <h2 className="text-5xl font-black tracking-tight mb-6">
                      <span className="text-3xl font-medium text-blue-200 mr-1">Rp</span>
                      {(isOffline ? state.userOfflineBalance : state.userBalance).toLocaleString('id-ID')}
                    </h2>

                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
                      <div>
                        <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
                          {isOffline ? "Online Balance (Locked)" : "Offline Vault Protection"}
                        </p>
                        <p className="text-xl font-bold text-white">
                          <span className="text-sm font-medium text-blue-200 mr-1">Rp</span>
                          {(isOffline ? state.userBalance : state.userOfflineBalance).toLocaleString('id-ID')}
                        </p>
                      </div>

                      {!isOffline && (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50 text-xs font-bold">Rp</span>
                            <input
                              type="number"
                              value={vaultTransferAmount}
                              onChange={(e) => setVaultTransferAmount(e.target.value)}
                              className="w-24 bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-2 text-xs font-bold text-white outline-none focus:border-blue-400 placeholder:text-white/30 transition-all"
                              placeholder="Amount"
                            />
                          </div>

                          <button
                            onClick={() => {
                              const amt = parseInt(vaultTransferAmount);
                              if (amt > 0) {
                                transferToOffline(amt);
                                setVaultTransferAmount(''); // Reset
                              }
                            }}
                            disabled={!vaultTransferAmount || parseInt(vaultTransferAmount) <= 0}
                            className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20 flex items-center gap-1"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => {
                              const amt = parseInt(vaultTransferAmount);
                              if (amt > 0) {
                                transferToOnline(amt);
                                setVaultTransferAmount(''); // Reset
                              }
                            }}
                            disabled={!vaultTransferAmount || parseInt(vaultTransferAmount) <= 0}
                            className="bg-red-500/20 hover:bg-red-500/40 text-red-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-500/20 flex items-center gap-1"
                          >
                            - Withdraw
                          </button>
                        </div>
                      )}
                    </div>

                    {state.pendingBalance > 0 && (
                      <div className="text-sm font-bold text-amber-300 flex items-center gap-2 mt-5 bg-amber-900/40 w-fit px-4 py-2 rounded-xl border border-amber-500/30">
                        <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,1)]"></span>
                        Pending Sync Risk Validation: -Rp {state.pendingBalance.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
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

                  <button onClick={() => setIsTransferring(true)} className="flex-1 bg-blue-800/50 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 border border-white/10 shadow-lg" title="Transfer">
                    <Send size={18} /> Transfer
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

              {/* Dynamic Chart Area */}
              <div className="h-48 w-full relative flex items-end justify-between gap-2">
                {spendingData.map((height, i) => (
                  <div key={i} className={`w-full rounded-t-md relative group transition-all duration-500 cursor-pointer ${i === 6 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-50 hover:bg-blue-100'}`} style={{ height: `${height}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Rp {height * 10}k
                    </div>
                  </div>
                ))}
                {/* Gradient Overlay to make it look like a curve */}
                <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent pointer-events-none"></div>
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
                      icon={tx.status === 'RISK_HOLD' ? ShieldAlert : (tx.status === 'PENDING_SYNC' ? Clock : Store)}
                      color={tx.status === 'RISK_HOLD' ? "bg-red-100 text-red-600" : (tx.status === 'PENDING_SYNC' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600")}
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
            <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold mb-4">Quick Transfer</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {quickTransferUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleQuickTransfer(user.id)}
                    className="flex flex-col items-center gap-2 min-w-15 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-transparent group-hover:border-blue-400 group-hover:scale-110 shadow-lg transition-all flex items-center justify-center text-gray-300 group-hover:text-white group-active:scale-95">
                      <span className="font-bold">{user.initial}</span>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{user.name}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 min-w-15 cursor-pointer group">
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


