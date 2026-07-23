# ecom_basic — Complete Function Testing Table

This document provides a comprehensive testing guide for every major function in the application. Use the **Pass/Fail** column to track results as you test.

---

## Section 1: Utility Functions (`src/lib/utils.ts`)

| ID | Function | Test Input | Expected Output | Pass/Fail |
|:---|:---------|:-----------|:----------------|:---------|
| U-01 | `formatCurrency` | `1250` | `৳1,250` (BDT formatted) | |
| U-02 | `formatCurrency` | `0` | `৳0` | |
| U-03 | `formatCurrency` | `999999` | `৳9,99,999` | |
| U-04 | `generateOrderId` | *(no input)* | String matching `ORD-XXXXX-XXXXXX` | |
| U-05 | `generateOrderId` | *(called twice)* | Two unique IDs | |
| U-06 | `slugify` | `"New Product Name!"` | `"new-product-name"` | |
| U-07 | `slugify` | `"  hello world  "` | `"hello-world"` (trimmed) | |
| U-08 | `slugify` | `"A--B---C"` | `"a-b-c"` (no double dashes) | |
| U-09 | `calculateDiscountedPrice` | `mrp:1000, val:10, type:'percentage'` | `900` | |
| U-10 | `calculateDiscountedPrice` | `mrp:1000, val:150, type:'flat'` | `850` | |
| U-11 | `calculateDiscountedPrice` | `mrp:100, val:200, type:'flat'` | `0` (no negatives) | |
| U-12 | `calculateDiscountedPrice` | `mrp:1000, val:0` | `1000` (no discount) | |
| U-13 | `isSameVariant` | `v1:{size:"M"}, v2:{size:"M"}` | `true` | |
| U-14 | `isSameVariant` | `v1:{size:"M", tax:5}, v2:{size:"M"}` | `true` (ignores 'tax') | |
| U-15 | `isSameVariant` | `v1:{size:"M"}, v2:{size:"L"}` | `false` | |
| U-16 | `isSameVariant` | `v1:null, v2:null` | `true` | |
| U-17 | `isSameVariant` | `v1:{size:"M"}, v2:null` | `false` | |
| U-18 | `truncateText` | `"Hello World", maxLen:5` | `"Hello..."` | |
| U-19 | `truncateText` | `"Hi", maxLen:10` | `"Hi"` (no truncation) | |
| U-20 | `truncateText` | `null, maxLen:10` | `""` | |
| U-21 | `isValidEmail` | `"test@example.com"` | `true` | |
| U-22 | `isValidEmail` | `"invalid-email"` | `false` | |
| U-23 | `isValidEmail` | `"@no-local.com"` | `false` | |
| U-24 | `isValidPhone` | `"01712345678"` | `true` | |
| U-25 | `isValidPhone` | `"+8801712345678"` | `true` | |
| U-26 | `isValidPhone` | `"12345"` | `false` | |
| U-27 | `sanitizeObject` | `{a:1, b:null, c:"", d:0}` | `{a:1, d:0}` (removes null & empty) | |
| U-28 | `parseId` | `"abc123"` | `"abc123"` | |
| U-29 | `parseId` | `null` | `null` | |
| U-30 | `isHexColor` | `"#FFFFFF"` | `true` | |
| U-31 | `isHexColor` | `"#FFF"` | `true` (3-char hex) | |
| U-32 | `isHexColor` | `"red"` | `false` | |
| U-33 | `getColorName` | `"#000000"` | `"Black"` | |
| U-34 | `getColorName` | `"#UNKNOWN"` | `"#UNKNOWN"` (passthrough) | |
| U-35 | `getStatusColor` | `"Delivered"` | `"badge-success"` | |
| U-36 | `getStatusColor` | `"Cancelled"` | `"badge-danger"` | |
| U-37 | `getStatusColor` | `"Unknown"` | `"badge-gray"` (fallback) | |

---

## Section 2: Input Validators (`src/lib/validators.ts`)

| ID | Function | Test Input | Expected Output | Pass/Fail |
|:---|:---------|:-----------|:----------------|:---------|
| V-01 | `validateEmail` | `"user@test.com"` | `{ valid: true }` | |
| V-02 | `validateEmail` | `""` | `{ valid: false, error: 'Email is required' }` | |
| V-03 | `validateEmail` | `"notanemail"` | `{ valid: false, error: 'Invalid email format' }` | |
| V-04 | `validatePhone` | `"01712345678"` | `{ valid: true }` | |
| V-05 | `validatePhone` | `null` | `{ valid: false, error: 'Phone number is required' }` | |
| V-06 | `validatePhone` | `"12345"` | `{ valid: false, error: 'Invalid phone number' }` | |
| V-07 | `validateRequired` | `"value", "Name"` | `{ valid: true }` | |
| V-08 | `validateRequired` | `"", "Name"` | `{ valid: false, error: 'Name is required' }` | |
| V-09 | `validateMinLength` | `"hello", 3, "Name"` | `{ valid: true }` | |
| V-10 | `validateMinLength` | `"hi", 5, "Name"` | `{ valid: false, error: 'Name must be at least 5 characters' }` | |
| V-11 | `validatePrice` | `100` | `{ valid: true }` | |
| V-12 | `validatePrice` | `-1` | `{ valid: false, error: 'Price must be a positive number' }` | |
| V-13 | `validatePrice` | `null` | `{ valid: false, error: 'Price is required' }` | |
| V-14 | `validateStock` | `10` | `{ valid: true }` | |
| V-15 | `validateStock` | `5.5` | `{ valid: false, error: 'Stock must be a non-negative integer' }` | |
| V-16 | `validateStock` | `-2` | `{ valid: false }` | |
| V-17 | `validateDiscount` | `50` | `{ valid: true }` | |
| V-18 | `validateDiscount` | `105` | `{ valid: false, error: 'Discount must be between 0 and 100' }` | |
| V-19 | `validateDiscount` | `""` | `{ valid: true }` (optional field) | | 
| V-20 | `validateCheckoutData` | Valid data with phone + address + COD | `{ valid: true, errors: {} }` | |
| V-21 | `validateCheckoutData` | Missing phone and address | `{ valid: false, errors: { phone: "...", address: "..." } }` | |
| V-22 | `validateCheckoutData` | Invalid payment method | `{ valid: false, errors: { paymentMethod: "..." } }` | |
| V-23 | `validateProductData` | `{ title: "Shirt", price: 500, stock: 10, category: "id" }` | `{ valid: true, errors: {} }` | |
| V-24 | `validateProductData` | `{ price: -1, stock: 0 }` | `{ valid: false, errors: { title: "...", price: "..." } }` | |

---

## Section 3: Auth Functions (`src/lib/auth.ts` & `src/lib/jwt.ts`)

| ID | Function | Test Input | Expected Output | Pass/Fail |
|:---|:---------|:-----------|:----------------|:---------|
| A-01 | `signAccessToken` | `{ id: "1", email: "a@b.com", role: "user" }` | Valid JWT string | |
| A-02 | `verifyAccessToken` | Valid JWT from A-01 | Returns decoded payload with `id`, `email`, `role` | |
| A-03 | `verifyAccessToken` | Expired/tampered JWT | Returns `null` | |
| A-04 | `signRefreshToken` | `{ id: "1", email: "a@b.com", role: "user" }` | Valid JWT string | |
| A-05 | `verifyRefreshToken` | Valid JWT from A-04 | Returns decoded payload | |
| A-06 | `generateToken` (admin) | `{ id: "1", email: "admin@b.com", role: "admin" }` | Valid JWT string | |
| A-07 | `verifyToken` (admin) | Valid token from A-06 | Returns decoded payload | |
| A-08 | `verifyToken` (admin) | Garbage string | Returns `null` | |
| A-09 | `hashPassword` | `"mypassword123"` | A bcrypt-hashed string (length ~60) | |
| A-10 | `comparePassword` | `"mypassword123"` vs hash from A-09 | `true` | |
| A-11 | `comparePassword` | `"wrongpassword"` vs hash from A-09 | `false` | |
| A-12 | `comparePassword` | `""` vs any hash | `false` (no crash) | |
| A-13 | `getAdminFromToken` | Request with valid `admin_token` cookie | Returns admin payload object | |
| A-14 | `getAdminFromToken` | Request with no cookies | Returns `null` | |

---

## Section 4: Redux Cart Slice (`src/redux/features/cart/`)

| ID | Action / Selector | Test Scenario | Expected State Change | Pass/Fail |
|:---|:-----------------|:--------------|:----------------------|:---------|
| C-01 | `addItem` | Add a new product | `items.length` increases by 1 | |
| C-02 | `addItem` | Add same product + same variant again | `item.quantity` increases, length unchanged | |
| C-03 | `addItem` | Add same product with different variant | New item added (length increases) | |
| C-04 | `removeItem` | Remove by productId + variant | Item removed from `items[]` | |
| C-05 | `removeItem` | Remove non-existent item | State unchanged, no crash | |
| C-06 | `updateQuantity` | Set quantity to 3 for existing item | `item.quantity === 3` | |
| C-07 | `clearCart` | Call on a non-empty cart | `items === []` | |
| C-08 | `setCart` | Dispatch with array of items | `items` is replaced with the new array | |
| C-09 | `initGuestCart` | localStorage has a saved cart JSON | `items` populated from localStorage | |

---

## Section 5: AamarPay Payment (`src/lib/aamarpay.ts`)

| ID | Function | Test Scenario | Expected Output | Pass/Fail |
|:---|:---------|:--------------|:----------------|:---------|
| P-01 | `initAamarPayPayment` | Valid order data | `{ success: true, paymentUrl: "https://..." }` | |
| P-02 | `initAamarPayPayment` | Invalid credentials (wrong store ID) | `{ success: false, error: "..." }` | |
| P-03 | `initAamarPayPayment` | Network failure (offline) | `{ success: false, error: 'Payment gateway error' }` | |
| P-04 | `verifyAamarPayPayment` | Valid successful transaction ID | `{ success: true, status: 'Paid', transactionId: "..." }` | |
| P-05 | `verifyAamarPayPayment` | Failed/pending transaction ID | `{ success: false, status: 'Failed/Pending' }` | |

---

## Section 6: API Endpoints — Auth

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-A01 | `/api/auth/register` | POST | `{ name, email, password }` | `201` + success message | |
| API-A02 | `/api/auth/register` | POST | Duplicate email | `409 Conflict` | |
| API-A03 | `/api/auth/login` | POST | Valid email + password | `200` + auth cookies set | |
| API-A04 | `/api/auth/login` | POST | Wrong password | `401 Unauthorized` | |
| API-A05 | `/api/auth/logout` | POST | Any request | `200` + cookies cleared | |
| API-A06 | `/api/auth/send-otp` | POST | Valid phone/email | `200` + OTP sent | |
| API-A07 | `/api/auth/verify-otp` | POST | Correct OTP code | `200` + account verified | |
| API-A08 | `/api/auth/verify-otp` | POST | Expired/wrong OTP | `400 Bad Request` | |
| API-A09 | `/api/auth/refresh` | POST | Valid refresh token cookie | `200` + new access token cookie | |
| API-A10 | `/api/auth/me` | GET | With valid auth cookie | `200` + user object | |
| API-A11 | `/api/auth/me` | GET | No cookies | `401 Unauthorized` | |

---

## Section 7: API Endpoints — Products

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-P01 | `/api/products` | GET | No filters | `200` + paginated product list | |
| API-P02 | `/api/products?category=X` | GET | Valid category ID | `200` + filtered products | |
| API-P03 | `/api/products?search=shirt` | GET | Search keyword | `200` + matched products | |
| API-P04 | `/api/products/[slug]` | GET | Valid product slug | `200` + product object | |
| API-P05 | `/api/products/[slug]` | GET | Non-existent slug | `404 Not Found` | |
| API-P06 | `/api/admin/products` | POST | Valid product data (admin auth) | `201` + created product | |
| API-P07 | `/api/admin/products` | POST | No admin auth | `401 Unauthorized` | |
| API-P08 | `/api/admin/products` | POST | Missing required title | `400 Bad Request` | |
| API-P09 | `/api/admin/products/[id]` | PUT | Updated title (admin auth) | `200` + updated product | |
| API-P10 | `/api/admin/products/[id]` | DELETE | Valid product ID (admin) | `200` + success | |

---

## Section 8: API Endpoints — Orders

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-O01 | `/api/orders` | POST | Valid order with COD | `201` + order object with `orderId` | |
| API-O02 | `/api/orders` | POST | Empty products array | `400 Bad Request` | |
| API-O03 | `/api/orders` | POST | Invalid phone number | `400 Validation error` | |
| API-O04 | `/api/orders` | GET | With user auth cookie | `200` + user's order list | |
| API-O05 | `/api/orders/[id]` | GET | Own order ID | `200` + full order object | |
| API-O06 | `/api/admin/orders` | GET | Admin auth | `200` + all orders list | |
| API-O07 | `/api/admin/orders/[id]` | PUT | `{ orderStatus: "Confirmed" }` | `200` + updated status | |
| API-O08 | `/api/admin/orders/[id]` | PUT | Invalid status string | `400 Bad Request` | |

---

## Section 9: API Endpoints — Coupons

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-COP01 | `/api/coupons` | POST | `{ code: "SAVE10", orderTotal: 500 }` | `200` + discount amount | |
| API-COP02 | `/api/coupons` | POST | Non-existent code | `404 Not Found` | |
| API-COP03 | `/api/coupons` | POST | Expired coupon code | `400 Coupon expired` | |
| API-COP04 | `/api/coupons` | POST | Order below `minOrderAmount` | `400 Minimum order required` | |
| API-COP05 | `/api/admin/coupons` | POST | New coupon (admin) | `201` + coupon object | |
| API-COP06 | `/api/admin/coupons/[id]` | DELETE | Admin auth | `200` + success | |

---

## Section 10: API Endpoints — Payment

| ID | Endpoint | Method | Test Scenario | Expected Response | Pass/Fail |
|:---|:---------|:-------|:--------------|:------------------|:---------|
| API-PAY01 | `/api/payment/initiate` | POST | Valid order + AamarPay | `200` + `{ paymentUrl }` | |
| API-PAY02 | `/api/payment/success` | GET | Valid callback from gateway | Redirects to `/order-confirmation` | |
| API-PAY03 | `/api/payment/fail` | GET | Payment declined callback | Redirects to `/payment?status=failed` | |
| API-PAY04 | `/api/payment/cancel` | GET | User cancelled callback | Redirects to `/checkout` | |

---

## Section 11: API Endpoints — Reviews

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-R01 | `/api/reviews?productId=X` | GET | Valid product ID | `200` + approved reviews | |
| API-R02 | `/api/reviews` | POST | `{ productId, rating:5, comment }` with auth | `201` + review (pending approval) | |
| API-R03 | `/api/reviews` | POST | No auth | `401 Unauthorized` | |
| API-R04 | `/api/reviews` | POST | Rating outside 1–5 | `400 Bad Request` | |
| API-R05 | `/api/admin/reviews` | GET | Admin auth | `200` + all reviews (approved & pending) | |
| API-R06 | `/api/admin/reviews/[id]` | PUT | `{ isApproved: true }` | `200` + review marked as approved | |

---

## Section 12: API Endpoints — Settings & Upload

| ID | Endpoint | Method | Test Scenario | Expected Response | Pass/Fail |
|:---|:---------|:-------|:--------------|:------------------|:---------|
| API-S01 | `/api/settings` | GET | Public request | `200` + logo, brand name, social links | |
| API-S02 | `/api/admin/settings/general` | PUT | `{ brandName, shippingCharge }` (admin) | `200` + updated settings | |
| API-S03 | `/api/admin/settings/logo` | PUT | `{ logoUrl, faviconUrl }` (admin) | `200` + updated logo | |
| API-S04 | `/api/admin/settings/otp` | PUT | `{ emailOtpEnabled:true, smsOtpEnabled:false }` | `200` + updated OTP config | |
| API-S05 | `/api/upload` | POST | Valid image file (`multipart/form-data`) | `200` + `{ url: "..." }` | |
| API-S06 | `/api/upload` | POST | File exceeds size limit | `413 Payload Too Large` | |

---

## Section 13: Category API Endpoints

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-CAT01 | `/api/categories` | GET | — | `200` + all active categories | |
| API-CAT02 | `/api/categories` | POST | `{ name, bannerImage }` (admin) | `201` + created category | |
| API-CAT03 | `/api/categories` | POST | Duplicate name | `409 Conflict` | |
| API-CAT04 | `/api/categories/[id]` | PUT | Updated name (admin) | `200` + updated category | |
| API-CAT05 | `/api/categories/[id]` | DELETE | Valid ID (admin) | `200` + success | |
| API-CAT06 | `/api/subcategories` | GET | — | `200` + all sub-categories | |
| API-CAT07 | `/api/childcategories` | GET | — | `200` + all child-categories | |
| API-CAT08 | `/api/subchildcategories` | GET | — | `200` + all sub-child-categories | |

---

## Section 14: Admin Dashboard Stats

| ID | Endpoint | Method | Test Scenario | Expected Response | Pass/Fail |
|:---|:---------|:-------|:--------------|:------------------|:---------|
| API-ST01 | `/api/admin/stats` | GET | Admin auth | `200` + `{ totalOrders, totalRevenue, totalUsers, recentOrders[] }` | |
| API-ST02 | `/api/admin/stats` | GET | No auth / user role | `401 Unauthorized` | |

---

## Section 15: User Profile API

| ID | Endpoint | Method | Test Input | Expected Response | Pass/Fail |
|:---|:---------|:-------|:-----------|:------------------|:---------|
| API-U01 | `/api/user/profile` | GET | Valid user auth | `200` + user profile object | |
| API-U02 | `/api/user/profile` | PUT | `{ name, bio, phone }` | `200` + updated profile | |
| API-U03 | `/api/user/address` | POST | New address object | `200` + updated addressBook | |
| API-U04 | `/api/user/cart` | GET | User auth | `200` + user's cloud cart | |
| API-U05 | `/api/user/cart` | PUT | New cart items array | `200` + merged/synced cart | |

---

## Testing Status Summary

| Section | Total Tests | Passed | Failed | Not Run |
|---------|-------------|--------|--------|---------|
| Utility Functions | 37 | | | |
| Input Validators | 24 | | | |
| Auth Functions | 14 | | | |
| Redux Cart Slice | 9 | | | |
| AamarPay Integration | 5 | | | |
| API: Auth | 11 | | | |
| API: Products | 10 | | | |
| API: Orders | 8 | | | |
| API: Coupons | 6 | | | |
| API: Payment | 4 | | | |
| API: Reviews | 6 | | | |
| API: Settings & Upload | 6 | | | |
| API: Categories | 8 | | | |
| API: Admin Stats | 2 | | | |
| API: User Profile | 5 | | | |
| **Total** | **155** | | | |
