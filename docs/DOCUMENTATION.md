# ecom_basic — Complete Project Documentation

> **Version**: 0.1.0 | **Stack**: Next.js 16 · TypeScript · MongoDB · Redux Toolkit · Socket.io
>
> 🧪 **Function Testing Table**: [TESTING_TABLE.md](./TESTING_TABLE.md)

---

## Table of Contents

1. [Requirement Analysis](#1-requirement-analysis)
2. [Technical Architecture](#2-technical-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Security](#5-authentication--security)
6. [API Reference](#6-api-reference)
7. [State Management (Redux)](#7-state-management-redux)
8. [Feature Breakdown](#8-feature-breakdown)
9. [Integrations](#9-integrations)
10. [Environment Variables](#10-environment-variables)
11. [Development Scripts](#11-development-scripts)

---

## 1. Requirement Analysis

### 1.1 Business Problem

A full-featured ecommerce platform for the Bangladesh market that supports:
- Multi-level product categorization (up to 4 levels deep)
- Product variants (color, size, material)
- Online payment via AamarPay (BDT currency)
- Courier logistics via Pathao, RedX, Steadfast
- OTP-based auth via Email and SMS (BD phone format)

### 1.2 Stakeholder Roles

| Role | Description |
|------|-------------|
| **Guest** | Browse products, add to cart (localStorage), checkout without login |
| **User** | Register/Login, manage profile, order history, wishlist, reviews |
| **Moderator** | Admin panel access limited by granular route permissions |
| **Admin / Super Admin** | Full access to all admin panel features |

### 1.3 Functional Requirements

#### Storefront (Customer-Facing)
- FR-01: Browse products by category (4-level hierarchy)
- FR-02: Filter and search products
- FR-03: View product details with image gallery and variant selection
- FR-04: Add to cart (persisted for guests in localStorage, synced on login)
- FR-05: Wishlist management
- FR-06: Product comparison (side-by-side)
- FR-07: Checkout with shipping validation (BD phone/address)
- FR-08: Apply coupons at checkout
- FR-09: Pay via Cash on Delivery (COD) or AamarPay (online)
- FR-10: Order confirmation with email notification
- FR-11: User registration via Email/Phone + OTP verification
- FR-12: Social login via Google OAuth
- FR-13: Order tracking from user profile
- FR-14: Leave reviews with star ratings and images
- FR-15: Live chat with store admin
- FR-16: Newsletter subscription
- FR-17: Contact form submission

#### Admin Dashboard
- FR-18: Full CRUD on Products, Categories, SubCategories, ChildCategories, SubChildCategories
- FR-19: Product variant management (per-variant pricing, stock, images)
- FR-20: Order lifecycle management (Pending → Confirmed → Processing → Shipped → Delivered → Cancelled)
- FR-21: Courier service activation and shipment creation (Pathao, RedX, Steadfast)
- FR-22: Coupon management (percentage and flat, with expiry and usage limits)
- FR-23: User management and moderator permission assignment
- FR-24: Review moderation (approve/reject)
- FR-25: Banner management for homepage
- FR-26: Testimonial management
- FR-27: Live chat support
- FR-28: Newsletter subscriber list export
- FR-29: Contact message inbox
- FR-30: Marketing: Facebook Pixel and Google Tag Manager integration
- FR-31: System Settings: Logo, SMTP, OTP, Brand Name, Shipping Charge, Social Links

### 1.4 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Scalability** | SOLID principles enforced. Redux + RTK Query for client-side caching. Mongoose indexes for heavy-query fields. |
| **Security** | JWT (Access + Refresh token pattern). bcrypt for passwords. OTP with daily SMS limits to prevent abuse. |
| **Performance** | RTK Query caching for API data. Next.js Server Components where possible. |
| **Availability** | Custom Express server (`src/server.ts`) integrating Next.js + Socket.io for real-time features. |
| **Maintainability** | Centralized env config (`src/lib/env.ts`). Shared validation library. Redux slices per feature. |

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 16 (App Router) |
| UI Language | TypeScript, TSX |
| Styling | Tailwind CSS v4, Vanilla CSS |
| State Management | Redux Toolkit + RTK Query |
| Backend | Node.js + Next.js API Routes |
| Custom Server | Express.js + Socket.io |
| Database | MongoDB (via Mongoose ODM) |
| Authentication | Custom JWT + NextAuth v4 (Google) |
| Payments | AamarPay API |
| Couriers | Pathao, RedX, Steadfast APIs |
| Email | Nodemailer (SMTP) |
| SMS | BD SMS Gateway (configurable) |
| Rate Limiting | Upstash Redis + Ratelimit |
| Rich Text | TipTap Editor |
| Charts | Recharts |
| PDF/Image Export | jsPDF, html2canvas |
| Real-time | Socket.io |

### 2.2 System Design

```
Browser
  │
  ├── Public Storefront (/app/(client)/)
  │     └── RTK Queries → Next.js API Routes → Mongoose → MongoDB
  │
  ├── Admin Dashboard (/app/(admin)/admin/)
  │     └── RTK Mutations → Next.js API Routes (admin verified) → Mongoose → MongoDB
  │
  └── Socket.io Client
        └── Custom Express Server (src/server.ts) → Socket.io Server
                                                   → Next.js Request Handler
```

### 2.3 Route Groups

| Route Group | Purpose |
|-------------|---------|
| `(client)` | Storefront pages (Home, Products, Cart, Checkout, Profile) |
| `(admin)` | Admin dashboard (protected, role-based) |
| `(auth)` | Login, Register, OTP verification pages |
| `api/` | Backend REST API handlers |

---

## 3. Folder Structure

```
ecom_basic/
├── docs/                       ← Project documentation (you are here)
├── public/                     ← Static assets
├── scripts/                    ← DB seeding and maintenance scripts
└── src/
    ├── app/
    │   ├── (admin)/admin/      ← Admin dashboard pages
    │   │   ├── banners/
    │   │   ├── categories/     ← Unified 4-level category manager
    │   │   ├── chat/
    │   │   ├── content/        ← Logo, Contact, General settings
    │   │   ├── couriers/
    │   │   ├── dashboard/
    │   │   ├── marketing/      ← Coupons, Subscribers, Pixel/GTM
    │   │   ├── messages/
    │   │   ├── orders/
    │   │   ├── otp-configuration/
    │   │   ├── products/
    │   │   ├── reviews/
    │   │   ├── testimonials/
    │   │   ├── users/
    │   │   ├── variant-management/
    │   │   └── layout.tsx      ← Admin sidebar + RBAC
    │   │
    │   ├── (auth)/             ← Login, Register, OTP pages
    │   ├── (client)/           ← Storefront pages
    │   │   ├── cart/
    │   │   ├── checkout/
    │   │   ├── contact/
    │   │   ├── order-confirmation/
    │   │   ├── payment/
    │   │   ├── products/
    │   │   ├── profile/
    │   │   ├── wishlist/
    │   │   └── page.tsx        ← Homepage
    │   │
    │   └── api/                ← Backend REST endpoints
    │       ├── admin/          ← Admin-only endpoints
    │       ├── auth/           ← Register, login, OTP, refresh
    │       ├── banners/
    │       ├── categories/
    │       ├── coupons/
    │       ├── couriers/       ← Shipment creation, tracking
    │       ├── orders/
    │       ├── payment/        ← AamarPay success/fail/cancel callbacks
    │       ├── products/
    │       ├── reviews/
    │       ├── settings/
    │       ├── upload/
    │       └── user/
    │
    ├── context/
    │   ├── AuthContext.tsx       ← User session, login/logout
    │   ├── CartContext.tsx       ← Cart sync (guest ↔ user)
    │   ├── AdminSocketContext.tsx← Unread chat count for admin
    │   ├── WishlistContext.tsx
    │   ├── ComparisonContext.tsx
    │   └── OptionsContext.tsx
    │
    ├── lib/
    │   ├── aamarpay.ts         ← Payment gateway integration
    │   ├── auth.ts             ← Token generation, password hashing, RBAC helpers
    │   ├── cookies.ts          ← Secure cookie helpers
    │   ├── couriers/           ← Courier factory (Pathao/RedX/Steadfast)
    │   ├── db.ts               ← Mongoose connection
    │   ├── email.ts            ← Nodemailer + OTP email templates
    │   ├── env.ts              ← Centralized environment variable access
    │   ├── jwt.ts              ← JWT sign/verify (access + refresh)
    │   ├── sms.ts              ← SMS OTP dispatching
    │   ├── token-verify.ts     ← Request-level token extraction
    │   ├── utils.ts            ← Pure utility functions
    │   └── validators.ts       ← Shared input validation functions
    │
    ├── models/                 ← 18 Mongoose schemas (see §4)
    ├── redux/
    │   ├── store.ts            ← Root Redux store
    │   ├── api/                ← RTK Query base API
    │   └── features/           ← 18 Redux slices (one per domain)
    └── types/                  ← Shared TypeScript interfaces
```

---

## 4. Database Schema

### 4.1 User

```
User {
  name: String (required)
  email: String (unique, required)
  password: String (required if provider='local')
  role: 'user' | 'admin' | 'moderator'     // RBAC
  permissions: [String]                    // Route-level for moderators
  phone: String? (sparse unique)
  image: String
  bio: String (max 500)
  gender: 'male' | 'female' | 'other'
  dateOfBirth: Date
  provider: 'local' | 'google' | 'facebook'
  isEmailVerified: Boolean
  isPhoneVerified: Boolean
  otp: String                              // for verification
  otpExpires: Date
  resetPasswordOTP: String
  resetPasswordExpires: Date
  dailyOtpSmsCount: Number                // rate-limit SMS OTPs
  addressBook: [{ name, phone, address, city, isDefault }]
  wishlist: [ObjectId → Product]
  cart: [{ productId, title, price, image, quantity, variant }]
  timestamps: true
}
```

### 4.2 Product

```
Product {
  title: String (required, max 200)
  slug: String (unique, auto-generated)
  productType: 'single' | 'variant'
  mrp: Number (required)                   // Maximum Retail Price
  price: Number (required)                 // Selling price
  discountType: 'flat' | 'percentage'
  discountValue: Number
  tax: Number
  weight: Number?
  stock: Number
  images: [String]
  category: ObjectId → Category (required)
  subCategory: ObjectId → SubCategory?
  childCategory: ObjectId → ChildCategory?
  subChildCategory: ObjectId → SubChildCategory?
  shortDescription: String (max 300)
  fullDescription: String (rich HTML)
  variants: [{
    size, colorName, colorCode, material,
    mrp, price, discountType, discountValue, tax,
    images, sku, stock, weight, inventoryRef, order
  }]
  sku: String
  tags: [String]
  seoMetadata: { metaTitle, metaDescription, keywords }
  averageRating: Number (0–5)
  reviewCount: Number
  isActive: Boolean
  // Virtual: discountedPrice
  // Indexes: text, category, isActive, price
}
```

### 4.3 Order

```
Order {
  orderId: String (unique, auto-generated as "ORD-XXXX-XXXX")
  user: ObjectId → User?            // null for guest orders
  customerInfo: { name, phone, email, address, city, notes }
  products: [{ productId, title, price, quantity, image, variant, tax }]
  subtotal: Number
  shippingCost: Number
  taxAmount: Number
  discountAmount: Number
  couponCode: String?
  totalAmount: Number
  paymentMethod: 'COD' | 'AamarPay'
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  transactionId: String
  paymentDetails: Mixed
  isArchived: Boolean
  // Indexes: orderStatus, paymentStatus, createdAt, customerInfo.phone
}
```

### 4.4 Category / SubCategory / ChildCategory / SubChildCategory

4-level category hierarchy. All share a similar schema:

```
Category {
  name: String (required, max 100)
  slug: String (unique)
  description: String (max 500)
  bannerImage: String (required)
  isActive: Boolean
  metaTitle: String
  metaDescription: String
}
SubCategory { ...same + parent: ObjectId → Category }
ChildCategory { ...same + parent: ObjectId → SubCategory }
SubChildCategory { ...same + parent: ObjectId → ChildCategory }
```

### 4.5 Coupon

```
Coupon {
  code: String (unique, uppercase)
  description: String
  discountType: 'percentage' | 'flat'
  discountValue: Number
  minOrderAmount: Number
  maxDiscountAmount: Number?      // cap for percentage discounts
  startDate: Date
  expiryDate: Date?
  usageLimit: Number?
  usedCount: Number
  isActive: Boolean
}
```

### 4.6 Review

```
Review {
  productId: ObjectId → Product (required)
  userId: ObjectId → User (required)
  rating: Number (1–5, required)
  comment: String (required, max 1000)
  images: [String]
  isApproved: Boolean   // admin moderation
}
```

### 4.7 Settings (Singleton)

```
Settings {
  // OTP
  emailOtpEnabled: Boolean
  smsOtpEnabled: Boolean
  smsApiKey: String
  smsSenderId: String
  // Logo
  logoUrl: String
  logoWidth: Number
  logoHeight: Number
  faviconUrl: String
  // SMTP
  smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom: String
  // Contact
  address, contactPhone, contactEmail, whatsapp: String
  // Social
  facebook, instagram, youtube: String
  // Marketing
  facebookPixelId: String
  googleTagManagerId: String
  // General
  brandName: String
  shippingCharge: Number (default: 60)
}
```

### 4.8 Courier

```
Courier {
  name: 'redx' | 'steadfast' | 'pathao'
  isEnabled: Boolean
  config: Mixed       // courier-specific API keys
  isAvailable: Boolean
}
```

### 4.9 Other Models

| Model | Key Fields |
|-------|-----------|
| **Banner** | `imageUrl`, `link`, `isActive`, `order` |
| **ChatSession** | `userId?`, `messages[]`, `isOpen`, `agentId?` |
| **ContactMessage** | `name`, `email`, `phone`, `message`, `isRead` |
| **Subscriber** | `email` (unique), `createdAt` |
| **Testimonial** | `name`, `role`, `quote`, `rating`, `avatar`, `isActive` |
| **VariantOption** | `name` (e.g. "Size"), `values[]` (reusable options) |
| **Admin** | `email`, `password`, `role` (legacy admin model) |

---

## 5. Authentication & Security

### 5.1 Token Strategy

The app uses a dual-token system for users and a legacy token for backwards compatibility with early admin routes:

| Token | Storage | Expiry | Secret |
|-------|---------|--------|--------|
| `access_token` (JWT) | HTTP-only cookie | 4 hours | `ACCESS_TOKEN_SECRET` |
| Refresh Token (JWT) | HTTP-only cookie | 7 days | `REFRESH_TOKEN_SECRET` |
| `admin_token` (legacy) | HTTP-only cookie | 7 days | `JWT_SECRET` |

**Payload**: `{ id, email, role, permissions[] }`

### 5.2 Auth Flows

#### Email/Password Registration
1. User submits form → `POST /api/auth/register`
2. Password hashed with bcrypt (salt rounds: 10)
3. OTP generated → sent via Email (or SMS if enabled)
4. User verifies OTP → Account activated
5. `access_token` + refresh token set as cookies

#### Google OAuth
- Handled via NextAuth v4 with Google provider
- On callback, user upserted in MongoDB

#### OTP Verification
- Daily SMS OTP limit tracked per user (`dailyOtpSmsCount`, `lastSmsOtpDate`)
- OTP expires after a short window (`otpExpires`)
- Supports both email and SMS delivery (admin-configurable in Settings)

#### Forgot Password
- User requests reset → OTP sent to email
- OTP verified → new password accepted

### 5.3 Admin RBAC

Two admin roles:
- **`admin`**: Full access to all admin panel routes
- **`moderator`**: Access limited to routes listed in `user.permissions[]`

Permissions are enforced at the `AdminLayout` sidebar level (routes filtered client-side) and should also be validated at the API route level.

---

## 6. API Reference

All APIs are Next.js Route Handlers under `src/app/api/`.

### 6.1 Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT cookies |
| POST | `/api/auth/logout` | Clears auth cookies |
| POST | `/api/auth/send-otp` | Send/resend OTP |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/forgot-password` | Initiate password reset |
| POST | `/api/auth/reset-password` | Submit new password |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user session |
| `[...nextauth]` | `/api/auth/*` | NextAuth Google OAuth routes |

### 6.2 Product Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products (filter, search, paginate) |
| GET | `/api/products/[slug]` | Get single product by slug |
| POST | `/api/admin/products` | Create product (admin) |
| PUT | `/api/admin/products/[id]` | Update product (admin) |
| DELETE | `/api/admin/products/[id]` | Delete product (admin) |

### 6.3 Category Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/categories` | List / Create categories |
| GET/PUT/DELETE | `/api/categories/[id]` | Single category CRUD |
| GET/POST | `/api/subcategories` | SubCategory operations |
| GET/POST | `/api/childcategories` | ChildCategory operations |
| GET/POST | `/api/subchildcategories` | SubChildCategory operations |

### 6.4 Order Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Place new order |
| GET | `/api/orders` | List user's own orders |
| GET | `/api/orders/[id]` | Get single order |
| GET | `/api/admin/orders` | List all orders (admin) |
| PUT | `/api/admin/orders/[id]` | Update order status (admin) |

### 6.5 Coupon Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/coupons` | Validate and apply coupon code |
| GET/POST/PUT/DELETE | `/api/admin/coupons` | Admin coupon CRUD |

### 6.6 Payment Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payment/initiate` | Initialize AamarPay payment |
| GET | `/api/payment/success` | AamarPay success callback |
| GET | `/api/payment/fail` | AamarPay failure callback |
| GET | `/api/payment/cancel` | AamarPay cancel callback |

### 6.7 Other Public Endpoints

| Path | Description |
|------|-------------|
| `/api/reviews` | Get/post product reviews |
| `/api/banners` | Get active banners |
| `/api/settings` | Get public settings (logo, brand name, etc.) |
| `/api/testimonials` | Get active testimonials |
| `/api/newsletter` | Subscribe to newsletter |
| `/api/contact` | Submit contact message |
| `/api/upload` | Image upload handler |

### 6.8 Admin-Only Endpoints (`/api/admin/`)

| Path | Description |
|------|-------------|
| `/api/admin/stats` | Dashboard statistics |
| `/api/admin/users` | User management |
| `/api/admin/reviews` | Review moderation (approve/delete) |
| `/api/admin/messages` | Contact message inbox |
| `/api/admin/subscribers` | Newsletter subscriber list |
| `/api/admin/testimonials` | Testimonial CRUD |
| `/api/admin/settings/*` | Logo, SMTP, OTP, Contact settings |
| `/api/admin/marketing/*` | Pixel/GTM settings |

---

## 7. State Management (Redux)

The Redux store is configured in `src/redux/store.ts`. All slices follow the same pattern: one slice per feature domain.

### 7.1 RTK Slices

| Slice | Key State Fields |
|-------|----------------|
| `cart` | `items[]`, `isLoading` |
| `wishlist` | `items[]` |
| `auth` | `user`, `isAuthenticated` |
| `product` | `selectedProduct`, `filters` |
| `categories` | `list`, `selected` |
| `orders` | `list`, `selectedOrder` |
| `coupon` | `appliedCoupon`, `discount` |
| `courier` | `selected`, `trackingData` |
| `chat` | `sessions[]`, `activeSession` |
| `settings` | `brandName`, `logoUrl`, etc. |
| `comparison` | `items[]` (up to 4 products) |
| `reviews` | `list`, `pagination` |
| `testimonial` | `list` |
| `banner` | `list` |
| `newsletter` | `isSubscribed` |
| `contact` | `status` |

### 7.2 Cart Persistence

- **Logged-in users**: Cart is stored in MongoDB (`User.cart`).
- **Guests**: Cart is persisted in `localStorage` via the `initGuestCart` action.
- On login, guest cart is merged with the user's saved cart.

---

## 8. Feature Breakdown

### 8.1 4-Level Category System

```
Category (Level 0)
  └── SubCategory (Level 1)
        └── ChildCategory (Level 2)
              └── SubChildCategory (Level 3)
```

Products can be assigned to any level. The admin panel uses a single unified page (`/admin/categories?level=0|1|2|3`) to manage all four levels.

### 8.2 Product Variants

Products are either:
- **Single**: One price/stock for the whole product.
- **Variant**: Multiple variants with independent pricing, stock, images, and SKU (e.g., S/M/L in Red/Blue).

Variants support a `discountType` (`flat` or `percentage`) independently of the parent product.

### 8.3 Order Lifecycle

```
Pending → Confirmed → Processing → Shipped → Delivered
       ↘                                  ↗
         Cancelled (from any state)
```

Payment status is tracked separately: `Pending → Paid | Failed | Refunded`.

### 8.4 Checkout Flow

1. User reviews cart (`/cart`)
2. Enters shipping details (`/checkout`)
3. Selects payment: COD or AamarPay
4. For COD: Order created directly → confirmation page
5. For AamarPay: Redirect to payment gateway → callback updates order → confirmation page

### 8.5 Courier Integration

- Factory pattern in `src/lib/couriers/` abstracts provider differences
- Admin can toggle each courier (RedX, Steadfast, Pathao) on/off
- Admin creates shipments from the Order detail page

### 8.6 Live Chat

- Socket.io-based real-time chat
- Admin sees an unread message badge in the sidebar (via `AdminSocketContext`)
- Customers initiate chat via the storefront
- Sessions stored in `ChatSession` model

### 8.7 Marketing & Analytics

- **Facebook Pixel**: Configured via admin settings, injected into `<head>` globally
- **Google Tag Manager**: Same mechanism, configurable GTM ID
- **Coupons**: Percentage or flat, with min order, max cap, usage limit, and expiry
- **Newsletter**: Email collection, admin can view subscriber list

---

## 9. Integrations

| Integration | Purpose | Config Location |
|-------------|---------|-----------------|
| **AamarPay** | Online payment in BDT | `src/lib/aamarpay.ts` + env vars |
| **Nodemailer** | OTP, order confirmation, and notification emails | `src/lib/email.ts` + Settings model (SMTP) |
| **SMS Gateway** | OTP via SMS for BD phone numbers | `src/lib/sms.ts` + Settings model |
| **Google OAuth** | Social sign-in | NextAuth config + env vars |
| **Pathao** | Courier shipments and tracking | `src/lib/couriers/pathao.ts` |
| **RedX** | Courier shipments | `src/lib/couriers/redx.ts` |
| **Steadfast** | Courier shipments | `src/lib/couriers/steadfast.ts` |
| **Upstash Redis** | Rate limiting for sensitive endpoints | `src/proxy.ts` |
| **Socket.io** | Live chat, real-time notifications | `src/server.ts` |

---

## 10. Environment Variables

Create a `.env` file in the root with the following:

```env
# Database
MONGODB_URI=mongodb+srv://...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Auth (User)
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_SECRET=your-admin-secret (legacy)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Default Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Payment (AamarPay)
AAMARPAY_STORE_ID=...
AAMARPAY_SIGNATURE_KEY=...
AAMARPAY_API_URL=https://secure.aamarpay.com/request.php
AAMARPAY_VERIFY_URL=https://secure.aamarpay.com/api/v1/trxcheck/request.php

# Email (SMTP — can also be configured via Admin Settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Your Store" <noreply@yourstore.com>

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

> **Note**: SMTP and OTP settings can also be managed at runtime via the Admin Panel → Settings, which override env vars.

---

## 11. Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Dev Server** | `npm run dev` | Starts `src/server.ts` (Express + Next.js + Socket.io) |
| **Build** | `npm run build` | Builds Next.js app + compiles TypeScript server |
| **Production** | `npm run start` | Runs compiled `dist/server.js` |
| **Lint** | `npm run lint` | Runs ESLint |
| **Seed DB** | `ts-node src/scripts/seed.ts` | Seeds the database with sample data |
