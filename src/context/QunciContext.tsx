"use client";

import React, { createContext, useContext, useState } from 'react';

// --- Types ---
type Role = 'USER' | 'MERCHANT' | 'ADMIN';
type NetworkStatus = 'ONLINE' | 'OFFLINE';

interface Transaction {
  id: string;
  type: 'PAYMENT' | 'TOPUP' | 'CASHOUT';
  amount: number;
  status: 'COMPLETED' | 'PENDING_SYNC' | 'RISK_HOLD' | 'FAILED';
  merchant?: string;
  timestamp: string;
  riskScore?: number; // 0-100
  riskReasons?: string[];
}

interface AppState {
  role: Role;
  network: NetworkStatus;
  userBalance: number;
  pendingBalance: number; // Offline transactions
  merchantBalance: number;
  walletLocked: boolean;
  transactions: Transaction[];
  okeScore: number;
  points: number;
}

// --- Mock Data ---
const INITIAL_DATA: AppState = {
  role: 'USER',
  network: 'ONLINE',
  userBalance: 5000000,
  pendingBalance: 0,
  merchantBalance: 1250000,
  walletLocked: false,
  okeScore: 750,
  points: 1250,
  transactions: [
    { id: 'tx_1', type: 'PAYMENT', amount: 25000, status: 'COMPLETED', merchant: 'Kopi Kenangan', timestamp: '2023-10-25 08:30', riskScore: 10 },
    { id: 'tx_2', type: 'PAYMENT', amount: 150000, status: 'COMPLETED', merchant: 'Alfamart', timestamp: '2023-10-24 19:15', riskScore: 15 },
    { id: 'tx_3', type: 'PAYMENT', amount: 4500000, status: 'RISK_HOLD', merchant: 'Electronics Store', timestamp: '2023-10-26 02:30', riskScore: 88, riskReasons: ['Unusual Time', 'High Value', 'Location Mismatch'] },
  ]
};

interface QunciContextType {
  state: AppState;
  switchRole: (newRole: Role) => void;
  toggleNetwork: () => void;
  lockWallet: (isLocked: boolean) => void;
  updateTransactionStatus: (txId: string, newStatus: Transaction['status']) => void;
  syncOfflineTransactions: (currentState: AppState) => void;
  addOfflineTransaction: (amount: number, merchantId: string) => void;
  cashOutMerchant: (amount: number) => Promise<boolean>;
  topUpUser: (amount: number) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  toast: { msg: string, type: 'success' | 'error' | 'info' } | null;
}

const QunciContext = createContext<QunciContextType>(null as unknown as QunciContextType);

export const QunciProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(INITIAL_DATA);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' | 'info' } | null>(null);

  // --- Actions ---

  const switchRole = (newRole: Role) => {
    setState(prev => ({ ...prev, role: newRole }));
  };

  const toggleNetwork = () => {
    setState(prev => {
      const newNetwork = prev.network === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      if (newNetwork === 'ONLINE') {
        // Trigger sync when coming back online
        setTimeout(() => syncOfflineTransactions(prev), 500);
      }
      return { ...prev, network: newNetwork };
    });
    showToast(`Switched to ${state.network === 'ONLINE' ? 'Offline' : 'Online'} Mode`, 'info');
  };

  const lockWallet = (isLocked: boolean) => {
    setState(prev => ({ ...prev, walletLocked: isLocked }));
    if (isLocked) showToast('Wallet Locked by Admin', 'error');
    else showToast('Wallet Unlocked', 'success');
  };

  const updateTransactionStatus = (txId: string, newStatus: Transaction['status']) => {
    setState(prev => {
      const tx = prev.transactions.find(t => t.id === txId);
      if (!tx) return prev;

      const updatedTx = prev.transactions.map(t => t.id === txId ? { ...t, status: newStatus } : t);

      let newBalance = prev.userBalance;
      let newMerchantBalance = prev.merchantBalance;
      let newLockedState = prev.walletLocked;
      const newPending = prev.pendingBalance;

      if (newStatus === 'COMPLETED') {
        // Unlock wallet if it was locked due to this transaction
        if (prev.walletLocked && tx.status === 'RISK_HOLD') {
          newLockedState = false;
          showToast('Wallet Unlocked by Admin', 'success');
        }

        // Apply 1.5% MDR for merchants
        const mdrFee = tx.amount * 0.015;
        const settlementAmount = tx.amount - mdrFee;
        newMerchantBalance += settlementAmount;

      } else if (newStatus === 'FAILED' && tx.status === 'RISK_HOLD') {
        // Refund to user if it was a hold and got rejected
        newBalance += tx.amount;
      }

      return {
        ...prev,
        transactions: updatedTx,
        userBalance: newBalance,
        merchantBalance: newMerchantBalance,
        walletLocked: newLockedState,
        pendingBalance: newPending
      };
    });
  };

  const syncOfflineTransactions = (currentState: AppState) => {
    const pendingTxs = currentState.transactions.filter(t => t.status === 'PENDING_SYNC');
    if (pendingTxs.length === 0) return;

    showToast("Syncing offline transactions with Qunci Engine...", "info");

    setTimeout(() => {
      setState(prev => {
        let newlyLocked = false;
        let mdrAccumulator = 0;
        let earnedPoints = 0;

        const syncedTxs = prev.transactions.map(t => {
          if (t.status !== 'PENDING_SYNC') return t;

          // AI Risk check simulation
          const hour = new Date().getHours();
          const isLateNight = hour < 5 || hour > 22;
          let score = 5;
          const reasons: string[] = [];

          if (t.amount > 1000000) {
            score += 65;
            reasons.push("Anomali Nominal Tinggi (+65)");
          }
          if (isLateNight) {
            score += 20;
            reasons.push("Waktu Transaksi Tidak Wajar (+20)");
          }

          if (score > 60) {
            newlyLocked = true;
            return { ...t, status: 'RISK_HOLD' as Transaction['status'], riskScore: score, riskReasons: reasons };
          }

          // If approved
          mdrAccumulator += (t.amount - (t.amount * 0.015)); // 1.5% MDR
          earnedPoints += Math.floor(t.amount / 1000); // 1 point per 1000

          return { ...t, status: 'COMPLETED' as Transaction['status'], riskScore: score };
        });

        if (newlyLocked) {
          setTimeout(() => showToast("Security Alert: Suspicious offline activity detected. Wallet Locked.", "error"), 500);
        } else {
          setTimeout(() => showToast(`Sync Complete. +${earnedPoints} Qunci Points added!`, "success"), 500);
        }

        return {
          ...prev,
          transactions: syncedTxs,
          pendingBalance: 0,
          merchantBalance: prev.merchantBalance + mdrAccumulator,
          points: prev.points + earnedPoints,
          walletLocked: newlyLocked ? true : prev.walletLocked
        };
      });
    }, 2000);
  };

  const addOfflineTransaction = (amount: number, merchantStr: string) => {
    setState(prev => {
      const newTx: Transaction = {
        id: `tx_off_${Date.now()}`,
        type: 'PAYMENT',
        amount,
        status: 'PENDING_SYNC',
        merchant: merchantStr,
        timestamp: new Date().toLocaleString()
      };

      return {
        ...prev,
        userBalance: prev.userBalance - amount,
        pendingBalance: prev.pendingBalance + amount,
        transactions: [newTx, ...prev.transactions]
      };
    });
  };

  const cashOutMerchant = async (amount: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/paylabs/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (res.ok) {
        setState(prev => ({
          ...prev,
          merchantBalance: prev.merchantBalance - amount
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Cashout connection failed", e);
      return false;
    }
  };

  const topUpUser = (amount: number) => {
    setState(prev => {
      const newTx: Transaction = {
        id: `tx_topup_${Date.now()}`,
        type: 'TOPUP',
        amount,
        status: 'COMPLETED',
        timestamp: new Date().toLocaleString()
      };
      return {
        ...prev,
        userBalance: prev.userBalance + amount,
        transactions: [newTx, ...prev.transactions]
      }
    })
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <QunciContext.Provider value={{
      state,
      switchRole,
      toggleNetwork,
      lockWallet,
      updateTransactionStatus,
      syncOfflineTransactions,
      addOfflineTransaction,
      cashOutMerchant,
      topUpUser,
      showToast,
      toast
    }}>
      {children}
    </QunciContext.Provider>
  );
};

export const useQunci = () => useContext(QunciContext);
