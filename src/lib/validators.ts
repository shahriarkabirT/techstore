/**
 * Input Validation Functions
 */

import { PaymentMethod } from '@/types';

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export interface CheckoutData {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    paymentMethod?: PaymentMethod;
}

export interface ProductData {
    title?: string;
    price?: number | string;
    stock?: number | string;
    discount?: number | string;
    category?: string;
}

export interface ValidationErrors {
    [key: string]: string;
}

export interface CheckoutValidationResult {
    valid: boolean;
    errors: ValidationErrors;
}

export interface ProductValidationResult {
    valid: boolean;
    errors: ValidationErrors;
}

export function validateEmail(email: string | undefined | null): ValidationResult {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
}

export function validatePhone(phone: string | undefined | null): ValidationResult {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, error: 'Phone number is required' };
    }

    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return { valid: false, error: 'Invalid phone number' };
    }

    return { valid: true };
}

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
}

export function validateMinLength(value: unknown, minLength: number, fieldName: string): ValidationResult {
    if (typeof value !== 'string' || value.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }
    return { valid: true };
}

export function validateMaxLength(value: unknown, maxLength: number, fieldName: string): ValidationResult {
    if (typeof value === 'string' && value.length > maxLength) {
        return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
    }
    return { valid: true };
}

export function validatePrice(price: unknown): ValidationResult {
    if (price === undefined || price === null) {
        return { valid: false, error: 'Price is required' };
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
        return { valid: false, error: 'Price must be a positive number' };
    }

    return { valid: true };
}

export function validateStock(stock: unknown): ValidationResult {
    if (stock === undefined || stock === null) {
        return { valid: false, error: 'Stock is required' };
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
        return { valid: false, error: 'Stock must be a non-negative integer' };
    }

    return { valid: true };
}

export function validateDiscount(discount: unknown): ValidationResult {
    if (discount === undefined || discount === null || discount === '') {
        return { valid: true }; // Discount is optional
    }

    const numDiscount = Number(discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
        return { valid: false, error: 'Discount must be between 0 and 100' };
    }

    return { valid: true };
}

export function validateCheckoutData(data: CheckoutData): CheckoutValidationResult {
    const errors: ValidationErrors = {};

    // Customer info validation
    const nameValidation = validateRequired(data.name, 'Name');
    if (!nameValidation.valid) errors.name = nameValidation.error!;

    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) errors.phone = phoneValidation.error!;

    const addressValidation = validateRequired(data.address, 'Address');
    if (!addressValidation.valid) errors.address = addressValidation.error!;

    // Email is optional but validate format if provided
    if (data.email) {
        const emailValidation = validateEmail(data.email);
        if (!emailValidation.valid) errors.email = emailValidation.error!;
    }

    // Payment method validation
    if (!data.paymentMethod || !['COD', 'AamarPay'].includes(data.paymentMethod)) {
        errors.paymentMethod = 'Please select a valid payment method';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

export function validateProductData(data: ProductData): ProductValidationResult {
    const errors: ValidationErrors = {};

    const titleValidation = validateRequired(data.title, 'Title');
    if (!titleValidation.valid) errors.title = titleValidation.error!;

    const priceValidation = validatePrice(data.price);
    if (!priceValidation.valid) errors.price = priceValidation.error!;

    const stockValidation = validateStock(data.stock);
    if (!stockValidation.valid) errors.stock = stockValidation.error!;

    const discountValidation = validateDiscount(data.discount);
    if (!discountValidation.valid) errors.discount = discountValidation.error!;

    if (!data.category) {
        errors.category = 'Category is required';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}
