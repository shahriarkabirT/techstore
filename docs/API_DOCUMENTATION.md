# Detailed API Documentation

## Module: `/api/admin`

### /api/admin/marketing/coupons

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, data: { coupons } }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  // JSON payload
}
```

**Response**:
```json
{ success: true, data: { coupon } }
```

---

### /api/admin/marketing/coupons/[id]

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, data: { coupon } }
```

---

#### Method: `PATCH`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "_id": "string",
  "id": "string"
}
```

**Response**:
```json
{ success: true, data: { coupon } }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, message: 'Coupon deleted successfully' }
```

---

### /api/admin/marketing/subscribers

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `page`
- `limit`

**Response**:
```json
{            success: true,
            data: {
                subscribers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        }
```

---

### /api/admin/marketing/subscribers/[id]

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, message: 'Subscriber deleted successfully' }
```

---

### /api/admin/messages

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `page`
- `limit`

**Response**:
```json
{            success: true,
            messages,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
```

---

#### Method: `PATCH`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "id": "string",
  "status": "string"
}
```

**Response**:
```json
{ success: true, message }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `id`

**Response**:
```json
{ success: true, message: 'Message deleted successfully' }
```

---

### /api/admin/reviews

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `page`
- `limit`

**Response**:
```json
{            success: true,
            reviews,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
```

---

#### Method: `PATCH`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "reviewId": "string",
  "isApproved": "string"
}
```

**Response**:
```json
{ success: true, review }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `id`

**Response**:
```json
{ success: true, message: 'Review deleted successfully' }
```

---

### /api/admin/settings/contact

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, settings: settings || {} }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "address": "string",
  "contactPhone": "string",
  "contactEmail": "string",
  "whatsapp": "string",
  "facebook": "string",
  "instagram": "string",
  "youtube": "string"
}
```

**Response**:
```json
{ success: true, settings }
```

---

### /api/admin/settings/general

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, settings }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "brandName": "string",
  "shippingCharge": "string"
}
```

**Response**:
```json
{ success: true, settings }
```

---

### /api/admin/settings/logo

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, settings: settings || {} }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "logoUrl": "string",
  "logoWidth": "string",
  "logoHeight": "string",
  "faviconUrl": "string"
}
```

**Response**:
```json
{ success: true, settings }
```

---

### /api/admin/settings/marketing

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, settings }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "facebookPixelId": "string",
  "googleTagManagerId": "string"
}
```

**Response**:
```json
{ success: true, settings }
```

---

### /api/admin/settings/otp

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, settings }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "emailOtpEnabled": "string",
  "smsOtpEnabled": "string",
  "smsApiKey": "string",
  "smsSenderId": "string",
  "smtpHost": "string",
  "smtpPort": "string",
  "smtpUser": "string",
  "smtpPass": "string",
  "smtpFrom": "string"
}
```

**Response**:
```json
{ success: true, settings }
```

---

### /api/admin/stats

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `endDate`
- `startDate`

**Response**:
```json
{            success: true,
            summary: {
                revenue: {
                    value: current.totalRevenue,
                    growth: calculateGrowth(current.totalRevenue, previous.totalRevenue)
                },
                orders: {
                    value: current.totalOrders,
                    growth: calculateGrowth(current.totalOrders, previous.totalOrders),
                    paid: current.paidOrders,
                    pending: current.pendingOrders
                },
                aov: {
                    value: current.totalOrders > 0 ? (current.totalRevenue / current.totalOrders) : 0,
                    growth: 0
                },
                users: {
                    value: totalUsers,
                    newUsers: periodUsers,
                    growth: calculateGrowth(periodUsers, prevPeriodUsers)
                }
            },
            charts: {
                dailySales: chartData.map(d => ({ date: d._id, revenue: d.revenue, count: d.count }))
            },
            topSelling: topSelling.map(p => ({
                _id: p._id,
                name: p.name,
                salesCount: p.salesCount,
                revenue: p.revenue
            })),
            topValued: topValued.map(p => ({
                _id: p._id,
                name: p.name,
                salesCount: p.salesCount,
                revenue: p.revenue
            })),
            recentOrders
        }
```

---

### /api/admin/subscribers/email

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "target": "string",
  "subject": "string",
  "message": "string",
  "productLink": "string"
}
```

**Response**:
```json
{            success: true,
            message: `Email campaign started for ${recipientEmails.length} subscriber(s). This will run in the background.`,
            summary: {
                totalTargeted: recipientEmails.length,
            }
        }
```

---

### /api/admin/testimonials

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, testimonials }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "quote": "string",
  "profilePicture": "string",
  "designation": "string",
  "isActive": "string",
  "order": "string"
}
```

**Response**:
```json
{ success: true, testimonial, message: 'Testimonial created successfully' }
```

---

### /api/admin/testimonials/[id]

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  // JSON payload
}
```

**Response**:
```json
{ success: true, testimonial, message: 'Testimonial updated successfully' }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, message: 'Testimonial deleted successfully' }
```

---

### /api/admin/users

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `page`
- `limit`
- `search`
- `role`

**Response**:
```json
{            success: true,
            users,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        }
```

---

### /api/admin/users/[id]

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, user }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "role": "string",
  "permissions": "string"
}
```

**Response**:
```json
{ success: true, message: 'User updated successfully', user }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{ success: true, message: 'User deleted successfully' }
```

---

## Module: `/api/auth`

### /api/auth/forgot-password

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "identifier": "string",
  "otpPreference": "string"
}
```

**Response**:
```json
{                success: true,
                message: otpPreference === 'sms'
                    ? 'If an account exists with this phone number, a reset code has been sent.'
                    : 'If an account exists with this email, a reset code has been sent.',
            }
```

---

### /api/auth/google

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: false, message: 'Google Client ID is missing' }
```

---

### /api/auth/google/callback

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `code`

**Response**:
```json
{ /* json response */ }
```

---

### /api/auth/login

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Login successful',
            user: userObj,
        }
```

---

### /api/auth/logout

#### Method: `POST`

**Authentication**: None

**Response**:
```json
{            success: true,
            message: 'Logged out successfully',
        }
```

---

### /api/auth/me

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            user,
        }
```

---

### /api/auth/refresh

#### Method: `POST`

**Authentication**: None

**Response**:
```json
{            success: true,
            message: 'Token refreshed successfully',
        }
```

---

### /api/auth/resend-otp

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "email": "string",
  "method": "string"
}
```

**Response**:
```json
{            success: true,
            message: `A new verification code has been sent to your ${method === 'sms' ? 'phone' : 'email'}.`,
            method,
        }
```

---

### /api/auth/reset-password

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "identifier": "string",
  "otp": "string",
  "newPassword": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.',
        }
```

---

### /api/auth/session-refresh

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `redirect_to`

**Response**:
```json
{ /* json response */ }
```

---

### /api/auth/signup

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "address": "string",
  "otpPreference": "string"
}
```

**Response**:
```json
{
                success: true,
                message: `Verification code sent to your ${method === 'sms' ? 'phone' : 'email'}. Please verify to complete registration.`,
                email: emailLower,
                requiresVerification: true,
                method,
            }
```

---

### /api/auth/verify-otp

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "email": "string",
  "otp": "string",
  "method": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Email verified successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        }
```

---

## Module: `/api/banners`

### /api/banners

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `active`

**Response**:
```json
{            success: true,
            banners,
        }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "title": "string",
  "subtitle": "string",
  "image": "string",
  "link": "string",
  "isActive": "string",
  "order": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Banner created successfully',
            banner,
        }
```

---

### /api/banners/[id]

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "title": "string",
  "subtitle": "string",
  "image": "string",
  "link": "string",
  "isActive": "string",
  "order": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Banner updated successfully',
            banner,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'Banner deleted successfully',
        }
```

---

## Module: `/api/categories`

### /api/categories

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `active`
- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `isActive`

**Response**:
```json
{            success: true,
            categories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "bannerImage": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Category created successfully',
            category,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "ids": "string"
}
```

**Response**:
```json
{            success: true,
            message: `${result.deletedCount} categories deleted successfully`,
        }
```

---

### /api/categories/[id]

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            category,
        }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "bannerImage": "string",
  "isActive": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Category updated successfully',
            category,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'Category deleted successfully',
        }
```

---

### /api/categories/tree

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            tree,
        }
```

---

## Module: `/api/chat`

### /api/chat/active

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `page`
- `limit`

**Response**:
```json
{ /* json response */ }
```

---

## Module: `/api/childcategories`

### /api/childcategories

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `subCategoryId`
- `active`
- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `isActive`

**Response**:
```json
{            success: true,
            childCategories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "subCategoryId": "string",
  "description": "string",
  "image": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'ChildCategory created successfully',
            childCategory,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "ids": "string"
}
```

**Response**:
```json
{            success: true,
            message: `${result.deletedCount} child categories deleted successfully`,
        }
```

---

### /api/childcategories/[id]

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            childCategory,
        }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "subCategoryId": "string",
  "description": "string",
  "image": "string",
  "isActive": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'ChildCategory updated successfully',
            childCategory,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'ChildCategory deleted successfully',
        }
```

---

## Module: `/api/contact`

### /api/contact

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "subject": "string",
  "message": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Your message has been sent successfully!',
            data: newMessage
        }
```

---

## Module: `/api/coupons`

### /api/coupons/validate

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "code": "string",
  "cartTotal": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Coupon applied successfully',
            data: {
                coupon,
                discount
            }
        }
```

---

## Module: `/api/couriers`

### /api/couriers

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, couriers }
```

---

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "name": "string",
  "isEnabled": "string",
  "config": "string"
}
```

**Response**:
```json
{ success: true, courier }
```

---

### /api/couriers/[name]/areas

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `post_code`
- `district_name`
- `apiKey`
- `isSandbox`
- `city_id`
- `zone_id`

**Response**:
```json
{ success: true, areas }
```

---

### /api/couriers/[name]/balance

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: false, message: `Courier service '${name}' not found` }
```

---

### /api/couriers/[name]/pickup-stores

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, pickup_stores }
```

---

### /api/couriers/[name]/recent-shipments

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `page`
- `limit`

**Response**:
```json
{            success: true,
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
```

---

### /api/couriers/[name]/stats

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, stats: formattedStats }
```

---

### /api/couriers/[name]/track

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `trackingId`

**Response**:
```json
{ success: false, message: error.message || 'Failed to fetch tracking details' }
```

---

## Module: `/api/newsletter`

### /api/newsletter/subscribe

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "email": "string"
}
```

**Response**:
```json
{ success: true, message: 'Subscribed successfully', data: { subscriber } }
```

---

## Module: `/api/orders`

### /api/orders

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Query Parameters**: 
- `status`
- `paymentStatus`
- `archived`
- `page`
- `limit`

**Response**:
```json
{            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }
```

---

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "customerInfo": "string",
  "items": "string",
  "paymentMethod": "string",
  "shippingCost": "string",
  "taxAmount": "string",
  "discountAmount": "string",
  "couponCode": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Order created successfully',
            order: {
                orderId: order.orderId,
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                _id: order._id,
            },
        }
```

---

### /api/orders/[id]

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            order,
        }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "orderStatus": "string",
  "paymentStatus": "string",
  "isArchived": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Order updated successfully',
            order,
        }
```

---

### /api/orders/[id]/send-to-courier

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "courierName": "string",
  "pickupStoreId": "string",
  "deliveryAreaId": "string",
  "deliveryAreaName": "string",
  "city_id": "string",
  "zone_id": "string",
  "isClosedBox": "string",
  "instruction": "string"
}
```

**Response**:
```json
{                success: true,
                message: result.message || 'Order successfully sent to courier',
                trackingId: result.trackingId
            }
```

---

### /api/orders/[id]/tracking

#### Method: `GET`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            status: result.status,
            history: result.history || []
        }
```

---

## Module: `/api/payment`

### /api/payment/cancel

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
FormData (Multipart/form-data)
```

**Response**:
```json
{ /* json response */ }
```

---

### /api/payment/fail

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
FormData (Multipart/form-data)
```

**Response**:
```json
{ /* json response */ }
```

---

### /api/payment/init

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "orderId": "string"
}
```

**Response**:
```json
{            success: true,
            paymentUrl: paymentResult.paymentUrl,
        }
```

---

### /api/payment/success

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
FormData (Multipart/form-data)
```

**Response**:
```json
{ /* json response */ }
```

---

## Module: `/api/products`

### /api/products

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `category`
- `search`
- `ids`
- `active`
- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `size`
- `color`
- `material`
- `minPrice`
- `maxPrice`

**Response**:
```json
{            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "title": "string",
  "mrp": "string",
  "price": "string",
  "discountType": "string",
  "discountValue": "string",
  "tax": "string",
  "stock": "string",
  "images": "string",
  "category": "string",
  "subCategory": "string",
  "childCategory": "string",
  "subChildCategory": "string",
  "shortDescription": "string",
  "fullDescription": "string",
  "variants": "string",
  "sku": "string",
  "tags": "string",
  "seoMetadata": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Product created successfully',
            product,
        }
```

---

### /api/products/[id]

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{                success: true,
                product: productObj,
            }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "title": "string",
  "mrp": "string",
  "price": "string",
  "discountType": "string",
  "discountValue": "string",
  "tax": "string",
  "stock": "string",
  "images": "string",
  "category": "string",
  "subCategory": "string",
  "childCategory": "string",
  "subChildCategory": "string",
  "shortDescription": "string",
  "fullDescription": "string",
  "variants": "string",
  "sku": "string",
  "tags": "string",
  "seoMetadata": "string",
  "isActive": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Product updated successfully',
            product,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'Product deleted successfully',
        }
```

---

### /api/products/bulk

#### Method: `DELETE`

**Authentication**: None

**Request Body**:
```json
{
  "ids": "string"
}
```

**Response**:
```json
{            success: true,
            message: `Successfully deleted ${result.deletedCount} products`,
        }
```

---

### /api/products/suggestions

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `q`

**Response**:
```json
{ success: true, products: [] }
```

---

## Module: `/api/reviews`

### /api/reviews

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `productId`

**Response**:
```json
{ success: true, reviews }
```

---

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "productId": "string",
  "rating": "string",
  "comment": "string",
  "images": "string"
}
```

**Response**:
```json
{ success: true, review }
```

---

## Module: `/api/settings`

### /api/settings/general

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{                success: true,
                settings: {
                    brandName: 'EcoStore',
                    shippingCharge: 60
                }
            }
```

---

### /api/settings/logo

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{                success: true,
                settings: {
                    logoUrl: '/logo.png', // Default fallback
                    logoWidth: 120,
                    logoHeight: 40
                }
            }
```

---

### /api/settings/otp

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            emailOtpEnabled: settings.emailOtpEnabled,
            smsOtpEnabled: settings.smsOtpEnabled,
        }
```

---

## Module: `/api/subcategories`

### /api/subcategories

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `categoryId`
- `active`
- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `isActive`

**Response**:
```json
{            success: true,
            subCategories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "categoryId": "string",
  "description": "string",
  "bannerImage": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'SubCategory created successfully',
            subCategory,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "ids": "string"
}
```

**Response**:
```json
{            success: true,
            message: `${result.deletedCount} subcategories deleted successfully`,
        }
```

---

### /api/subcategories/[id]

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            subCategory,
        }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "categoryId": "string",
  "description": "string",
  "bannerImage": "string",
  "isActive": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'SubCategory updated successfully',
            subCategory,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'SubCategory deleted successfully',
        }
```

---

## Module: `/api/subchildcategories`

### /api/subchildcategories

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `childCategoryId`
- `active`
- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `isActive`

**Response**:
```json
{            success: true,
            subChildCategories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "childCategoryId": "string",
  "description": "string",
  "image": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'SubChildCategory created successfully',
            subChildCategory,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "ids": "string"
}
```

**Response**:
```json
{            success: true,
            message: `${result.deletedCount} sub-child categories deleted successfully`,
        }
```

---

### /api/subchildcategories/[id]

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            subChildCategory,
        }
```

---

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "name": "string",
  "childCategoryId": "string",
  "description": "string",
  "image": "string",
  "isActive": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'SubChildCategory updated successfully',
            subChildCategory,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'SubChildCategory deleted successfully',
        }
```

---

## Module: `/api/testimonials`

### /api/testimonials

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, testimonials }
```

---

## Module: `/api/upload`

### /api/upload

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
FormData (Multipart/form-data)
```

**Response**:
```json
{            success: true,
            message: 'Image uploaded successfully',
            imageUrl,
        }
```

---

## Module: `/api/user`

### /api/user/cart

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            cart
        }
```

---

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "cart": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Cart synced successfully'
        }
```

---

### /api/user/orders

#### Method: `GET`

**Authentication**: None

**Query Parameters**: 
- `page`
- `limit`

**Response**:
```json
{            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }
```

---

### /api/user/profile

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            user,
        }
```

---

#### Method: `PUT`

**Authentication**: None

**Request Body**:
```json
{
  // JSON payload
}
```

**Response**:
```json
{            success: true,
            user,
            message: 'Profile updated successfully'
        }
```

---

### /api/user/wishlist

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{            success: true,
            wishlist: user?.wishlist || []
        }
```

---

#### Method: `POST`

**Authentication**: None

**Request Body**:
```json
{
  "productId": "string"
}
```

**Response**:
```json
{            success: true,
            wishlist: user.wishlist,
            message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist'
        }
```

---

## Module: `/api/variant-options`

### /api/variant-options

#### Method: `GET`

**Authentication**: None

**Response**:
```json
{ success: true, ...grouped }
```

---

#### Method: `POST`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "type": "string",
  "label": "string",
  "order": "string",
  "colorCode": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Variant option created',
            option,
        }
```

---

### /api/variant-options/[id]

#### Method: `PUT`

**Authentication**: Admin / Cookie (access_token)

**Request Body**:
```json
{
  "label": "string",
  "order": "string",
  "colorCode": "string"
}
```

**Response**:
```json
{            success: true,
            message: 'Option updated',
            option,
        }
```

---

#### Method: `DELETE`

**Authentication**: Admin / Cookie (access_token)

**Response**:
```json
{            success: true,
            message: 'Option deleted',
        }
```

---

