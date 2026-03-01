# TODO: Oke Points Offline Transfer Limit Feature - COMPLETED

## Plan

### 1. Update `src/context/QunciContext.tsx`
- [x] Change default `okeScore` from 750 to 50
- [x] Add function to calculate offline transfer limit based on Oke Score: `okeScore * 10000`
- [x] Pass this limit to risk engine when analyzing offline transactions

### 2. Update `src/lib/riskEngine.ts`
- [x] Add `maxOfflineTransferLimit: number` to `TransactionData` interface
- [x] Add logic to flag transactions exceeding the offline limit as a risk factor

### 3. Update `src/app/api/risk/check/route.ts`
- [x] Update `transactionSchema` to include `maxOfflineTransferLimit` field

## Formula
- Oke Score Range: 10-100
- Default Oke Score: 50
- Limit = Oke Score × 10,000 IDR
- Example: 50 score = 500,000 IDR limit
