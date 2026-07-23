import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    generateOrderId,
    slugify,
    calculateDiscountedPrice,
    isSameVariant,
    formatDate,
    formatDateTime,
    truncateText,
    getStatusColor,
    isValidEmail,
    isValidPhone,
    sanitizeObject,
    parseId,
    isHexColor,
    getColorName,
} from '@/lib/utils';

// ─────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────
describe('formatCurrency', () => {
    it('formats a positive number as BDT currency', () => {
        expect(formatCurrency(1250)).toContain('1,250');
    });

    it('formats zero', () => {
        expect(formatCurrency(0)).toContain('0');
    });

    it('formats a large number', () => {
        expect(formatCurrency(999999)).toContain('999,999');
    });
});

// ─────────────────────────────────────────────
// generateOrderId
// ─────────────────────────────────────────────
describe('generateOrderId', () => {
    it('returns a string starting with ORD-', () => {
        expect(generateOrderId()).toMatch(/^ORD-/);
    });

    it('generates unique IDs on each call', () => {
        const id1 = generateOrderId();
        const id2 = generateOrderId();
        expect(id1).not.toBe(id2);
    });
});

// ─────────────────────────────────────────────
// slugify
// ─────────────────────────────────────────────
describe('slugify', () => {
    it('converts to lowercase and replaces spaces with dashes', () => {
        expect(slugify('New Product Name')).toBe('new-product-name');
    });

    it('removes special characters', () => {
        expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('trims leading and trailing spaces', () => {
        expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('collapses multiple dashes into one', () => {
        expect(slugify('A--B---C')).toBe('a-b-c');
    });

    it('handles an already valid slug', () => {
        expect(slugify('valid-slug')).toBe('valid-slug');
    });
});

// ─────────────────────────────────────────────
// calculateDiscountedPrice
// ─────────────────────────────────────────────
describe('calculateDiscountedPrice', () => {
    it('applies percentage discount correctly', () => {
        expect(calculateDiscountedPrice(1000, 10, 'percentage')).toBe(900);
    });

    it('applies flat discount correctly', () => {
        expect(calculateDiscountedPrice(1000, 150, 'flat')).toBe(850);
    });

    it('never returns a negative value (flat > mrp)', () => {
        expect(calculateDiscountedPrice(100, 200, 'flat')).toBe(0);
    });

    it('returns mrp when discountValue is 0', () => {
        expect(calculateDiscountedPrice(1000, 0)).toBe(1000);
    });

    it('returns mrp when discountValue is undefined/falsy', () => {
        expect(calculateDiscountedPrice(500, 0)).toBe(500);
    });

    it('defaults to percentage when no type is given', () => {
        // default type is 'percentage'
        expect(calculateDiscountedPrice(200, 50)).toBe(100);
    });
});

// ─────────────────────────────────────────────
// isSameVariant
// ─────────────────────────────────────────────
describe('isSameVariant', () => {
    it('returns true for identical variants', () => {
        expect(isSameVariant({ size: 'M' }, { size: 'M' })).toBe(true);
    });

    it('ignores the "tax" key when comparing', () => {
        expect(isSameVariant({ size: 'M', tax: 5 }, { size: 'M' })).toBe(true);
    });

    it('ignores the "colorCode" key when comparing', () => {
        expect(isSameVariant({ size: 'M', colorCode: '#FFF' }, { size: 'M' })).toBe(true);
    });

    it('returns false for different variants', () => {
        expect(isSameVariant({ size: 'M' }, { size: 'L' })).toBe(false);
    });

    it('returns true when both variants are null', () => {
        expect(isSameVariant(null, null)).toBe(true);
    });

    it('returns true when both variants are empty objects', () => {
        expect(isSameVariant({}, {})).toBe(true);
    });

    it('returns false when one variant is null and other is not', () => {
        expect(isSameVariant({ size: 'M' }, null)).toBe(false);
    });
});

// ─────────────────────────────────────────────
// truncateText
// ─────────────────────────────────────────────
describe('truncateText', () => {
    it('truncates when text exceeds maxLength', () => {
        expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('does not truncate when text is shorter than maxLength', () => {
        expect(truncateText('Hi', 10)).toBe('Hi');
    });

    it('returns empty string for null input', () => {
        expect(truncateText(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
        expect(truncateText(undefined)).toBe('');
    });
});

// ─────────────────────────────────────────────
// isValidEmail
// ─────────────────────────────────────────────
describe('isValidEmail', () => {
    it('returns true for a valid email', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('returns false for email with no @ symbol', () => {
        expect(isValidEmail('notanemail')).toBe(false);
    });

    it('returns false for email with no local part', () => {
        expect(isValidEmail('@domain.com')).toBe(false);
    });

    it('returns false for email with no domain', () => {
        expect(isValidEmail('user@')).toBe(false);
    });
});

// ─────────────────────────────────────────────
// isValidPhone
// ─────────────────────────────────────────────
describe('isValidPhone', () => {
    it('accepts a standard BD phone number (01X)', () => {
        expect(isValidPhone('01712345678')).toBe(true);
    });

    it('accepts phone with country code +880', () => {
        expect(isValidPhone('+8801712345678')).toBe(true);
    });

    it('accepts phone with country code 880', () => {
        expect(isValidPhone('8801712345678')).toBe(true);
    });

    it('rejects a short number', () => {
        expect(isValidPhone('12345')).toBe(false);
    });

    it('rejects a number with an invalid BD operator code (011)', () => {
        expect(isValidPhone('01112345678')).toBe(false);
    });
});

// ─────────────────────────────────────────────
// sanitizeObject
// ─────────────────────────────────────────────
describe('sanitizeObject', () => {
    it('removes null and empty string values', () => {
        const result = sanitizeObject({ a: 1, b: null, c: '', d: 0 });
        expect(result).toEqual({ a: 1, d: 0 });
    });

    it('keeps non-null/non-empty values', () => {
        const result = sanitizeObject({ x: 'hello', y: 42 });
        expect(result).toEqual({ x: 'hello', y: 42 });
    });
});

// ─────────────────────────────────────────────
// parseId
// ─────────────────────────────────────────────
describe('parseId', () => {
    it('returns the string as-is when given a string', () => {
        expect(parseId('abc123')).toBe('abc123');
    });

    it('returns null for null input', () => {
        expect(parseId(null)).toBe(null);
    });

    it('returns null for undefined input', () => {
        expect(parseId(undefined)).toBe(null);
    });

    it('calls toString on a document with object _id', () => {
        const mockDoc = { _id: { toString: () => 'objectid123' } };
        expect(parseId(mockDoc)).toBe('objectid123');
    });
});

// ─────────────────────────────────────────────
// isHexColor
// ─────────────────────────────────────────────
describe('isHexColor', () => {
    it('returns true for a 6-character hex', () => {
        expect(isHexColor('#FFFFFF')).toBe(true);
    });

    it('returns true for a 3-character hex', () => {
        expect(isHexColor('#FFF')).toBe(true);
    });

    it('returns true for lowercase hex', () => {
        expect(isHexColor('#ffffff')).toBe(true);
    });

    it('returns false for a named color', () => {
        expect(isHexColor('red')).toBe(false);
    });

    it('returns false for hex without #', () => {
        expect(isHexColor('FFFFFF')).toBe(false);
    });
});

// ─────────────────────────────────────────────
// getColorName
// ─────────────────────────────────────────────
describe('getColorName', () => {
    it('returns "Black" for #000000', () => {
        expect(getColorName('#000000')).toBe('Black');
    });

    it('returns "White" for #FFFFFF', () => {
        expect(getColorName('#FFFFFF')).toBe('White');
    });

    it('returns the raw color string if no mapping exists', () => {
        expect(getColorName('#123456')).toBe('#123456');
    });

    it('returns empty string for empty input', () => {
        expect(getColorName('')).toBe('');
    });

    it('returns the input as-is if it is not a hex color', () => {
        expect(getColorName('CustomColor')).toBe('CustomColor');
    });
});

// ─────────────────────────────────────────────
// getStatusColor
// ─────────────────────────────────────────────
describe('getStatusColor', () => {
    it('returns badge-warning for Pending', () => {
        expect(getStatusColor('Pending')).toBe('badge-warning');
    });

    it('returns badge-success for Delivered', () => {
        expect(getStatusColor('Delivered')).toBe('badge-success');
    });

    it('returns badge-danger for Cancelled', () => {
        expect(getStatusColor('Cancelled')).toBe('badge-danger');
    });

    it('returns badge-success for Paid', () => {
        expect(getStatusColor('Paid')).toBe('badge-success');
    });

    it('returns badge-gray as fallback for unknown status', () => {
        expect(getStatusColor('Unknown' as any)).toBe('badge-gray');
    });
});

// ─────────────────────────────────────────────
// formatDate
// ─────────────────────────────────────────────
describe('formatDate', () => {
    it('formats a date string into a readable format', () => {
        const result = formatDate('2024-01-15');
        expect(result).toContain('Jan');
        expect(result).toContain('15');
        expect(result).toContain('2024');
    });

    it('accepts a Date object', () => {
        const result = formatDate(new Date('2023-06-01'));
        expect(result).toContain('Jun');
    });
});
