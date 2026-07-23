import { describe, it, expect } from 'vitest';
import {
    validateEmail,
    validatePhone,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validatePrice,
    validateStock,
    validateDiscount,
    validateCheckoutData,
    validateProductData,
} from '@/lib/validators';

// ─────────────────────────────────────────────
// validateEmail
// ─────────────────────────────────────────────
describe('validateEmail', () => {
    it('returns valid for a correct email', () => {
        expect(validateEmail('user@example.com')).toEqual({ valid: true });
    });

    it('returns invalid for empty string', () => {
        const result = validateEmail('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Email is required');
    });

    it('returns invalid for null', () => {
        const result = validateEmail(null);
        expect(result.valid).toBe(false);
    });

    it('returns invalid for bad format', () => {
        const result = validateEmail('notanemail');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid email format');
    });
});

// ─────────────────────────────────────────────
// validatePhone
// ─────────────────────────────────────────────
describe('validatePhone', () => {
    it('returns valid for a correct BD phone', () => {
        expect(validatePhone('01712345678')).toEqual({ valid: true });
    });

    it('returns invalid for null', () => {
        const result = validatePhone(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Phone number is required');
    });

    it('returns invalid for short number', () => {
        const result = validatePhone('12345');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid phone number');
    });
});

// ─────────────────────────────────────────────
// validateRequired
// ─────────────────────────────────────────────
describe('validateRequired', () => {
    it('returns valid for a non-empty string', () => {
        expect(validateRequired('hello', 'Name')).toEqual({ valid: true });
    });

    it('returns invalid for empty string', () => {
        const result = validateRequired('', 'Name');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Name is required');
    });

    it('returns invalid for null', () => {
        const result = validateRequired(null, 'Field');
        expect(result.valid).toBe(false);
    });

    it('returns invalid for whitespace-only string', () => {
        const result = validateRequired('   ', 'Name');
        expect(result.valid).toBe(false);
    });
});

// ─────────────────────────────────────────────
// validateMinLength
// ─────────────────────────────────────────────
describe('validateMinLength', () => {
    it('passes when string meets minimum length', () => {
        expect(validateMinLength('hello', 3, 'Name')).toEqual({ valid: true });
    });

    it('fails when string is shorter than minimum', () => {
        const result = validateMinLength('hi', 5, 'Name');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Name must be at least 5 characters');
    });
});

// ─────────────────────────────────────────────
// validateMaxLength
// ─────────────────────────────────────────────
describe('validateMaxLength', () => {
    it('passes when string is within max length', () => {
        expect(validateMaxLength('hello', 10, 'Name')).toEqual({ valid: true });
    });

    it('fails when string exceeds max length', () => {
        const result = validateMaxLength('hello world', 5, 'Name');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Name must be less than 5 characters');
    });
});

// ─────────────────────────────────────────────
// validatePrice
// ─────────────────────────────────────────────
describe('validatePrice', () => {
    it('passes for a positive number', () => {
        expect(validatePrice(100)).toEqual({ valid: true });
    });

    it('passes for zero', () => {
        expect(validatePrice(0)).toEqual({ valid: true });
    });

    it('fails for a negative number', () => {
        const result = validatePrice(-1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Price must be a positive number');
    });

    it('fails for null', () => {
        const result = validatePrice(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Price is required');
    });

    it('fails for a non-numeric string', () => {
        const result = validatePrice('abc');
        expect(result.valid).toBe(false);
    });
});

// ─────────────────────────────────────────────
// validateStock
// ─────────────────────────────────────────────
describe('validateStock', () => {
    it('passes for a positive integer', () => {
        expect(validateStock(10)).toEqual({ valid: true });
    });

    it('passes for zero', () => {
        expect(validateStock(0)).toEqual({ valid: true });
    });

    it('fails for a float', () => {
        const result = validateStock(5.5);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Stock must be a non-negative integer');
    });

    it('fails for a negative integer', () => {
        const result = validateStock(-2);
        expect(result.valid).toBe(false);
    });

    it('fails for null', () => {
        const result = validateStock(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Stock is required');
    });
});

// ─────────────────────────────────────────────
// validateDiscount
// ─────────────────────────────────────────────
describe('validateDiscount', () => {
    it('passes for a valid percentage (50)', () => {
        expect(validateDiscount(50)).toEqual({ valid: true });
    });

    it('passes if discount is empty string (optional)', () => {
        expect(validateDiscount('')).toEqual({ valid: true });
    });

    it('passes if discount is null/undefined (optional)', () => {
        expect(validateDiscount(null)).toEqual({ valid: true });
    });

    it('fails for a value above 100', () => {
        const result = validateDiscount(105);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Discount must be between 0 and 100');
    });

    it('fails for a negative value', () => {
        const result = validateDiscount(-5);
        expect(result.valid).toBe(false);
    });
});

// ─────────────────────────────────────────────
// validateCheckoutData
// ─────────────────────────────────────────────
describe('validateCheckoutData', () => {
    const validData = {
        name: 'John Doe',
        phone: '01712345678',
        address: '123 Main St, Dhaka',
        paymentMethod: 'COD' as const,
    };

    it('returns valid for complete, correct data', () => {
        const result = validateCheckoutData(validData);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('fails when name is missing', () => {
        const result = validateCheckoutData({ ...validData, name: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.name).toBeDefined();
    });

    it('fails when phone is missing', () => {
        const result = validateCheckoutData({ ...validData, phone: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.phone).toBeDefined();
    });

    it('fails when address is missing', () => {
        const result = validateCheckoutData({ ...validData, address: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.address).toBeDefined();
    });

    it('fails for invalid payment method', () => {
        const result = validateCheckoutData({ ...validData, paymentMethod: 'Bitcoin' as any });
        expect(result.valid).toBe(false);
        expect(result.errors.paymentMethod).toBeDefined();
    });

    it('validates optional email if provided (bad format)', () => {
        const result = validateCheckoutData({ ...validData, email: 'notanemail' });
        expect(result.valid).toBe(false);
        expect(result.errors.email).toBeDefined();
    });

    it('skips email validation if not provided', () => {
        const result = validateCheckoutData({ ...validData });
        expect(result.errors.email).toBeUndefined();
    });
});

// ─────────────────────────────────────────────
// validateProductData
// ─────────────────────────────────────────────
describe('validateProductData', () => {
    const validProduct = {
        title: 'Test Shirt',
        price: 500,
        stock: 10,
        category: 'cat-id-123',
    };

    it('returns valid for complete, correct product data', () => {
        const result = validateProductData(validProduct);
        expect(result.valid).toBe(true);
    });

    it('fails when title is missing', () => {
        const result = validateProductData({ ...validProduct, title: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.title).toBeDefined();
    });

    it('fails when price is negative', () => {
        const result = validateProductData({ ...validProduct, price: -10 });
        expect(result.valid).toBe(false);
        expect(result.errors.price).toBeDefined();
    });

    it('fails when stock is a float', () => {
        const result = validateProductData({ ...validProduct, stock: 1.5 });
        expect(result.valid).toBe(false);
        expect(result.errors.stock).toBeDefined();
    });

    it('fails when category is missing', () => {
        const result = validateProductData({ ...validProduct, category: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.category).toBeDefined();
    });
});
