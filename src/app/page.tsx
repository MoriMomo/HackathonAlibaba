"use client";
import { QunciProvider, useQunci } from '@/context/QunciContext';
import Layout from '@/components/Layout';
import UserDashboard from '@/components/UserDashboard';
import MerchantDashboard from '@/components/MerchantDashboard';
import RiskConsole from '@/components/RiskConsole';

import { ShieldCheck, User, Store } from 'lucide-react';

// Toast Component (Inline for simplicity)
const Toast = () => {
  const { toast } = useQunci();
  if (!toast) return null;

  const colors: { [key in 'success' | 'error' | 'info']: string } = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-600'
  };

  return (
    <div className={`fixed bottom-8 right-8 ${colors[toast.type as 'success' | 'error' | 'info']} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce z-50`}>
      <span>{toast.msg}</span>
    </div>
  );
};

import { useState } from 'react';

const LoginScreen = () => {
  const { login } = useQunci();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && pin) {
      // For demo purposes, any input logs in as a USER
      login('USER');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-900 to-slate-900 dark:from-slate-900 dark:to-black overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-slate-900/50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 relative z-10 border dark:border-slate-800">
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
              <ShieldCheck size={36} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">QunciPay</h1>
            <p className="text-blue-100 mt-2 text-sm font-medium">Secure Offline-First Wallet</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+62</span>
                <input
                  type="tel"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-14 pr-4 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="812 3456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security PIN</label>
              <input
                type="password"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-[0.2em] transition-all text-center text-xl placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="••••••"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-2"
            >
              Secure Sign In
            </button>
          </form>

          {/* Quick Demo Mode Switcher (Hidden in production) */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsDemoOpen(!isDemoOpen)}
              className="text-xs text-slate-400 font-medium w-full text-center hover:text-slate-600 transition-colors"
            >
              Developer: Toggle Role Selector
            </button>

            {isDemoOpen && (
              <div className="mt-4 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => login('USER')}
                  className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800 transition-colors"
                >
                  <User size={18} className="mb-1" />
                  <span className="text-[10px] font-bold">USER</span>
                </button>
                <button
                  onClick={() => login('MERCHANT')}
                  className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800 transition-colors"
                >
                  <Store size={18} className="mb-1" />
                  <span className="text-[10px] font-bold">MERCHANT</span>
                </button>
                <button
                  onClick={() => login('ADMIN')}
                  className="flex flex-col items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-100 dark:border-amber-800 transition-colors"
                >
                  <ShieldCheck size={18} className="mb-1" />
                  <span className="text-[10px] font-bold">ADMIN</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="mt-8 flex flex-col items-center z-10">
        <div className="flex items-center gap-2 mb-2 text-slate-300">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-xs font-bold tracking-widest uppercase">Verified Secure</span>
        </div>
        <p className="text-slate-400/60 text-xs font-medium">© 2026 Alibaba Cloud Hackathon Prototype</p>
      </div>
    </div>
  );
};

const DashboardSwitcher = () => {
  const { state } = useQunci();

  switch (state.role) {
    case 'USER': return <UserDashboard />;
    case 'MERCHANT': return <MerchantDashboard />;
    case 'ADMIN': return <RiskConsole />;
    default: return <UserDashboard />;
  }
};

function HomeContent() {
  const { state } = useQunci();

  if (!state.isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  return (
    <Layout>
      <DashboardSwitcher />
      <Toast />
    </Layout>
  );
}

export default function Home() {
  return (
    <QunciProvider>
      <HomeContent />
    </QunciProvider>
  );
}
