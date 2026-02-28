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
  cashOutMerchant: (amount: number, bankCode: string, accountNo: string, accountName: string) => Promise<boolean>;
  generateMerchantQR: (amount: number) => Promise<string | null>;
  processQRISPayment: (amount: number) => Promise<boolean>;
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

  const syncOfflineTransactions = async (currentState: AppState) => {
    const pendingTxs = currentState.transactions.filter(t => t.status === 'PENDING_SYNC');
    if (pendingTxs.length === 0) return;

    showToast("Syncing offline transactions with Qunci Engine...", "info");

    try {
      // Call real AI API for each pending transaction
      const riskResults = await Promise.all(pendingTxs.map(async (t) => {
        const transactionData = {
          userId: 'usr_budi_123',
          amount: t.amount,
          merchant: t.merchant || 'Offline QR',
          timestamp: t.timestamp || new Date().toISOString(),
          location: 'Jakarta, ID',
          userHistory: {
            avgTransaction: 150000,
            lastLogin: new Date().toISOString(),
            typicalLocation: 'Jakarta, ID',
          },
        };

        const res = await fetch('/api/risk/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        });

        if (!res.ok) throw new Error('Risk assessment API failed');
        const data = await res.json();
        return { txId: t.id, data, amount: t.amount };
      }));

      setState(prev => {
        let newlyLocked = false;
        let mdrAccumulator = 0;
        let earnedPoints = 0;

        const syncedTxs = prev.transactions.map(t => {
          if (t.status !== 'PENDING_SYNC') return t;

          const resultObj = riskResults.find(r => r.txId === t.id);
          if (!resultObj) return t;

          const riskResult = resultObj.data;

          if (riskResult.decision === 'HOLD' || riskResult.decision === 'REJECT') {
            newlyLocked = true;
            const reasons = riskResult.flags && riskResult.flags.length > 0
              ? riskResult.flags
              : [riskResult.reason || "Suspicious Activity Detected"];

            return {
              ...t,
              status: 'RISK_HOLD' as Transaction['status'],
              riskScore: riskResult.riskScore,
              riskReasons: reasons
            };
          }

          // If approved
          mdrAccumulator += (t.amount - (t.amount * 0.015)); // 1.5% MDR
          earnedPoints += Math.floor(t.amount / 1000); // 1 point per 1000

          return { ...t, status: 'COMPLETED' as Transaction['status'], riskScore: riskResult.riskScore };
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
    } catch (e) {
      console.error("Sync error:", e);
      showToast("Sync failed. Risk Engine unavailable.", "error");
    }
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

  const cashOutMerchant = async (amount: number, bankCode: string, accountNo: string, accountName: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/paylabs/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankCode, accountNo, accountName })
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

  const generateMerchantQR = async (amount: number): Promise<string | null> => {
    try {
      const res = await fetch('/api/paylabs/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (res.ok) {
        const data = await res.json();
        return data.qrisUrl;
      }
      return null;
    } catch (e) {
      console.error("QRIS generation failed", e);
      return null;
    }
  };

  const processQRISPayment = async (amount: number): Promise<boolean> => {
    if (state.userBalance < amount) {
      showToast("Insufficient Balance for QRIS payment.", "error");
      return false;
    }

    try {
      showToast("Analyzing transaction risk...", "info");

      const transactionData = {
        userId: 'usr_budi_123',
        amount: amount,
        merchant: 'Qunci Merchant (QRIS)',
        timestamp: new Date().toISOString(),
        location: 'Jakarta, ID',
        userHistory: {
          avgTransaction: 150000,
          lastLogin: new Date().toISOString(),
          typicalLocation: 'Jakarta, ID',
        },
      };

      const res = await fetch('/api/risk/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (!res.ok) throw new Error('Risk assessment API failed');
      const riskResult = await res.json();

      setState(prev => {
        const mdrFee = amount * 0.015; // 1.5% MDR deduction for merchant
        const settlementAmount = amount - mdrFee;

        let status: Transaction['status'] = 'COMPLETED';
        let newlyLocked = false;
        const reasons = riskResult.flags && riskResult.flags.length > 0
          ? riskResult.flags
          : [riskResult.reason || "Suspicious Activity Detected"];

        if (riskResult.decision === 'HOLD' || riskResult.decision === 'REJECT') {
          status = 'RISK_HOLD';
          newlyLocked = true;
        }

        const newTx: Transaction = {
          id: `tx_qris_${Date.now()}`,
          type: 'PAYMENT',
          amount: amount,
          status: status,
          merchant: 'Qunci Merchant (QRIS)',
          timestamp: new Date().toLocaleString(),
          riskScore: riskResult.riskScore,
          riskReasons: status === 'RISK_HOLD' ? reasons : undefined
        };

        if (newlyLocked) {
          setTimeout(() => showToast(`Payment Held by QunciGuard: ${riskResult.reason}`, "error"), 500);
        } else {
          showToast(`QRIS Payment of Rp ${amount.toLocaleString('id-ID')} Successful!`, "success");
        }

        return {
          ...prev,
          userBalance: status === 'COMPLETED' ? prev.userBalance - amount : prev.userBalance, // Deduct only if completed
          merchantBalance: status === 'COMPLETED' ? prev.merchantBalance + settlementAmount : prev.merchantBalance,
          walletLocked: newlyLocked ? true : prev.walletLocked,
          transactions: [newTx, ...prev.transactions]
        };
      });

      return true;
    } catch (e) {
      console.error("QRIS Payment error:", e);
      showToast("Payment failed. Risk Engine unavailable.", "error");
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
      generateMerchantQR,
      processQRISPayment,
      topUpUser,
      showToast,
      toast
    }}>
      {children}
    </QunciContext.Provider>
  );
};

export const useQunci = () => useContext(QunciContext);
