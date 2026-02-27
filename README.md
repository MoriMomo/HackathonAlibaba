# QunciPay - AI-Powered Fintech Platform

A modern, interactive prototype of a comprehensive fintech application built with **Next.js**, **React**, **Tailwind CSS**, **Framer Motion**, and **Recharts**. This application showcases a sophisticated role-based system with real-time fraud detection and wallet management capabilities.

## 🎯 Features

### 1. **Role Switcher**
- **User App**: Mobile-first wallet interface for consumers
- **Merchant Dashboard**: POS terminal and settlement management
- **Risk Console**: AI-powered fraud detection and admin controls

### 2. **Network Simulation**
- Toggle between **Online** and **Offline** modes
- Simulates offline payment scenarios with transaction queuing
- Real-time status synchronization

### 3. **AI Risk Engine**
- Automatic fraud detection with risk scoring (0-100)
- Transaction flagging based on multiple risk factors
- Admin controls to approve, reject, or lock wallets

### 4. **Wallet Management**
- Real-time balance tracking
- OKE Score (credit score equivalent)
- Qunci Points loyalty system
- Transaction history with status indicators

### 5. **Merchant Features**
- Daily sales analytics
- Real-time transaction queue
- Settlement and cash-out functionality
- MDR (Merchant Discount Rate) calculations

### 6. **Visual Design**
- Deep Blue & Electric Green color scheme
- Smooth animations with Framer Motion
- Responsive design for all screen sizes
- Chart visualization with Recharts

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main entry point with dashboard switcher
│   └── globals.css         # Global styles & Tailwind imports
├── context/
│   └── QunciContext.tsx    # Global state management with React Context
└── components/
    ├── Layout.tsx              # Navigation bar and main layout
    ├── UserDashboard.tsx       # Consumer wallet & transaction view
    ├── MerchantDashboard.tsx   # Merchant stats & transaction queue
    └── RiskConsole.tsx         # Admin fraud detection panel
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

Dependencies are already installed. To run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## 🎮 How to Use

### 1. Explore Different Roles

Click the role buttons in the top navigation:
- **User App** - Consumer wallet interface
- **Merchant** - Business transaction dashboard
- **Risk Console** - Admin fraud management

### 2. Test Offline Mode

- Click the WiFi icon (top-right) to toggle Online/Offline
- In User App during Offline: Click "Pay QRIS" to simulate offline payment
- Switch back to Online to sync transactions

### 3. Review Fraud Detection

- Go to Risk Console tab
- View the flagged transaction with Risk Score: 88/100
- Review AI analysis factors: Unusual Time, High Value, Location Mismatch
- Click "Approve & Release" or "Reject Transaction" to resolve

### 4. Admin Wallet Controls

- In Risk Console: Click "Lock Wallet"
- Switch to User App: Account shows as locked (red overlay)
- Return to Risk Console and click "Unlock Wallet" to restore access

## 🛠️ Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API with Hooks
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript

## 📦 Installed Dependencies

```
- next: ^16.0
- react: ^19.0
- react-dom: ^19.0
- framer-motion: Latest (animations)
- lucide-react: Latest (icons)
- recharts: ^2.10+ (charts)
- tailwindcss: ^3.4+ (styling)
- typescript: Latest
```

## 💾 State Management Architecture

The application uses React Context API (`QunciContext`) for global state management:

### Core State
```typescript
interface AppState {
  role: 'USER' | 'MERCHANT' | 'ADMIN'
  network: 'ONLINE' | 'OFFLINE'
  userBalance: number
  pendingBalance: number
  walletLocked: boolean
  transactions: Transaction[]
  okeScore: number
  points: number
}
```

### Available Actions
- `switchRole(role)`: Change active view (User/Merchant/Admin)
- `toggleNetwork()`: Switch between Online/Offline modes
- `lockWallet(isLocked)`: Admin function to freeze user account
- `updateTransactionStatus(txId, status)`: Update transaction state
- `showToast(msg, type)`: Display notifications

## 🎨 Design System

### Color Palette
- **Primary**: Deep Blue (`#1e3a8a`, Tailwind `blue-900`)
- **Accent**: Electric Green (`#10b981`, Tailwind `emerald-500`)
- **Success**: Emerald Green
- **Error**: Red
- **Warning**: Amber
- **Info**: Blue

### Responsive Design
- Mobile-first approach
- Breakpoints: 320px (mobile), 768px (tablet), 1440px (desktop)

## 📊 Mock Data Included

### User Account
- **Name**: Budi Santoso (Budi)
- **Balance**: Rp 5,000,000
- **OKE Score**: 750 (Excellent rating)
- **Points**: 1,250

### Sample Transactions
1. **tx_1**: Kopi Kenangan - Rp 25,000 (Completed, Low Risk)
2. **tx_2**: Alfamart - Rp 150,000 (Completed, Low Risk)
3. **tx_3**: Electronics Store - Rp 4,500,000 (RISK_HOLD, Risk Score 88)

## 🚦 Interactive Scenarios

### Scenario 1: Offline Payment Flow
1. Click WiFi icon → "OFFLINE MODE"
2. Navigate to User App tab
3. Click "Pay QRIS" button
4. See toast: "Payment Initiated Offline. Syncing later."
5. Click WiFi again → back to "ONLINE MODE"
6. Status updates and syncs

### Scenario 2: Fraud Detection & Approval
1. Go to Risk Console tab
2. See "High Risk Alert" with transaction tx_3
3. Review risk score: 88/100
4. Read AI analysis factors
5. Choose: "Approve & Release" or "Reject Transaction"

### Scenario 3: Account Lock (Admin Action)
1. In Risk Console, click "Lock Wallet (Freeze Funds)"
2. Notice button changes to red: "Unlock Wallet"
3. Switch to User App tab
4. See red overlay: "Account Locked - Verification required"
5. Return to Risk Console and unlock to restore

## 🔐 Security & Compliance Notes

This is a **demonstration prototype** only. For production deployment, implement:

⚠️ **Critical Security Requirements**:
- Real backend API with authentication
- Proper OAuth 2.0 / JWT token handling
- End-to-end encryption for sensitive data
- Encrypted database storage
- PCI DSS compliance
- KYC/AML verification procedures
- Rate limiting and attack prevention
- Regular security audits
- Data privacy compliance (GDPR/CCPA)

## 🎯 Extensibility

The architecture supports easy expansion:

1. **New Roles**: Add case to `DashboardSwitcher` in `page.tsx`
2. **New Features**: Add actions and state to `QunciContext`
3. **New Components**: Create in `src/components` and import
4. **Backend Integration**: Replace mock data with API calls

## 📞 Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion/
- **Recharts**: https://recharts.org/
- **React Documentation**: https://react.dev

## 📄 License

Demo/Educational Project - Free to modify and learn from.

---

**QunciPay - Modern Fintech Prototype**  
Built with ❤️ showcasing real-time fraud detection, multi-role interfaces, and offline payment capabilities.
