# 📋 Project Quotation — E-Commerce Mobile Application (Customer App)

**Prepared for:** Client  
**Prepared by:** Cloudgen  
**Date:** March 29, 2026  
**Validity:** 30 days from issue date  
**Platform:** Android (Play Store) + iOS (App Store)

---

## 1. Project Overview

A premium, cross-platform **Customer-Facing Mobile Application** for an existing E-Commerce platform — built with React Native (Expo) and TypeScript. The app consumes the existing backend API and delivers a native shopping experience to Bangladeshi customers on both Android and iOS, with bilingual (English / বাংলা) support.

> **Note:** This quotation covers the **customer-side mobile app only**. The admin dashboard remains on the existing web application.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 53+) |
| Language | TypeScript |
| Navigation | Expo Router (File-based routing) |
| State Management | Redux Toolkit + RTK Query |
| Authentication | JWT (Bearer Token) + Secure Storage |
| Payment Gateway | SSLCommerz / AamarPay (WebView) + Cash on Delivery |
| Push Notifications | Expo Notifications (FCM + APNs) |
| Real-Time Chat | Socket.IO Client |
| UI Framework | React Native Paper + Reanimated |
| Image Handling | Expo Image (optimized caching) |
| Internationalization | i18next (EN + বাংলা) |
| Build & Deploy | EAS Build + EAS Submit |
| OTA Updates | EAS Update (instant JS updates without store review) |

---

## 3. Detailed Feature Breakdown & Pricing

### Module 1 — App Foundation & Setup

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 1.1 | **Project Architecture** | Expo project setup, file-based routing, SOLID folder structure, TypeScript configuration | 5,000 |
| 1.2 | **Design System & Theming** | Brand-consistent color palette, typography (Google Fonts), dark/light mode support, reusable UI components | 8,000 |
| 1.3 | **API Service Layer** | Axios instance with Bearer token auth, request/response interceptors, automatic token refresh, error handling | 6,000 |
| 1.4 | **Redux Store Setup** | Redux Toolkit store, RTK Query API slices for all endpoints, feature slices (cart, auth, settings) | 7,000 |
| 1.5 | **Secure Token Storage** | Encrypted local storage for JWT tokens (expo-secure-store), auto-login on app launch | 4,000 |
| 1.6 | **Backend API Adaptation** | Add Bearer token auth support to existing backend (alongside cookies), return tokens in response body, CORS setup | 5,000 |
| | | **Module 1 Subtotal** | **35,000** |

---

### Module 2 — User Authentication

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 2.1 | **Login Screen** | Email/password login with form validation, error handling, "Remember Me" functionality | 5,000 |
| 2.2 | **Registration Screen** | Multi-field signup (name, email, password, phone, address) with field validation | 6,000 |
| 2.3 | **OTP Verification Screen** | 6-digit OTP input with auto-focus, countdown timer, resend OTP (email/SMS toggle) | 7,000 |
| 2.4 | **Forgot Password Flow** | 3-step flow — enter email → verify OTP → set new password | 6,000 |
| 2.5 | **Google OAuth Login** | Native Google sign-in integration with expo-auth-session | 5,000 |
| 2.6 | **Auth State Persistence** | Auto-login on app restart, token refresh logic, graceful session expiry handling | 4,000 |
| | | **Module 2 Subtotal** | **33,000** |

---

### Module 3 — Home & Discovery

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 3.1 | **Home Screen** | Hero banner carousel (auto-scroll + swipe), featured products grid, category quick-links, testimonials section | 12,000 |
| 3.2 | **Category Browsing** | 4-level category tree navigation (Category → Sub → Child → Sub-Child) with animated drill-down | 8,000 |
| 3.3 | **Search with Suggestions** | Real-time search bar with auto-suggestions, recent searches, search results page | 7,000 |
| 3.4 | **Newsletter Subscription** | Email subscription prompt with validation | 2,000 |
| | | **Module 3 Subtotal** | **29,000** |

---

### Module 4 — Product Browsing & Detail

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 4.1 | **Product Listing Screen** | Grid/list toggle, infinite scroll pagination, sorting (price, date, popularity) | 8,000 |
| 4.2 | **Advanced Filters** | Bottom-sheet filter drawer — price range slider, size, color, material selection with instant apply | 10,000 |
| 4.3 | **Product Detail Screen** | Full-screen image gallery with pinch-zoom, variant selector (size/color/material), price breakdown (MRP/discount/tax) | 12,000 |
| 4.4 | **Product Descriptions** | Short description + rich HTML full description rendered natively | 4,000 |
| 4.5 | **Customer Reviews Display** | Star ratings, review list with images, review statistics summary | 5,000 |
| 4.6 | **Submit Review** | Star rating input, text comment, image upload from camera/gallery | 6,000 |
| 4.7 | **Related Products** | Horizontally scrollable related products carousel on detail page | 3,000 |
| | | **Module 4 Subtotal** | **48,000** |

---

### Module 5 — Shopping Cart

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 5.1 | **Cart Screen** | Add/remove items, quantity adjustment, variant-aware cart items, subtotal calculation | 8,000 |
| 5.2 | **Cart Badge** | Real-time item count badge on tab bar icon | 2,000 |
| 5.3 | **Cart Sync** | Server-synced cart for logged-in users, local cart for guests, merge on login | 6,000 |
| 5.4 | **Coupon Application** | Coupon code input with server validation, discount display (flat/percentage), error messages | 5,000 |
| | | **Module 5 Subtotal** | **21,000** |

---

### Module 6 — Checkout & Payment

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 6.1 | **Checkout Screen** | Customer info form (name, phone, email, address, city, notes), pre-filled for logged-in users | 8,000 |
| 6.2 | **Order Summary** | Itemized breakdown — subtotal, shipping, tax, discount, total amount | 4,000 |
| 6.3 | **Payment Method Selection** | Cash on Delivery (COD) toggle + Online Payment option | 3,000 |
| 6.4 | **Online Payment (WebView)** | SSLCommerz / AamarPay integration via secure in-app WebView with success/fail/cancel callbacks | 12,000 |
| 6.5 | **Order Confirmation Screen** | Post-order success screen with order ID, summary, and "Continue Shopping" / "View Order" actions | 5,000 |
| | | **Module 6 Subtotal** | **32,000** |

---

### Module 7 — Order Management (Customer)

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 7.1 | **Order History** | Paginated list of past orders with status badges (Pending/Confirmed/Shipped/Delivered/Cancelled) | 7,000 |
| 7.2 | **Order Detail Screen** | Full order breakdown — items, quantities, variants, prices, customer info, payment status | 6,000 |
| 7.3 | **Order Tracking** | Courier tracking status with timeline visualization, tracking ID display | 8,000 |
| | | **Module 7 Subtotal** | **21,000** |

---

### Module 8 — User Profile

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 8.1 | **Profile Screen** | View/edit name, phone, bio, gender, date of birth | 5,000 |
| 8.2 | **Profile Photo** | Upload/change profile image from camera or gallery | 4,000 |
| 8.3 | **Address Management** | Add/edit/delete multiple addresses, set default address | 6,000 |
| 8.4 | **Change Password** | Current password verification + new password with confirmation | 3,000 |
| 8.5 | **Logout** | Secure logout with token cleanup and confirmation dialog | 2,000 |
| | | **Module 8 Subtotal** | **20,000** |

---

### Module 9 — Wishlist

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 9.1 | **Wishlist Screen** | Grid view of saved products with remove action | 5,000 |
| 9.2 | **Add/Remove Toggle** | Heart icon toggle on product cards and detail page, server-synced | 4,000 |
| | | **Module 9 Subtotal** | **9,000** |

---

### Module 10 — Live Chat

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 10.1 | **Chat Screen** | Real-time Socket.IO chat with admin, message bubbles, timestamps | 10,000 |
| 10.2 | **Chat Initiation** | Floating chat button, name/phone prompt for guest users | 4,000 |
| 10.3 | **Message Persistence** | Chat history loaded from server on reconnect | 4,000 |
| | | **Module 10 Subtotal** | **18,000** |

---

### Module 11 — Notifications & Engagement

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 11.1 | **Push Notifications** | Firebase Cloud Messaging (Android) + APNs (iOS) setup via Expo Notifications | 8,000 |
| 11.2 | **Order Status Notifications** | Push alerts for order confirmed, shipped, delivered, cancelled | 5,000 |
| 11.3 | **Promotional Notifications** | Support for marketing push from admin panel | 4,000 |
| | | **Module 11 Subtotal** | **17,000** |

---

### Module 12 — Internationalization (i18n)

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 12.1 | **Bilingual Support** | Full English + বাংলা translation across all screens using i18next | 6,000 |
| 12.2 | **Language Switcher** | In-app language toggle with persistent preference | 3,000 |
| 12.3 | **RTL-Aware Layouts** | Proper text alignment and layout direction for Bangla content | 3,000 |
| | | **Module 12 Subtotal** | **12,000** |

---

### Module 13 — Contact & Support

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 13.1 | **Contact Form** | Name, email, phone, subject, message — submitted to admin dashboard | 4,000 |
| 13.2 | **Contact Info Display** | Store address, phone, email, social links from admin settings | 3,000 |
| | | **Module 13 Subtotal** | **7,000** |

---

### Module 14 — Polish & UX

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 14.1 | **Splash Screen** | Branded animated splash screen | 3,000 |
| 14.2 | **Loading Skeletons** | Shimmer/skeleton placeholders on all data-loading screens | 5,000 |
| 14.3 | **Pull-to-Refresh** | Native pull-to-refresh on all list screens | 2,000 |
| 14.4 | **Toast Notifications** | In-app success/error feedback messages | 2,000 |
| 14.5 | **Haptic Feedback** | Tactile feedback on key interactions (add to cart, like, purchase) | 2,000 |
| 14.6 | **Smooth Animations** | Page transitions, list animations, micro-interactions (Reanimated) | 5,000 |
| 14.7 | **Error Handling** | Network error screens, retry buttons, graceful offline state | 4,000 |
| 14.8 | **Deep Linking** | Open specific product/order from shared links or notifications | 5,000 |
| | | **Module 14 Subtotal** | **28,000** |

---

### Module 15 — App Store Deployment

| # | Feature | Description | Est. Cost (BDT) |
|---|---|---|---|
| 15.1 | **App Icon & Assets** | App icon (all sizes), adaptive icon (Android), store feature graphic | 3,000 |
| 15.2 | **Store Screenshots** | Professionally framed screenshots for Play Store and App Store listings | 4,000 |
| 15.3 | **Store Listing** | App title, description, keywords, category — optimized for ASO (App Store Optimization) | 3,000 |
| 15.4 | **Play Store Submission** | EAS Build → AAB → Google Play Console upload, review handling | 5,000 |
| 15.5 | **App Store Submission** | EAS Build → IPA → App Store Connect upload, review handling | 5,000 |
| 15.6 | **OTA Update Configuration** | EAS Update channel setup for instant JS-level updates without store review | 3,000 |
| | | **Module 15 Subtotal** | **23,000** |

---

## 4. Feature Count & Cost Summary

| Module | Features | Cost (BDT) |
|---|---|---|
| 1. App Foundation & Setup | 6 | 35,000 |
| 2. User Authentication | 6 | 33,000 |
| 3. Home & Discovery | 4 | 29,000 |
| 4. Product Browsing & Detail | 7 | 48,000 |
| 5. Shopping Cart | 4 | 21,000 |
| 6. Checkout & Payment | 5 | 32,000 |
| 7. Order Management | 3 | 21,000 |
| 8. User Profile | 5 | 20,000 |
| 9. Wishlist | 2 | 9,000 |
| 10. Live Chat | 3 | 18,000 |
| 11. Notifications & Engagement | 3 | 17,000 |
| 12. Internationalization (i18n) | 3 | 12,000 |
| 13. Contact & Support | 2 | 7,000 |
| 14. Polish & UX | 8 | 28,000 |
| 15. App Store Deployment | 6 | 23,000 |
| **Total** | **67** | **3,53,000** |

---

## 5. Deliverables

| # | Deliverable |
|---|---|
| 1 | Complete React Native (Expo) source code (Git repository) |
| 2 | Fully functional Android APK/AAB for Play Store |
| 3 | Fully functional iOS IPA for App Store |
| 4 | 67 customer-facing features across 15 modules |
| 5 | Play Store listing — published and live |
| 6 | App Store listing — published and live |
| 7 | OTA update pipeline for instant post-launch fixes |
| 8 | Backend API adaptations for mobile compatibility |
| 9 | Push notification infrastructure (FCM + APNs) |
| 10 | Bilingual app (English + বাংলা) |
| 11 | App Store Optimization (ASO) for both stores |

---

## 6. Timeline

| Phase | Duration | Modules Covered |
|---|---|---|
| Week 1 | Foundation | Modules 1, 2 (Setup + Auth) |
| Week 2 | Core Shopping | Modules 3, 4 (Home + Products) |
| Week 3 | Commerce | Modules 5, 6, 7 (Cart + Checkout + Orders) |
| Week 4 | Profile & Extras | Modules 8, 9, 10, 12, 13 (Profile + Wishlist + Chat + i18n + Contact) |
| Week 5 | Polish & Deploy | Modules 11, 14, 15 (Notifications + Polish + Store Submission) |
| **Total** | **5 Weeks** | **All 15 Modules** |

---

## 7. Payment Terms

| Milestone | Percentage | Amount (BDT) | Trigger |
|---|---|---|---|
| Project Kickoff | 30% | 1,05,900 | Upon contract signing |
| Mid-Delivery (Auth + Shopping flow working) | 30% | 1,05,900 | End of Week 3 |
| Final Delivery & Store Submission | 30% | 1,05,900 | End of Week 5 |
| Post-Launch Support (1 month) | 10% | 35,300 | After both stores go live |
| **Total** | **100%** | **3,53,000** | |

---

## 8. Post-Launch Support (Included)

| # | Support Item | Duration |
|---|---|---|
| 1 | Bug fixes & critical patches | 30 days |
| 2 | Store review rejection handling | Until approved |
| 3 | OTA emergency updates | 30 days |
| 4 | Minor UI adjustments | 30 days |

---

## 9. What's NOT Included

| # | Item | Notes |
|---|---|---|
| 1 | Apple Developer Account ($99/year) | Client responsibility |
| 2 | Google Play Developer Account ($25 one-time) | Client responsibility |
| 3 | Backend hosting & infrastructure | Already exists |
| 4 | Admin dashboard mobile app | Admin remains web-only |
| 5 | New backend features not in existing API | Quoted separately |
| 6 | Major redesigns after approval | Change requests quoted separately |

---

## 10. Notes

- The mobile app connects to the **existing backend API** — no database duplication
- Built with **SOLID principles** and scalable architecture (Redux Toolkit)
- **TypeScript** throughout for long-term maintainability
- **OTA Updates** via EAS allow pushing fixes **without store review** (JS-level changes)
- The app is designed to handle **mass user traffic** with RTK Query caching, request deduplication, and offline resilience
- All 67 features map directly to the existing 21+ backend API endpoints

---

> **Cloudgen** — Building scalable digital solutions
