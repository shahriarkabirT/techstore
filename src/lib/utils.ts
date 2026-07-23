import { Document } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@/types';

/**
 * Format currency in BDT
 */
export function formatCurrency(amount: number, useSign: boolean = false): string {
    const formatted = new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    
    if (useSign) {
        // Replace BDT code with local sign and ensure spacing is collapsed
        return formatted.replace('BDT', '৳').replace(/\s+/g, '');
    }
    
    return formatted;
}

/**
 * Generate unique order ID
 */
export function generateOrderId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

/**
 * Generate slug from string
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Calculate discounted price
 */
export function calculateDiscountedPrice(mrp: number, discountValue: number, discountType: 'flat' | 'percentage' = 'percentage'): number {
    if (!discountValue || discountValue <= 0) return mrp;
    if (discountType === 'percentage') {
        return mrp - (mrp * discountValue) / 100;
    } else {
        return Math.max(0, mrp - discountValue);
    }
}

/**
 * Check if two variants are strictly the same, ignoring internal UI-only tags
 */
export function isSameVariant(var1?: Record<string, any> | null, var2?: Record<string, any> | null): boolean {
    const isVar1Empty = !var1 || Object.keys(var1).length === 0;
    const isVar2Empty = !var2 || Object.keys(var2).length === 0;

    // If both are empty (null, undefined, or {}), they match
    if (isVar1Empty && isVar2Empty) return true;

    // If only one is empty, they don't match
    if (isVar1Empty || isVar2Empty) return false;

    // Both exist and have properties, filter out ignored keys
    const ignoredKeys = ['colorCode', 'tax'];

    // Typescript assertion because we checked for null/undefined above
    const cleanVar1 = Object.fromEntries(Object.entries(var1 as Record<string, any>).filter(([k]) => !ignoredKeys.includes(k)));
    const cleanVar2 = Object.fromEntries(Object.entries(var2 as Record<string, any>).filter(([k]) => !ignoredKeys.includes(k)));

    const keys1 = Object.keys(cleanVar1).sort();
    const keys2 = Object.keys(cleanVar2).sort();

    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => cleanVar1[key] === cleanVar2[key]);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    };
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Truncate text
 */
export function truncateText(text: string | undefined | null, maxLength: number = 100): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
}

type StatusType = OrderStatus | PaymentStatus;

/**
 * Get status badge color class
 */
export function getStatusColor(status: StatusType): string {
    const colors: Record<string, string> = {
        // Order status
        Pending: 'badge-warning',
        Confirmed: 'badge-primary',
        Processing: 'badge-primary',
        Shipped: 'badge-primary',
        Delivered: 'badge-success',
        Cancelled: 'badge-danger',
        // Payment status
        Paid: 'badge-success',
        Failed: 'badge-danger',
        Refunded: 'badge-gray',
    };
    return colors[status] || 'badge-gray';
}

/**
 * Get human-readable description for order status (used for tooltips)
 */
export function getOrderStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
        Pending: 'User just made an order',
        Confirmed: 'Order Confirmed',
        Shipped: 'Parcel is sent to the courier service',
        Delivered: 'Order Delivered',
        'Partially Delivered': 'Parcel was delivered partially',
        Cancelled: 'The order was cancelled',
        Returned: 'Parcel is returned to the store',
    };
    return descriptions[status] || '';
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone (Bangladesh)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Sanitize object - remove undefined/null values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v != null && v !== '')
    ) as Partial<T>;
}

/**
 * Delay function for loading states
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface DocumentWithId {
    _id: { toString(): string } | string;
}

/**
 * Parse MongoDB ObjectId to string
 */
export function parseId(doc: DocumentWithId | string | null | undefined): string | null {
    if (!doc) return null;
    if (typeof doc === 'string') return doc;
    if (doc._id) return typeof doc._id === 'string' ? doc._id : doc._id.toString();
    return null;
}

/**
 * Convert Mongoose document to plain object
 */
export function toPlainObject<T>(doc: Document | T | null): T | null {
    if (!doc) return null;
    const obj = (doc as Document).toObject ? (doc as Document).toObject() : doc;
    return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Check if a string is a hex color code
 */
export function isHexColor(color: string): boolean {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

const COLOR_MAP: Record<string, string> = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#EF4444': 'Red',
    '#3B82F6': 'Blue',
    '#10B981': 'Green',
    '#6B7280': 'Gray',
    '#F59E0B': 'Amber',
    '#8B5CF6': 'Violet',
    '#EC4899': 'Pink',
    '#F97316': 'Orange',
    '#EAB308': 'Yellow',
    '#A855F7': 'Purple',
    '#D946EF': 'Fuchsia',
    '#06B6D4': 'Cyan',
    '#14B8A6': 'Teal',
};

/**
 * Get human readable color name from hex code
 */
export function getColorName(color: string): string {
    if (!color) return '';
    if (!isHexColor(color)) return color;
    const upper = color.toUpperCase();
    return COLOR_MAP[upper] || color;
}
