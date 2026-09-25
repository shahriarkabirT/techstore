# Financial Architecture & Profit Calculation Guide

This document outlines how the application handles financial metrics, specifically detailing the separation of **Cost of Goods Sold (COGS)** from **Operational Expenses (OPEX)** to calculate accurate **Gross Profit** and **True Net Profit**.

---

## 1. Core Concepts

To maintain accurate accounting and provide meaningful business insights, the system separates costs into two distinct categories:

1. **Product-Specific Costs (COGS)**: The direct cost of purchasing or manufacturing the actual items you sell. 
2. **Operational Expenses (OPEX)**: The indirect costs of running the business (e.g., marketing, salaries, rent, bulk packaging).

---

## 2. Cost of Goods Sold (COGS)

**Where it lives**: `src/models/Product.ts` (and variants) & `src/models/Order.ts`.

### How it works:
1. **Definition**: In the admin panel, when creating or editing a Product (or a variant), you define a `productCost`. This is the unit cost (how much you paid your supplier for one unit).
2. **Snapshotting**: When a customer places an order, the system copies the current `productCost` into the `Order` line item.
   - *Why?* If your supplier raises their prices next month and you update the `productCost` on the product page, it **will not** overwrite your historical orders. Your historical profit margins remain 100% accurate.
3. **Calculation**: 
   - `Total Line COGS = (Order Line productCost) × (Quantity Sold)`
   - Only orders with a `paymentStatus` of `paid` (or similar successful statuses depending on aggregation config) are factored into realized profit.

---

## 3. Operational Expenses (OPEX)

**Where it lives**: `src/models/Expense.ts` & Admin Expenses Page (`/admin/expenses`).

### How it works:
Instead of trying to distribute overhead costs (like a ৳5,000 Facebook Ad run) across individual product margins, these are logged as standalone Operational Expenses.

**Expense Types:**
- **Single**: One-off operational costs (e.g., buying a software license or a domain name).
- **Bulk**: Bulk operational purchases not tied to a single SKU. Example: Printing 10,000 branded shipping boxes.
- **Overhead**: Recurring fixed costs (e.g., office rent, employee salaries, warehouse electricity).

**Expense Categories:**
Marketing, Office, Software, Packaging, Fulfillment, Other.

---

## 4. The Mathematical Flow

The system calculates your metrics in real-time using powerful MongoDB aggregation pipelines.

1. **Revenue (With Cost)**: The total sales revenue from products that *have* a `productCost` defined.
2. **Revenue (No Cost)**: The total sales revenue from products that *do not* have a `productCost` defined. (These do not contribute to Gross Profit).
3. **Total COGS**: The sum of all unit costs multiplied by quantities sold.
4. **Gross Profit**: `Revenue (With Cost) - Total COGS`
5. **Total OPEX**: Sum of all records in the `Expense` database within the timeframe.
6. **True Net Profit**: `Gross Profit - Total OPEX`

---

## 5. Aggregation Pipeline & API (`profitAggregation.ts` & `route.ts`)

### `aggregateProfitMetrics` & `aggregateProfitDaily`
Located in `src/lib/profitAggregation.ts`, these pipelines:
1. Filter the `Order` collection for valid, paid orders within the requested date range.
2. `$unwind` the order items array to look at each product individually.
3. Check if the line item has a `productCost`.
4. Calculate the line-level gross profit.
5. Group by either the entire date range (`aggregateProfitMetrics`) or by day/month (`aggregateProfitDaily`).

### The API Route (`src/app/api/admin/reports/profit/route.ts`)
1. Calls the `Order` aggregations to get the Gross Profit.
2. Queries the `Expense` collection for the same date range and groups them by day using `$dateToString`.
3. Merges the daily OPEX totals into the daily Gross Profit array using a JavaScript `Map`.
4. Calculates `netProfit = grossProfit - operationalExpenses` for both the grand summary and each individual day.
5. Returns the consolidated `mergedDaily` array to the frontend.

---

## 6. Frontend Dashboard (`/admin/reports/profit/page.tsx`)

The interactive Profit & Loss chart visualizes the merged data:
- **Green Line (Revenue)**: Total money coming in.
- **Red Line (COGS)**: Total money spent on the products sold.
- **Orange Line (OPEX)**: Total money spent running the business that day/month.
- **Blue/Indigo Line (Net Profit)**: The final take-home cash after subtracting COGS and OPEX from Revenue.

### Troubleshooting Missing Profit Data
- **High "Revenue (no cost)"**: If a large chunk of revenue is marked as "no cost", it means products are being sold without a `productCost` defined in their catalog settings. To fix this, edit the product and add the unit cost. New orders will capture it.
- **Net Profit is Negative**: You spent more on Operational Expenses (OPEX) and Product Costs (COGS) in that specific timeframe than you made in Revenue.
