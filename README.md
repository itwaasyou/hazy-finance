# Hazy | Personal Finance Tracker

Hazy is a modern, privacy-focused personal finance and portfolio tracking application built with Next.js 16 and Firebase. It allows you to track investments, manage SIPs, and visualize your net worth with a premium, high-performance interface.

## 🚀 Features

- **Portfolio Management**: Track stocks, mutual funds, gold, and other assets.
- **SIP Tracker**: Manage your systematic investment plans and get reminders for upcoming payments.
- **Financial Analytics**: Deep dive into your income, expenses, and savings rate.
- **Family Accounts**: Support for family members with role-based access (Admin/Member).
- **Data Export**: Export your transaction history to CSV whenever you need.
- **Premium Design**: Dark mode interface with glassmorphism and smooth animations.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Database/Auth**: [Firebase](https://firebase.google.com/) (Firestore, Auth)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI Primitives](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- A Firebase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build

Create a production build:
```bash
npm run build
```

## 📄 License

MIT
