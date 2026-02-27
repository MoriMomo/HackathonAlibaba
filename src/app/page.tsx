"use client";
import { QunciProvider, useQunci } from '@/context/QunciContext';
import Layout from '@/components/Layout';
import UserDashboard from '@/components/UserDashboard';
import MerchantDashboard from '@/components/MerchantDashboard';
import RiskConsole from '@/components/RiskConsole';
import { useEffect } from 'react';

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
