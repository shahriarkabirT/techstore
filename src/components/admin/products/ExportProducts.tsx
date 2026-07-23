'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ExportProductsProps {
    status?: string | null;
    search?: string | null;
    category?: string | null;
}

export default function ExportProducts({ status, search, category }: ExportProductsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch all products matching current filters but with a very high limit
            const params = new URLSearchParams();
            params.append('limit', '100000');
            
            if (status === 'published') params.append('active', 'true');
            if (status === 'draft') params.append('active', 'false');
            if (search) params.append('search', search);
            if (category) params.append('category', category);

            const { data } = await axios.get(`/api/products?${params.toString()}`);
            
            if (!data.success || !data.products || data.products.length === 0) {
                toast.error('No products found to export.');
                setIsExporting(false);
                return;
            }

            const products = data.products;

            // Generate CSV Content
            const headers = [
                'Product ID',
                'Title',
                'Slug',
                'Category',
                'SKU',
                'Status',
                'Product Type',
                'Base MRP',
                'Base Price',
                'Total Stock',
                'Variant Sku',
                'Variant Attributes',
                'Variant MRP',
                'Variant Price',
                'Variant Stock'
            ];

            const rows: string[][] = [];
            
            products.forEach((p: any) => {
                const baseInfo = [
                    p._id,
                    `"${(p.title || '').replace(/"/g, '""')}"`,
                    p.slug,
                    `"${(p.category?.name || 'Uncategorized').replace(/"/g, '""')}"`,
                    `"${(p.sku || '').replace(/"/g, '""')}"`,
                    p.isActive ? 'Published' : 'Draft',
                    p.productType,
                    p.mrp?.toString() || '0',
                    p.price?.toString() || '0',
                    p.stock?.toString() || '0'
                ];

                if (p.productType === 'variant' && p.variants && p.variants.length > 0) {
                    // One row per variant
                    p.variants.forEach((v: any) => {
                        rows.push([
                            ...baseInfo,
                            `"${(v.sku || '').replace(/"/g, '""')}"`,
                            `"${v.attributes ? Object.entries(v.attributes).map(([k, val]) => `${k}:${val}`).join(', ').replace(/"/g, '""') : ''}"`,
                            v.mrp?.toString() || '0',
                            v.price?.toString() || '0',
                            v.stock?.toString() || '0'
                        ]);
                    });
                } else {
                    // Standard single product row
                    rows.push([
                        ...baseInfo,
                        '', // Variant Sku
                        '', // Variant Attributes
                        '', // Variant MRP
                        '', // Variant Price
                        ''  // Variant Stock
                    ]);
                }
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Trigger Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export completed successfully');
        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Failed to export products');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
        </button>
    );
}
