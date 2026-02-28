"use client";
import { useQunci } from '@/context/QunciContext';
import { Activity, ShieldAlert, Lock, Check, X, Cpu, Users, Eye, Server, AlertTriangle, Sparkles, Loader, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function RiskConsole() {
  const { state, lockWallet, updateTransactionStatus, getTransactionExplanation } = useQunci();
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  // For type safety, we define the expected structure
  type RiskTx = {
    id: string;
    status: string;
    riskScore?: number;
    riskReasons?: string[];
    riskReason?: string;
  };

  type Transaction = {
    id: string;
    status: string;
    riskScore?: number;
    riskReasons?: string[];
    riskReason?: string;
    merchant?: string;
    type?: string;
    amount: number;
    timestamp: string;
  };

  const riskTx = state.transactions.find((t: { status: string }) => t.status === 'RISK_HOLD') as RiskTx | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Cpu className="text-blue-600" /> QunciPay Admin Center
          </h2>
          <p className="text-slate-500 font-medium">Global Fraud Operations & Network Management</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-800 tracking-wider">NETWORK ONLINE</span>
        </div>
      </div>

      {/* Admin Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Network Uptime', value: '99.98%', icon: Server, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Users', value: '+24,812', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Monitored Txs (24h)', value: '1.2M', icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Threats Blocked', value: '842', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Admin Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Risk Feed & Investigation Panel */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-3xl p-8 shadow-2xl border border-slate-800 relative xl:min-h-[600px] flex flex-col">
          {/* Ambient Backgrounds */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
          {riskTx && <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/15 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>}

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-blue-400" /> Live Investigation Queue
            </h3>
            {riskTx && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <AlertTriangle size={14} /> ACTION REQUIRED
              </span>
            )}
          </div>

          {riskTx ? (
            <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-between">

              {/* Header Info */}
              <div className="flex justify-between items-end bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Incident Reference</p>
                  <p className="font-mono text-xl font-medium text-slate-200">{riskTx.id}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Threat Level</p>
                    <p className="text-3xl font-black text-red-500 leading-none">{riskTx.riskScore ?? 0}<span className="text-lg text-slate-500">/100</span></p>
                  </div>
                </div>
              </div>

              {/* Qwen Context / Reasoning Box (AI Generated) */}
              <div className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <Sparkles className="text-indigo-400 animate-pulse" size={18} />
                  <p className="text-sm font-black uppercase text-indigo-300 tracking-wider">Qwen AI Analysis Summary</p>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed relative z-10 font-medium">
                  {riskTx.riskReason || "Multiple intersecting anomalies were detected by the Large Language Model behavioral analysis matrix, prompting an immediate transaction freeze pending manual administrative review."}
                </p>
              </div>

              {/* Detailed Flag Breakdown */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Cpu className="text-blue-400" size={18} />
                  <p className="text-sm font-bold text-slate-200">Triggered Heuristic Flags</p>
                </div>
                <div className="space-y-4">
                  {riskTx.riskReasons?.map((reason: string, i: number) => {
                    const isHighSeverity = reason.includes('4') || reason.includes('5') || reason.includes('High') || riskTx.riskScore! > 80;
                    const cleanReason = reason.includes('(') ? reason.split('(')[0].trim() : reason;
                    const rawPoints = reason.match(/\+(\d+)/)?.[1] || '0';
                    const points = parseInt(rawPoints) > 0 ? `+${rawPoints}` : 'Critical Issue';

                    return (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-200 font-medium flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${isHighSeverity ? 'bg-red-500 shadow-red-500' : 'bg-amber-500 shadow-amber-500'}`}></span>
                            {cleanReason}
                          </span>
                          <span className={`font-mono font-bold text-xs bg-slate-900 border px-2 py-0.5 rounded ${isHighSeverity ? 'text-red-400 border-red-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                            {points}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900/60 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div className={`h-1.5 rounded-full ${isHighSeverity ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`} style={{ width: `${isHighSeverity ? '85%' : '45%'}` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Resolution */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => updateTransactionStatus(riskTx.id, 'COMPLETED')}
                  className="flex-1 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-400/50"
                >
                  <Check size={18} /> Overrule AI & Approve
                </button>
                <button
                  onClick={() => updateTransactionStatus(riskTx.id, 'FAILED')}
                  className="flex-1 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-600 shadow-lg"
                >
                  <X size={18} /> Confirm Rejection
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <div className="w-24 h-24 mb-6 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 border-dashed animate-[spin_10s_linear_infinite]">
                <Check size={40} className="text-slate-600 animate-[spin_10s_linear_infinite_reverse]" />
              </div>
              <p className="font-bold text-slate-400">Zero Pending Investigations</p>
              <p className="text-sm mt-1">All network traffic is currently rated safe by Qwen AI.</p>
            </div>
          )}
        </div>

        {/* Right Column: User Management */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">User Management</h3>
          </div>

          <div className="flex-1 space-y-6">
            {/* Active Profile Info */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-black text-slate-800 block text-lg">Budi Santoso</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 block">ID: USR_882910</span>
                </div>
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full shadow-sm">Standard</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Account Status</p>
                  <p className={`text-sm font-bold ${state.walletLocked ? 'text-red-600' : 'text-emerald-600'}`}>{state.walletLocked ? 'FROZEN' : 'ACTIVE'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Risk Rating</p>
                  <p className="text-sm font-bold text-amber-600">MODERATE</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              <label className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Emergency Protocol</label>

              <button
                onClick={() => lockWallet(!state.walletLocked)}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${state.walletLocked
                  ? 'bg-gradient-to-b from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200 shadow-sm'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 shadow-md shadow-slate-900/10'
                  }`}
              >
                <Lock size={18} />
                {state.walletLocked ? 'Lift Wallet Freeze' : 'Initiate Wallet Freeze'}
              </button>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  <strong className="text-slate-700">Warning:</strong> Freezing the wallet will instantly block all online and offline transactions, QR generation, and P2P transfers until a manual audit is completed.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PENDING VERIFICATION REQUESTS */}
      {state.walletLocked && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl border border-orange-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-700 animate-pulse">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Pending Verification Requests</h3>
              <p className="text-xs text-slate-600 mt-1">Users with locked wallets awaiting identity verification</p>
            </div>
          </div>

          {/* Verification Request Card */}
          <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">Account Verification Required</p>
                <p className="text-xs text-slate-600 mt-1">User has been notified about verification process</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">PENDING</span>
            </div>

            {/* Verification Status */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div>
                <p className="text-slate-500 font-bold">Step</p>
                <p className="text-slate-900 font-bold">1/3 - Awaiting ID Submission</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold">Request Time</p>
                <p className="text-slate-900 font-bold">{new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            {/* Verification Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button className="flex-1 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors border border-emerald-200 flex items-center justify-center gap-2">
                <Check size={14} />
                Mark Verified
              </button>
              <button className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-2">
                <MessageCircle size={14} />
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL TRANSACTION LOG - ALL ACTIVITY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">User Transaction Log with AI Analysis</h3>
            <p className="text-xs text-slate-500 mt-1">All account transactions analyzed by Qwen AI</p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {state.transactions.length > 0 ? (
            state.transactions.map((tx: Transaction, idx: number) => {
              const bgColor = tx.status === 'RISK_HOLD' ? 'bg-red-50 border-red-200' : tx.status === 'FAILED' ? 'bg-slate-50 border-slate-200' : tx.status === 'PENDING_SYNC' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';
              const statusColor = tx.status === 'RISK_HOLD' ? 'text-red-700 bg-red-100' : tx.status === 'FAILED' ? 'text-slate-700 bg-slate-100' : tx.status === 'PENDING_SYNC' ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100';
              const riskColor = tx.riskScore ? tx.riskScore > 70 ? 'text-red-600' : tx.riskScore > 40 ? 'text-amber-600' : 'text-emerald-600' : 'text-slate-500';

              return (
                <div key={idx} className={`border rounded-xl p-4 transition-all hover:shadow-md ${bgColor}`}>
                  {/* Row 1: Header Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-xs font-bold text-slate-500">{tx.id}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>
                          {tx.status}
                        </span>
                        {tx.riskScore !== undefined && (
                          <span className={`text-xs font-bold ${riskColor}`}>
                            Risk: {tx.riskScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {tx.merchant || tx.type === 'TOPUP' ? '📱 Top Up' : '🔄 Transfer'}
                      </p>
                    </div>
                    <p className="text-lg font-black text-slate-900">
                      - Rp {tx.amount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Row 2: Timestamp */}
                  <p className="text-xs text-slate-500 mb-3">{tx.timestamp}</p>

                  {/* Row 3: Qwen AI Explanation (if exists) */}
                  {tx.riskReason && (
                    <div className="bg-white/60 p-3 rounded-lg mb-3 border border-slate-200/50">
                      <div className="flex items-start gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Qwen AI Assessment</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {tx.riskReason}
                      </p>
                    </div>
                  )}

                  {/* Row 3b: Optional "Get Explanation" Button (for safe transactions only) */}
                  {!tx.riskReason && tx.status !== 'RISK_HOLD' && (
                    <button
                      onClick={async () => {
                        setLoadingExplanation(tx.id);
                        await getTransactionExplanation(tx.id);
                        setLoadingExplanation(null);
                      }}
                      disabled={loadingExplanation === tx.id}
                      className="mb-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingExplanation === tx.id ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          Requesting AI Analysis...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Get AI Explanation
                        </>
                      )}
                    </button>
                  )}

                  {/* Row 4: Risk Flags */}
                  {tx.riskReasons && tx.riskReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tx.riskReasons.map((flag: string, i: number) => (
                        <span key={i} className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded-md">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Eye size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No transaction activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}