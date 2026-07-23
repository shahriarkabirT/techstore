# ecom_basic — Ecommerce Platform

A full-featured ecommerce platform built for the Bangladesh market, with online payments, courier logistics, live chat, and a complete admin dashboard.

> **Full Documentation**: [docs/DOCUMENTATION.md](./docs/DOCUMENTATION.md)

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local MongoDB)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ecom_basic
npm install
```

### 2. Configure Environment

Copy the environment variables template and fill in your values:

```bash
cp .env.example .env
```

Required variables:
```env
MONGODB_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-secret
JWT_SECRET=your-admin-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

See [docs/DOCUMENTATION.md#10-environment-variables](./docs/DOCUMENTATION.md#10-environment-variables) for the complete list.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront.  
Open [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) for the admin panel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| State | Redux Toolkit + RTK Query |
| Database | MongoDB (Mongoose ODM) |
| Auth | Custom JWT + NextAuth (Google) |
| Payments | AamarPay |
| Real-time | Socket.io |

---

## Key Features

- 🛒 Cart for guests (localStorage) and users (MongoDB)
- 📦 4-level category hierarchy
- 🎨 Product variants (color, size, material)
- 💳 COD and AamarPay online payment
- 🚚 Courier integrations (Pathao, RedX, Steadfast)
- 💬 Real-time live chat (Socket.io)
- 🔐 OTP verification via Email/SMS
- 👨‍💼 Role-based admin access (Admin / Moderator)
- 📊 Sales dashboard with charts

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/DOCUMENTATION.md](./docs/DOCUMENTATION.md) | Full project documentation incl. requirement analysis, architecture, DB schema, API reference |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
