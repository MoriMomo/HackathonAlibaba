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
  riskReason?: string; // Full AI explanation
}

interface AppState {
  role: Role;
  isAuthenticated: boolean;
  network: NetworkStatus;
  userBalance: number;
  userOfflineBalance: number;
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
  isAuthenticated: false,
  network: 'ONLINE',
  userBalance: 4500000,
  userOfflineBalance: 500000,
  pendingBalance: 0,
  merchantBalance: 1250000,
  walletLocked: false,
  okeScore: 750,
  points: 1250,
  transactions: [
    { id: 'tx_1', type: 'PAYMENT', amount: 25000, status: 'COMPLETED', merchant: 'Kopi Kenangan', timestamp: '2023-10-25 08:30', riskScore: 10 },
    { id: 'tx_2', type: 'PAYMENT', amount: 150000, status: 'COMPLETED', merchant: 'Alfamart', timestamp: '2023-10-24 19:15', riskScore: 15 },
    { id: 'tx_3', type: 'PAYMENT', amount: 4500000, status: 'RISK_HOLD', merchant: 'Electronics Store', timestamp: '2023-10-26 02:30', riskScore: 88, riskReasons: ['Unusual Time (+20)', 'High Value (+40)', 'Location Mismatch (+28)'], riskReason: 'Based on behavioral analysis, this transaction deviates significantly from the user\'s typical spending patterns. The combination of an abnormally high amount at an unusual hour, coupled with a location mismatch, strongly suggests potential account compromise or unauthorized access.' },
  ]
};

interface QunciContextType {
  state: AppState;
  switchRole: (newRole: Role) => void;
  login: (role: Role) => void;
  logout: () => void;
  toggleNetwork: () => void;
  lockWallet: (isLocked: boolean) => void;
  updateTransactionStatus: (txId: string, newStatus: Transaction['status']) => void;
  syncOfflineTransactions: (currentState: AppState) => void;
  addOfflineTransaction: (amount: number, merchantId: string) => void;
  cashOutMerchant: (amount: number, bankCode: string, accountNo: string, accountName: string) => Promise<boolean>;
  generateMerchantQR: (amount: number) => Promise<string | null>;
  processQRISPayment: (amount: number) => Promise<boolean>;
  processTransfer: (amount: number, targetId: string) => Promise<boolean>;
  topUpUser: (amount: number) => void;
  transferToOffline: (amount: number) => void;
  transferToOnline: (amount: number) => void;
  getTransactionExplanation: (txId: string) => Promise<string | null>;
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

  const login = (role: Role) => {
    setState(prev => ({ ...prev, role, isAuthenticated: true }));
    showToast(`Logged in as ${role}`, 'success');
  };

  const logout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false }));
    showToast('Logged out successfully', 'info');
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
              riskReasons: reasons,
              riskReason: riskResult.reason
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
      if (prev.userOfflineBalance < amount) {
        showToast("Insufficient Offline Balance! Please top up your offline wallet.", "error");
        return prev;
      }

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
        userOfflineBalance: prev.userOfflineBalance - amount,
        pendingBalance: prev.pendingBalance + amount,
        transactions: [newTx, ...prev.transactions]
      };
    });
  };

  const transferToOffline = (amount: number) => {
    setState(prev => {
      if (prev.userBalance < amount) {
        showToast("Insufficient Online Balance to transfer.", "error");
        return prev;
      }
      showToast(`Transferred Rp ${amount.toLocaleString('id-ID')} to Offline Wallet`, "success");
      return {
        ...prev,
        userBalance: prev.userBalance - amount,
        userOfflineBalance: prev.userOfflineBalance + amount
      };
    });
  };

  const transferToOnline = (amount: number) => {
    setState(prev => {
      if (prev.userOfflineBalance < amount) {
        showToast("Insufficient Offline Balance to transfer.", "error");
        return prev;
      }
      showToast(`Transferred Rp ${amount.toLocaleString('id-ID')} back to Online Wallet`, "success");
      return {
        ...prev,
        userOfflineBalance: prev.userOfflineBalance - amount,
        userBalance: prev.userBalance + amount
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
      } else {
        const errorData = await res.json();
        showToast(`PayLabs API Error: ${errorData.error || 'Unknown'}`, 'error');
        console.error("Cashout API Error Response:", errorData);
        return false;
      }
    } catch (e) {
      console.error("Cashout connection failed", e);
      showToast("Network Error contacting PayLabs Cashout", "error");
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
          riskReasons: status === 'RISK_HOLD' ? reasons : undefined,
          riskReason: status === 'RISK_HOLD' ? riskResult.reason : undefined
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

  const processTransfer = async (amount: number, targetId: string): Promise<boolean> => {
    const isOffline = state.network === 'OFFLINE';

    if (isOffline) {
      if (state.userOfflineBalance < amount) {
        showToast("Insufficient Offline Balance for Transfer.", "error");
        return false;
      }
    } else {
      if (state.userBalance < amount) {
        showToast("Insufficient Online Balance for Transfer.", "error");
        return false;
      }
    }

    try {
      showToast(`Transferring to ${targetId}...`, "info");

      const isBuSiti = targetId.toUpperCase() === 'WRG-8821';
      const merchantName = isBuSiti ? 'Warung Bu Siti' : `Recipient ${targetId}`;

      let riskResult: { decision?: string, flags?: string[], reason?: string, riskScore?: number } | null = null;

      if (!isOffline) {
        showToast("Analyzing transaction risk...", "info");
        const transactionData = {
          userId: 'usr_budi_123',
          amount: amount,
          merchant: merchantName,
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
        riskResult = await res.json();
      }

      setState(prev => {
        let status: Transaction['status'] = isOffline ? 'PENDING_SYNC' : 'COMPLETED';
        let newlyLocked = false;
        let reasons: string[] = [];

        if (riskResult) {
          reasons = riskResult.flags && riskResult.flags.length > 0
            ? riskResult.flags
            : [riskResult.reason || "Suspicious Activity Detected"];

          if (riskResult.decision === 'HOLD' || riskResult.decision === 'REJECT') {
            status = 'RISK_HOLD';
            newlyLocked = true;
          }
        }

        const newTx: Transaction = {
          id: `tx_transfer_${isOffline ? 'off_' : ''}${Date.now()}`,
          type: 'PAYMENT',
          amount: amount,
          status: status,
          merchant: merchantName,
          timestamp: new Date().toLocaleString(),
          riskScore: riskResult?.riskScore,
          riskReasons: status === 'RISK_HOLD' ? reasons : undefined,
          riskReason: status === 'RISK_HOLD' ? riskResult?.reason : undefined
        };

        if (newlyLocked) {
          setTimeout(() => showToast(`Payment Held by QunciGuard: ${riskResult?.reason || 'Security Alert'}`, "error"), 500);
        } else if (isOffline) {
          showToast(`Offline Transfer Saved. Will sync when online.`, "info");
        } else {
          showToast(`Transfer of Rp ${amount.toLocaleString('id-ID')} Successful!`, "success");
        }

        // Deduct logic: ONLY deduct online balance if the status is NOT RISK_HOLD (i.e. COMPLETED)
        // If offline, deduct from offline balance immediately (pending sync)
        const shouldDeductOnline = !isOffline && status === 'COMPLETED';

        return {
          ...prev,
          userBalance: shouldDeductOnline ? prev.userBalance - amount : prev.userBalance,
          userOfflineBalance: isOffline ? prev.userOfflineBalance - amount : prev.userOfflineBalance,
          pendingBalance: isOffline ? prev.pendingBalance + amount : prev.pendingBalance,
          // If it's WRG-8821, actually add it to the merchant balance too, BUT ONLY IF ONLINE and COMPLETED.
          merchantBalance: (isBuSiti && shouldDeductOnline) ? prev.merchantBalance + amount : prev.merchantBalance,
          walletLocked: newlyLocked ? true : prev.walletLocked,
          transactions: [newTx, ...prev.transactions]
        };
      });

      return true;
    } catch (e) {
      console.error("Transfer error:", e);
      showToast("Transfer failed.", "error");
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

  const getTransactionExplanation = async (txId: string): Promise<string | null> => {
    try {
      const tx = state.transactions.find(t => t.id === txId);
      if (!tx) return null;

      const transactionData = {
        userId: 'usr_budi_123',
        amount: tx.amount,
        merchant: tx.merchant || 'Qunci Payment',
        timestamp: tx.timestamp,
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

      if (!res.ok) throw new Error('API failed');
      const result = await res.json();

      // Update transaction with explanation
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t =>
          t.id === txId ? { ...t, riskReason: result.reason, riskScore: result.riskScore } : t
        )
      }));

      return result.reason;
    } catch (e) {
      console.error('Failed to get explanation:', e);
      return null;
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <QunciContext.Provider value={{
      state,
      switchRole,
      login,
      logout,
      toggleNetwork,
      lockWallet,
      updateTransactionStatus,
      syncOfflineTransactions,
      addOfflineTransaction,
      cashOutMerchant,
      generateMerchantQR,
      processQRISPayment,
      processTransfer,
      topUpUser,
      transferToOffline,
      transferToOnline,
      getTransactionExplanation,
      showToast,
      toast
    }}>
      {children}
    </QunciContext.Provider>
  );
};

export const useQunci = () => useContext(QunciContext);
