# Courier Webhook Integration Guide

This document explains how to set up the webhooks for your courier services so that your order statuses (`Delivered` or `Cancelled`/`Returned`) sync automatically with your website's database.

## Overview
Webhooks are automated messages sent from apps when something happens. When a delivery status changes in the courier's app, they will instantly ping these dedicated URLs on your website to keep everything in sync.

> **Important:** In the URLs below, replace `yourdomain.com` with your actual live website domain (e.g., `gadget-ecom.com`).

---

## 1. Pathao

**Webhook URL:**
```
https://yourdomain.com/api/webhooks/pathao
```

**How to set up:**
1. Log in to your **Pathao Merchant Panel**.
2. Navigate to **Settings** (usually a gear icon).
3. Find the **API / Webhooks** section.
4. Add a new webhook.
5. Select **"Order Status Change"** (or similar) for the event type.
6. Paste your Webhook URL.
7. Save.

---

## 2. Steadfast

**Webhook URL:**
```
https://yourdomain.com/api/webhooks/steadfast
```

**How to set up:**
1. Log in to your **Steadfast Merchant Dashboard**.
2. Go to the **Developer / API Settings** section from the sidebar.
3. Look for the **"Webhook URL"** input field.
4. Paste your Webhook URL into the field.
5. Save changes.

---

## 3. RedX

**Webhook URL:**
```
https://yourdomain.com/api/webhooks/redx
```

**How to set up:**
1. Log in to your **RedX Merchant Portal**.
2. Click on your profile or navigate to **API Settings / Integrations**.
3. Locate the **Callback URL** or **Webhook URL** field.
4. Paste your Webhook URL into the field.
5. Save changes.

---

## How it works technically
- When the courier sends a payload to your endpoint, the system reads the `consignment_id` or `tracking_id`.
- It searches your database for an order that matches this tracking ID in its `paymentDetails.trackingId` field.
- If it finds a match and the new status is "delivered", it updates `orderStatus = 'Delivered'` and marks `paymentStatus = 'Paid'` (if it was a Cash On Delivery order).
- If the new status is "cancelled" or "returned", it updates `orderStatus = 'Cancelled'` or `'Returned'` and marks `paymentStatus = 'Failed'`.
