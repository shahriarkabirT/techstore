/**
 * AamarPay Payment Gateway Integration
 */
import env from '@/lib/env';

const AAMARPAY_STORE_ID = env.AAMARPAY_STORE_ID;
const AAMARPAY_SIGNATURE_KEY = env.AAMARPAY_SIGNATURE_KEY;
const AAMARPAY_API_URL = env.AAMARPAY_API_URL;
const AAMARPAY_VERIFY_URL = env.AAMARPAY_VERIFY_URL;
const BASE_URL = env.NEXT_PUBLIC_APP_URL;

export interface AamarPayOrderData {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerAddress: string;
    customerCity?: string;
}

export interface AamarPayInitResponse {
    success: boolean;
    paymentUrl?: string;
    error?: string;
}

export interface AamarPayVerifyResponse {
    success: boolean;
    status: string;
    transactionId?: string;
    amount?: number;
    paymentDetails?: Record<string, unknown>;
    error?: string;
}

interface AamarPayApiResponse {
    result: string;
    payment_url?: string;
    message?: string;
}

interface AamarPayVerifyApiResponse {
    pay_status: string;
    mer_txnid: string;
    amount: string;
    [key: string]: unknown;
}

/**
 * Initialize AamarPay payment
 */
export async function initAamarPayPayment(orderData: AamarPayOrderData): Promise<AamarPayInitResponse> {
    const {
        orderId,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerCity,
    } = orderData;

    const paymentData = {
        store_id: AAMARPAY_STORE_ID,
        signature_key: AAMARPAY_SIGNATURE_KEY,
        tran_id: orderId,
        amount: amount.toString(),
        currency: 'BDT',
        desc: `Order Payment - ${orderId}`,
        cus_name: customerName,
        cus_email: customerEmail || 'guest@example.com',
        cus_phone: customerPhone,
        cus_add1: customerAddress,
        cus_city: customerCity || 'Dhaka',
        cus_country: 'Bangladesh',
        success_url: `${BASE_URL}/api/payment/success`,
        fail_url: `${BASE_URL}/api/payment/fail`,
        cancel_url: `${BASE_URL}/api/payment/cancel`,
        type: 'json',
    };

    try {
        const response = await fetch(AAMARPAY_API_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        });

        const result: AamarPayApiResponse = await response.json();

        if (result.result === 'true' && result.payment_url) {
            return {
                success: true,
                paymentUrl: result.payment_url,
            };
        }

        return {
            success: false,
            error: result.message || 'Payment initialization failed',
        };
    } catch (error) {
        console.error('AamarPay Init Error:', error);
        return {
            success: false,
            error: 'Payment gateway error',
        };
    }
}

/**
 * Verify AamarPay payment
 */
export async function verifyAamarPayPayment(transactionId: string): Promise<AamarPayVerifyResponse> {
    try {
        const verifyUrl = `${AAMARPAY_VERIFY_URL}?request_id=${transactionId}&store_id=${AAMARPAY_STORE_ID}&signature_key=${AAMARPAY_SIGNATURE_KEY}&type=json`;

        const response = await fetch(verifyUrl);
        const result: AamarPayVerifyApiResponse = await response.json();

        if (result.pay_status === 'Successful') {
            return {
                success: true,
                status: 'Paid',
                transactionId: result.mer_txnid,
                amount: parseFloat(result.amount),
                paymentDetails: result,
            };
        }

        return {
            success: false,
            status: result.pay_status || 'Failed',
            paymentDetails: result,
        };
    } catch (error) {
        console.error('AamarPay Verify Error:', error);
        return {
            success: false,
            status: 'Failed',
            error: 'Verification failed',
        };
    }
}
