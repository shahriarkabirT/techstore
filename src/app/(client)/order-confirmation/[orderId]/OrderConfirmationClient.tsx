"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { runWhenFbqReady, trackPurchase } from "@/lib/gtm-datalayer";
import type { IOrder } from "@/types";

interface OrderConfirmationClientProps {
  order: IOrder;
  status?: string;
}

export default function OrderConfirmationClient({ order, status }: OrderConfirmationClientProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storageKey = `meta_pixel_purchase_${order.orderId}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      return;
    }

    const nameParts = (order.customerInfo.name || "").trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

    const contents = order.products.map((item) => ({
      id: String(item.productId),
      quantity: item.quantity,
      item_price: item.price,
      item_name: item.title,
    }));
    const content_ids = contents.map((c) => c.id);
    const num_items = order.products.reduce((sum, item) => sum + item.quantity, 0);

    const dispose = runWhenFbqReady(() => {
      try {
        if (sessionStorage.getItem(storageKey)) return;
      } catch {
        return;
      }

      trackPurchase(
        {
          content_ids,
          contents,
          value: order.totalAmount,
          currency: "BDT",
          num_items,
          shipping: order.shippingCost,
          eventID: `purchase_${order.orderId}`,
        },
        {
          email: order.customerInfo.email,
          phone: order.customerInfo.phone,
          firstName,
          lastName,
          city: order.customerInfo.city,
          country: "bd",
        },
      );

      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        /* ignore quota / private mode */
      }
    });

    return dispose;
  }, [order]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    const productsHTML = order.products
      .map(
        (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.quantity}</td>
                <td class="text-right">${formatPrice(item.price * item.quantity)}</td>
            </tr>
        `,
      )
      .join("");

    const paymentStatusText =
      order.paymentStatus === "Paid" ? "Paid" : "Pending";
    const paymentMethodText =
      order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Receipt - ${order.orderId}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 20px;
                    }
                    h1 {
                        margin: 0;
                        color: #111827;
                        font-size: 24px;
                    }
                    .subtitle {
                        color: #6b7280;
                        margin: 10px 0 0 0;
                    }
                    .section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        font-weight: bold;
                        font-size: 14px;
                        color: #111827;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .grid-item {
                        font-size: 13px;
                    }
                    .label {
                        color: #6b7280;
                        font-size: 12px;
                        margin-bottom: 5px;
                    }
                    .value {
                        font-weight: bold;
                        color: #111827;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th {
                        text-align: left;
                        padding: 10px;
                        border-bottom: 1px solid #e5e7eb;
                        font-weight: bold;
                        font-size: 13px;
                        color: #6b7280;
                    }
                    td {
                        padding: 10px;
                        border-bottom: 1px solid #f3f4f6;
                        font-size: 13px;
                    }
                    .total-row {
                        font-weight: bold;
                        border-top: 2px solid #e5e7eb;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .address-block {
                        font-size: 13px;
                        line-height: 1.6;
                        color: #374151;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 12px;
                        color: #6b7280;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✓ Order Confirmed</h1>
                        <p class="subtitle">${status === "success" ? "Payment Successful!" : "Order Placed Successfully!"}</p>
                    </div>

                    <div class="section">
                        <div class="section-title">Order Information</div>
                        <div class="grid">
                            <div class="grid-item">
                                <div class="label">Order ID</div>
                                <div class="value">${order.orderId}</div>
                            </div>
                            <div class="grid-item">
                                <div class="label">Order Date</div>
                                <div class="value">${formatDate(order.createdAt)}</div>
                            </div>
                            <div class="grid-item">
                                <div class="label">Payment Method</div>
                                <div class="value">${paymentMethodText}</div>
                            </div>
                            <div class="grid-item">
                                <div class="label">Payment Status</div>
                                <div class="value">${paymentStatusText}</div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Delivery Address</div>
                        <div class="address-block">
                            <strong>${order.customerInfo.name}</strong><br/>
                            ${order.customerInfo.phone}<br/>
                            ${order.customerInfo.address}<br/>
                            ${order.customerInfo.city || ""}
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Order Items</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th class="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHTML}
                                <tr>
                                    <td colspan="2">Subtotal</td>
                                    <td class="text-right">${formatPrice(order.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2">Shipping</td>
                                    <td class="text-right">${formatPrice(order.shippingCost)}</td>
                                </tr>
                                <tr class="total-row">
                                    <td colspan="2">Total</td>
                                    <td class="text-right">${formatPrice(order.totalAmount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="footer">
                        <p>Thank you for your order. We'll contact you soon to confirm delivery.</p>
                        <p style="margin-top: 10px; color: #9ca3af;">Document printed from ecommerce store</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-2xl">
        {/* Action Buttons - Hide on Print */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a60.773 60.773 0 0 1 9.56 0m-9.56 0c.41 6.042 5.9 10.674 12.24 10.674 6.34 0 11.83-4.632 12.24-10.674m0 0a60.773 60.773 0 0 1-9.56 0m0 0a6.556 6.556 0 0 1-12.24 0m12.24 0a6.556 6.556 0 0 0-12.24 0m0 0c.41-6.042 5.9-10.674 12.24-10.674 6.34 0 11.83 4.632 12.24 10.674"
              />
            </svg>
            Print Receipt
          </button>
        </div>

        {/* Order Confirmation Content */}
        <div ref={contentRef} className="card p-6 text-center rounded-2xl border-none shadow-sm">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-5 bg-success/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-success"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === "success"
              ? "Payment Successful!"
              : "Order Placed Successfully!"}
          </h1>
          <div className="mb-8">
            <p className="text-gray-600">
              Thank you for your order. We&apos;ll contact you soon to confirm
              delivery.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full font-bold text-sm">
              <span>Order ID:</span>
              <span className="tracking-wider">{order.orderId}</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Order ID</span>
                <p className="font-semibold text-gray-900">{order.orderId}</p>
              </div>
              <div>
                <span className="text-gray-500">Order Date</span>
                <p className="font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Payment Method</span>
                <p className="font-semibold text-gray-900">
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Payment Status</span>
                <p
                  className={`font-semibold ${order.paymentStatus === "Paid" ? "text-success" : "text-warning"}`}
                >
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="text-left mb-8">
            <h2 className="font-semibold text-gray-900 mb-3">
              Delivery Address
            </h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800">
                {order.customerInfo.name}
              </p>
              <p>{order.customerInfo.phone}</p>
              <p>{order.customerInfo.address}</p>
              {order.customerInfo.city && <p>{order.customerInfo.city}</p>}
            </div>
          </div>

          {/* Order Items */}
          <div className="text-left mb-8">
            <h2 className="font-semibold text-gray-900 mb-3">Order Items</h2>
            <div className="space-y-3">
              {order.products.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.title} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Hide on Print */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
            <Link href="/products" className="btn btn-primary">
              Continue Shopping
            </Link>
            <Link href="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
