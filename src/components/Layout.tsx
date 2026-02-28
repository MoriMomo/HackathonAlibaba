"use client";
import { useQunci } from '@/context/QunciContext';
import { Shield, Wifi, WifiOff, Smartphone, Store, ShieldAlert, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, switchRole, toggleNetwork, logout } = useQunci();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-6 py-3 flex justify-between items-center shadow-sm">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white">
            <Shield size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Qunci<span className="text-blue-600">Pay</span></span>
        </div>

        {/* Role Switcher */}
        <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'USER', label: 'QunciPay', icon: Smartphone },
            { id: 'MERCHANT', label: 'Merchant Dashboard', icon: Store },
            { id: 'ADMIN', label: 'Qunci Engine', icon: ShieldAlert },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => switchRole(role.id as "USER" | "MERCHANT" | "ADMIN")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.role === role.id
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <role.icon size={16} />
              {role.label}
            </button>
          ))}
        </div>

        {/* Actions (Network + Logout) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <span className={state.network === 'ONLINE' ? 'text-emerald-500' : 'text-amber-500'}>
              {state.network} MODE
            </span>
            <button
              onClick={toggleNetwork}
              className={`p-2 rounded-full transition-colors ${state.network === 'ONLINE' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-amber-100 text-amber-700'
                }`}
            >
              {state.network === 'ONLINE' ? <Wifi size={18} /> : <WifiOff size={18} />}
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden md:block"></div>

          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-500 p-2 md:px-3 md:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            title="Disconnect & Return to Login"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Disconnect</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          key={state.role}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Global Toast */}
      {/* (Implementation of Toast component would go here) */}
    </div>
  );
}
