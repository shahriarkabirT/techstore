'use client';

import React from 'react';
import { useGetPublicSettingsQuery, useGetAdminSettingsQuery, useGetGeneralSettingsQuery } from '@/redux/features/settings/settingsApi';

interface PrintableInvoiceProps {
    order: any;
}

export default function PrintableInvoice({ order }: PrintableInvoiceProps) {
    const { data: logoSettings } = useGetPublicSettingsQuery();
    const { data: contactSettings } = useGetAdminSettingsQuery();
    const { data: generalSettings } = useGetGeneralSettingsQuery();

    if (!order) return null;

    const settings = {
        ...logoSettings?.settings,
        ...contactSettings?.settings,
        ...generalSettings?.settings,
    };

    const storeName = settings?.brandName || 'Store';
    const storePhone = settings?.contactPhone || '';
    const storeEmail = settings?.contactEmail || '';
    const storeAddress = settings?.address || '';
    const logoUrl = settings?.logoUrl;

    const formatPrice = (price: number) => {
        return `৳${price.toLocaleString('en-BD')}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const cleanTitle = (title: string) => {
        if (!title.includes('(')) return title;
        const [baseTitle, variantPart] = title.split('(');
        if (!variantPart) return title;
        
        const cleanVariant = variantPart
            .replace(')', '')
            .split(',')
            .map(p => p.trim())
            .filter(p => !/^#([0-9A-F]{3}){1,2}$/i.test(p) && p !== '0')
            .join(', ');
            
        return cleanVariant ? `${baseTitle.trim()} (${cleanVariant})` : baseTitle.trim();
    };

    const getVariantString = (variant: any) => {
        if (!variant || typeof variant !== 'object') return '';
        return Object.entries(variant)
            .filter(
                ([k, v]) =>
                    !k.toLowerCase().includes('code') &&
                    ![
                        'tax', 'taxtype', '_id', 'sku', 'price', 'stock',
                        'images', 'inventoryref', 'order', 'mrp',
                        'discounttype', 'weight', 'discountvalue',
                    ].includes(k.toLowerCase()) &&
                    !(String(v).startsWith('#'))
            )
            .map(([k, v]) => {
                let label = k;
                if (k.toLowerCase() === 'colorname') label = 'Color';
                if (k.toLowerCase() === 'size') label = 'Size';
                if (k.toLowerCase() === 'material') label = 'Material';
                return `${label.charAt(0).toUpperCase() + label.slice(1)}: ${v}`;
            })
            .join(' | ');
    };

    const paymentMethodLabel = (method: string) => {
        switch (method) {
            case 'COD': return 'Cash on Delivery';
            case 'AamarPay': return 'Online Payment';
            case 'Cash': return 'Cash';
            case 'Card': return 'Card Payment';
            case 'Digital': return 'Digital Payment';
            default: return method;
        }
    };

    const handlePrint = () => {
        const fullLogoUrl = logoUrl ? `${window.location.origin}${logoUrl}` : '';

        // Build product rows
        const productRows = order.products.map((item: any, index: number) => {
            const variantStr = getVariantString(item.variant);
            const imageUrl = item.image 
                ? (item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image}`) 
                : '';
                
            return `
                <tr>
                    <td style="padding:10px 8px;text-align:center;color:#000;font-weight:600;border-bottom:1px solid #eee;font-size:13px;">${index + 1}</td>
                    <td style="padding:10px 8px;text-align:left;border-bottom:1px solid #eee;font-size:13px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            ${imageUrl ? `<img src="${imageUrl}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #eee;" alt="Product" />` : ''}
                            <div>
                                <span style="font-weight:600;color:#000;">${cleanTitle(item.title)}</span>
                                ${variantStr ? `<br><span style="font-size:11.5px;color:#000;">${variantStr}</span>` : ''}
                            </div>
                        </div>
                    </td>
                    <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #eee;font-size:13px;font-variant-numeric:tabular-nums;">${formatPrice(item.price)}</td>
                    <td style="padding:10px 8px;text-align:center;border-bottom:1px solid #eee;font-size:13px;font-weight:600;">${item.quantity}</td>
                    <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #eee;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;">${formatPrice(item.price * item.quantity)}</td>
                </tr>
            `;
        }).join('');

        // Build totals
        let totalsHtml = `
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#000;border-bottom:1px solid #f0f0f0;">
                <span>Subtotal</span><span style="font-weight:600;">${formatPrice(order.subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#000;border-bottom:1px solid #f0f0f0;">
                <span>Shipping</span><span style="font-weight:600;">${order.shippingCost === 0 ? '<span style="color:#16a34a;text-transform:uppercase;">Free</span>' : formatPrice(order.shippingCost)}</span>
            </div>
        `;

        if (order.taxAmount > 0) {
            totalsHtml += `
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#000;border-bottom:1px solid #f0f0f0;">
                    <span>Tax</span><span style="font-weight:600;">${formatPrice(order.taxAmount)}</span>
                </div>
            `;
        }

        if (order.discountAmount > 0) {
            totalsHtml += `
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#16a34a;border-bottom:1px solid #f0f0f0;">
                    <span>Discount ${order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span style="font-weight:600;">-${formatPrice(order.discountAmount)}</span>
                </div>
            `;
        }

        totalsHtml += `
            <div style="display:flex;justify-content:space-between;padding:8px 0 4px 0;font-size:17px;font-weight:900;color:#000;border-top:2px solid #000;margin-top:4px;letter-spacing:0.5px;">
                <span>TOTAL</span><span style="font-variant-numeric:tabular-nums;">${formatPrice(order.totalAmount)}</span>
            </div>
        `;

        // Notes section
        const notesHtml = order.customerInfo.notes ? `
            <div style="flex:1;max-width:50%;">
                <h4 style="font-size:11px;font-weight:800;letter-spacing:2px;color:#000;margin:0 0 4px 0;">ORDER NOTES</h4>
                <p style="font-size:12px;color:#000;font-style:italic;line-height:1.5;margin:0;padding:6px 8px;background:#fafafa;border-left:2px solid #ddd;">&ldquo;${order.customerInfo.notes}&rdquo;</p>
            </div>
        ` : '';

        const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #${order.orderId}</title>
    <style>
        @page { margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #000;
            background: #fff;
            padding: 12mm 14mm;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
            ${fullLogoUrl
                ? `<img src="${fullLogoUrl}" alt="${storeName}" style="max-height:48px;max-width:180px;object-fit:contain;margin-bottom:6px;" onload="window.__logoLoaded=true;" onerror="window.__logoLoaded=true;" />`
                : `<div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">${storeName}</div>`
            }
            ${storeAddress ? `<p style="font-size:12px;color:#000;margin:1px 0;line-height:1.4;">${storeAddress}</p>` : ''}
            ${storePhone ? `<p style="font-size:12px;color:#000;margin:1px 0;line-height:1.4;">Phone: ${storePhone}</p>` : ''}
            ${storeEmail ? `<p style="font-size:12px;color:#000;margin:1px 0;line-height:1.4;">Email: ${storeEmail}</p>` : ''}
        </div>
        <div style="flex:1;text-align:right;">
            <h1 style="font-size:34px;font-weight:900;letter-spacing:4px;color:#000;margin:0 0 10px 0;line-height:1;">INVOICE</h1>
            <div style="display:inline-block;text-align:left;">
                <div style="display:flex;gap:12px;margin-bottom:3px;font-size:12.5px;">
                    <span style="color:#000;font-weight:600;min-width:80px;text-align:right;">Invoice No.</span>
                    <span style="color:#000;font-weight:700;">#${order.orderId}</span>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:3px;font-size:12.5px;">
                    <span style="color:#000;font-weight:600;min-width:80px;text-align:right;">Date</span>
                    <span style="color:#000;font-weight:700;">${formatDate(order.createdAt)}</span>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:3px;font-size:12.5px;">
                    <span style="color:#000;font-weight:600;min-width:80px;text-align:right;">Payment</span>
                    <span style="color:#000;font-weight:700;">${paymentMethodLabel(order.paymentMethod)}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- DIVIDER -->
    <div style="height:2px;background:linear-gradient(to right,#000 0%,#000 40%,#ddd 40%,#ddd 100%);margin:16px 0;"></div>

    <!-- BILL TO -->
    <div style="display:flex;justify-content:space-between;gap:40px;margin-bottom:20px;">
        <div style="flex:1;">
            <h3 style="font-size:11px;font-weight:800;letter-spacing:2px;color:#000;margin:0 0 8px 0;padding-bottom:4px;border-bottom:1px solid #eee;text-transform:uppercase;">BILL TO</h3>
            <p style="font-size:16px;font-weight:700;color:#000;margin:0 0 3px 0;">${order.customerInfo.name}</p>
            <p style="font-size:12.5px;color:#000;margin:1px 0;line-height:1.5;">${order.customerInfo.phone}</p>
            ${order.customerInfo.email ? `<p style="font-size:12.5px;color:#000;margin:1px 0;line-height:1.5;">${order.customerInfo.email}</p>` : ''}
            <p style="font-size:12.5px;color:#000;margin:4px 0 1px 0;line-height:1.5;">${order.customerInfo.address}</p>
            ${order.customerInfo.city ? `<p style="font-size:12.5px;color:#000;margin:1px 0;line-height:1.5;">${order.customerInfo.city}</p>` : ''}
        </div>
    </div>

    <!-- ITEMS TABLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <thead>
            <tr>
                <th style="padding:8px 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#000;border-bottom:2px solid #000;width:30px;text-align:center;">#</th>
                <th style="padding:8px 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#000;border-bottom:2px solid #000;text-align:left;">Item Description</th>
                <th style="padding:8px 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#000;border-bottom:2px solid #000;width:90px;text-align:right;">Unit Price</th>
                <th style="padding:8px 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#000;border-bottom:2px solid #000;width:50px;text-align:center;">Qty</th>
                <th style="padding:8px 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#000;border-bottom:2px solid #000;width:100px;text-align:right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${productRows}
        </tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px;gap:40px;">
        ${notesHtml}
        <div style="width:220px;margin-left:auto;">
            ${totalsHtml}
        </div>
    </div>

    <!-- FOOTER -->
    <div style="margin-top:30px;text-align:center;">
        <div style="height:1px;background:#ddd;margin-bottom:12px;"></div>
        <p style="font-size:14px;font-weight:700;color:#000;margin:0 0 4px 0;">Thank you for your purchase!</p>
        <p style="font-size:11px;color:#000;margin:0 0 2px 0;">This is a computer-generated invoice and does not require a signature.</p>
        ${(storePhone || storeEmail) ? `<p style="font-size:11px;color:#000;margin:0;">For inquiries: ${storePhone}${storePhone && storeEmail ? ' | ' : ''}${storeEmail}</p>` : ''}
    </div>

    <script>
        function triggerPrint() {
            if (window.__printTriggered) return;
            window.__printTriggered = true;
            window.print();
        }

        // Check if logo is fully loaded before printing
        var checkLogo = setInterval(function() {
            var hasLogo = ${fullLogoUrl ? 'true' : 'false'};
            if (!hasLogo || window.__logoLoaded) {
                clearInterval(checkLogo);
                setTimeout(triggerPrint, 300);
            }
        }, 100);

        // Fallback timer just in case
        setTimeout(function() {
            clearInterval(checkLogo);
            triggerPrint();
        }, 2500);
        
        // Removed window.close() in onafterprint as it breaks Android Chrome's print spooler
    </script>
</body>
</html>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups for printing invoices.');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    return (
        <button
            onClick={handlePrint}
            className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            title="Print Invoice"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Print Invoice
        </button>
    );
}
