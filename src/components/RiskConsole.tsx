"use client";
import { useQunci } from '@/context/QunciContext';
import { Activity, ShieldAlert, Lock, Check, X, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RiskConsole() {
  const { state, lockWallet, updateTransactionStatus } = useQunci();

  const riskTx = state.transactions.find((t: { status: string; id: string; riskScore?: number; riskReasons?: string[] }) => t.status === 'RISK_HOLD');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="text-blue-600" /> Qunci Risk Engine
          </h2>
          <p className="text-slate-500">AI-Powered Fraud Detection & Wallet Management</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold text-blue-800">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Live Risk Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Alert Panel */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-3xl p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="text-red-400" /> High Risk Alert
          </h3>

          {riskTx ? (
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm">Transaction ID</p>
                  <p className="font-mono text-lg">{riskTx.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Risk Score</p>
                  <p className="text-3xl font-bold text-red-500">{riskTx.riskScore}/100</p>
                </div>
              </div>

              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="text-blue-400" size={18} />
                  <p className="text-sm font-bold text-slate-200">Qwen AI Analysis Breakdown</p>
                </div>
                <div className="space-y-3">
                  {riskTx.riskReasons?.map((reason: string, i: number) => {
                    const isHighSeverity = reason.includes('65');
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isHighSeverity ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                            {reason.split('(')[0].trim()}
                          </span>
                          <span className={`font-mono font-bold ${isHighSeverity ? 'text-red-400' : 'text-amber-400'}`}>
                            +{reason.match(/\+(\d+)/)?.[1] || '0'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900/50 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${isHighSeverity ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${isHighSeverity ? '80%' : '30%'}` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => updateTransactionStatus(riskTx.id, 'COMPLETED')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                >
                  <Check size={18} /> Overrule AI & Approve
                </button>
                <button
                  onClick={() => updateTransactionStatus(riskTx.id, 'FAILED')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95"
                >
                  <X size={18} /> Confirm Rejection
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Activity size={48} className="mb-4 opacity-50" />
              <p>No active high-risk transactions.</p>
            </div>
          )}
        </div>

        {/* Wallet Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Wallet Control</h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-700">Target User</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Budi Santoso</span>
              </div>
              <p className="text-xs text-slate-500">ID: USR_882910</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Actions</label>

              <button
                onClick={() => lockWallet(!state.walletLocked)}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${state.walletLocked
                  ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                <Lock size={18} />
                {state.walletLocked ? 'Unlock Wallet' : 'Lock Wallet (Freeze Funds)'}
              </button>

              <p className="text-xs text-slate-400 text-center mt-2">
                Locking the wallet will freeze all user balances and prevent new transactions until verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
