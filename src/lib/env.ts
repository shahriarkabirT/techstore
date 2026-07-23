
const env = {
    // Database
    MONGODB_URI: process.env.MONGODB_URI || '',

    // Authentication
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',

    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',

    // Google Auth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

    // Payment Gateway (AamarPay)
    AAMARPAY_STORE_ID: process.env.AAMARPAY_STORE_ID || '',
    AAMARPAY_SIGNATURE_KEY: process.env.AAMARPAY_SIGNATURE_KEY || '',
    AAMARPAY_API_URL: process.env.AAMARPAY_API_URL || '',
    AAMARPAY_VERIFY_URL: process.env.AAMARPAY_VERIFY_URL || '',

    // Email (SMTP)
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || '"No-Reply" <noreply@example.com>',

    // App
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
};

// Simple check for required variables in production
if (process.env.NODE_ENV === 'production') {
    const required = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

export default env;
