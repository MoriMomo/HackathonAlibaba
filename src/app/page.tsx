"use client";
import { QunciProvider, useQunci } from '@/context/QunciContext';
import Layout from '@/components/Layout';
import UserDashboard from '@/components/UserDashboard';
import MerchantDashboard from '@/components/MerchantDashboard';
import RiskConsole from '@/components/RiskConsole';

import { ShieldCheck, User, Store, ArrowRight } from 'lucide-react';

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

const LoginScreen = () => {
  const { login } = useQunci();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-linear-to-br from-blue-900 to-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
          <h1 className="text-3xl font-black text-white relative z-10 flex items-center justify-center gap-2">
            <ShieldCheck size={32} className="text-emerald-400" />
            QunciPay
          </h1>
          <p className="text-blue-100 mt-2 font-medium relative z-10">Select your simulation role</p>
        </div>

        <div className="p-8 space-y-4">
          <button
            onClick={() => login('USER')}
            className="w-full group flex items-center justify-between bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-4 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Consumer Wallet</h3>
                <p className="text-xs text-slate-500">Pay offline, top-up, check limits</p>
              </div>
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => login('MERCHANT')}
            className="w-full group flex items-center justify-between bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Store size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Merchant Terminal</h3>
                <p className="text-xs text-slate-500">Generate QRIS, cashout to bank</p>
              </div>
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => login('ADMIN')}
            className="w-full group flex items-center justify-between bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 p-4 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 text-amber-600 p-3 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Risk Console</h3>
                <p className="text-xs text-slate-500">Monitor AI blocks, overrule holds</p>
              </div>
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-sm font-medium">© 2026 Alibaba Hackathon</p>
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
