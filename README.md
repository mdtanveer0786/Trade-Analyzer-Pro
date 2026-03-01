# 🚀 TradeAnalyzer Pro

**India's Most Advanced AI-Powered Trading Journal & Analytics SaaS**

TradeAnalyzer Pro is a high-performance, enterprise-grade trading journal designed for serious traders. It combines deep psychological analysis, real-time performance tracking, and OpenAI-driven insights to transform raw trade data into a strategic edge.

---

## ✨ Key Features

### 🖥️ High-Frequency Dashboard (Command Center)
- **Live Session Pulse**: Real-time tracking of today's P&L, Win Rate, and trade volume.
- **Performance Hub**: Toggle between Equity Curve and Execution Score (Psychology) visualizations.
- **Mindset Pulse**: Advanced behavioral analytics tracking discipline, focus, and confidence levels.
- **Strategy Breakdown**: Identification of your most profitable setups and market conditions.

### 🤖 AI-Powered Intelligence
- **Deep Analysis**: Automated OpenAI-driven trade reviews to identify recurring mistakes.
- **Pattern Detection**: Intelligent detection of emotional trading patterns (FOMO, Revenge Trading).
- **Pro Suggestions**: Data-backed suggestions on how to optimize your risk-to-reward ratio.

### 🛡️ Administrative Command Center (Admin Panel)
- **Operator Directory**: Full control over user accounts, roles, and subscription tiers.
- **Hard Delete Protocol**: Ability to permanently purge user data (Trades, AI, Profile) for compliance.
- **Protocol Overrides**: Instant role elevation (Admin/User/Premium) with system safeguards.
- **Global Broadcasts**: Transmit system-wide updates or maintenance alerts to all terminals.

### 💳 Monetization & Security
- **Razorpay Integration**: Seamless monthly and annual subscription management.
- **Feature Gating**: Tier-based access to advanced analytics and AI features.
- **JWT Security**: Bank-grade authentication with refresh token rotation.
- **Cloudinary Storage**: Secure, high-speed storage for trade screenshots and evidence.

---

## 🏗️ Technical Architecture

### **Frontend**
- **Framework**: React 18 + Vite (Ultra-fast HMR)
- **State & Data**: TanStack Query (v5) + Zustand
- **Styling**: Tailwind CSS + Framer Motion (Cyberpunk/Terminal Aesthetic)
- **Charts**: Recharts (High-performance SVG visualizations)

### **Backend**
- **Runtime**: Node.js + Express
- **Database**: MongoDB (Mongoose ODM)
- **AI Engine**: OpenAI API (GPT-4 Integration)
- **Communication**: Socket.io for real-time notifications
- **Payments**: Razorpay Node SDK

---

## 🚀 Installation & Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/mdtanveer0786/trade-analyzer-pro.git
cd trade-analyzer-pro
```

### **2. Backend Configuration**
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory using `.env.example` as a template:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_secret
OPENAI_API_KEY=your_key
RAZORPAY_KEY_ID=your_id
CLOUDINARY_URL=your_url
```
Start the server:
```bash
npm run dev
```

### **3. Frontend Configuration**
```bash
cd client
npm install
```
Start the development server:
```bash
npm run dev
```

---

## 🛡️ Admin Protocol

The Admin Panel is accessible only to users with the `admin` role. It includes critical safeguards:
- **Self-Demotion Block**: Admins cannot revoke their own access.
- **Final Admin Protection**: The system prevents the deletion of the last remaining admin to avoid total lockout.
- **Audit Logging**: Every administrative action (Role changes, Hard Deletes) is recorded in the `AdminLog`.

---

## 📄 License & Terms
TradeAnalyzer Pro is a proprietary SaaS application. Unauthorized distribution or reproduction is strictly prohibited.

---

**Developed for Traders, by Traders.**  
*TradeAnalyzer Pro — Master Your Mind, Master the Market.*
