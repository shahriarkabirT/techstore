import { Document, Types } from 'mongoose';

export interface ISEOMetadata {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
}

export interface IVariant {
    _id: string;
    /** Dynamic attribute map: { "size": "M", "color": "Red", "screen-size": "6.5 inch" } */
    attributes?: Record<string, string>;
    /** Quick-access color code for storefront swatch rendering */
    colorCode?: string;
    // Legacy named fields (kept for backward compatibility)
    size?: string;
    colorName?: string;
    material?: string;
    ram?: string;
    storage?: string;
    mrp: number;
    price: number;
    /** Optional cost per unit for profit analytics */
    productCost?: number | null;
    discountType: 'flat' | 'percentage';
    discountValue: number;
    tax: number;
    taxType?: 'flat' | 'percentage';
    images: string[]; // Up to 5 variant images
    sku?: string;
    stock: number;
    weight?: number | null; // Weight in kg or grams
    inventoryRef?: string;
    order: number;
}

export interface IAttribute {
    _id: string;
    name: string;
    slug: string;
    type: 'text' | 'color';
    order: number;
    isActive: boolean;
    values?: IAttributeValue[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IAttributeValue {
    _id: string;
    attributeId: string;
    label: string;
    colorCode?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVariantOption {
    _id: string;
    type: 'size' | 'color' | 'material' | 'model';
    label: string;
    order: number;
    colorCode?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== Model Interfaces ====================

export interface IProduct {
    _id: string;
    title: string;
    slug: string;
    productType: 'single' | 'variant';
    mrp: number; // Mandatory
    price: number; // Selling price (calculated based on discount)
    /** Optional cost per unit (your purchase / landed cost) for profit reports */
    productCost?: number | null;
    discountType?: 'flat' | 'percentage';
    discountValue?: number;
    tax?: number;
    taxType?: 'flat' | 'percentage';
    weight?: number | null;
    stock: number; // Total stock
    images: string[];
    category: Types.ObjectId | ICategory;
    subCategory?: Types.ObjectId | ISubCategory;
    childCategory?: Types.ObjectId | IChildCategory;
    subChildCategory?: Types.ObjectId | ISubChildCategory;
    brand?: Types.ObjectId | IBrand;
    shortDescription?: string;
    fullDescription?: string;
    sizeGuide?: string;
    variants: IVariant[];
    sku?: string;
    tags: string[];
    compatibleModels?: string[];
    seoMetadata?: ISEOMetadata;
    averageRating: number;
    reviewCount: number;
    isActive: boolean;
    isFeatured?: boolean;
    freeShipping?: boolean;
    preorder?: boolean;
    discountedPrice?: number;
    soldCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IProductDocument extends Omit<IProduct, '_id' | 'category' | 'subCategory' | 'childCategory' | 'subChildCategory' | 'brand'>, Document {
    category: Types.ObjectId;
    subCategory?: Types.ObjectId;
    childCategory?: Types.ObjectId;
    subChildCategory?: Types.ObjectId;
    brand?: Types.ObjectId;
    discountedPrice: number;
}

export interface ICategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    bannerImage: string;
    metaTitle?: string;
    metaDescription?: string;
    order?: number;
    isActive: boolean;
    showToLandingPage?: boolean;
    level?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICategoryDocument extends Omit<ICategory, '_id'>, Document { }

export interface IBrand {
    _id: string;
    name: string;
    slug: string;
    logo: string;
    description?: string;
    order?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBrandDocument extends Omit<IBrand, '_id'>, Document { }

export interface IModelCategory {
    _id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IModelCategoryDocument extends Omit<IModelCategory, '_id'>, Document { }

export interface ICompatibleModel {
    _id: string;
    name: string;
    slug: string;
    category?: Types.ObjectId | IModelCategory;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICompatibleModelDocument extends Omit<ICompatibleModel, '_id'>, Document { }
export interface ISubCategory {
    _id: string;
    name: string;
    slug: string;
    categoryId: Types.ObjectId | ICategory;
    description?: string;
    bannerImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    isActive: boolean;
    order?: number;
    showToLandingPage?: boolean;
    showOnMid?: boolean;
    level?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISubCategoryDocument extends Omit<ISubCategory, '_id' | 'categoryId'>, Document {
    categoryId: Types.ObjectId;
}

export interface IChildCategory {
    _id: string;
    name: string;
    slug: string;
    subCategoryId: Types.ObjectId | ISubCategory;
    description?: string;
    image?: string;
    metaTitle?: string;
    metaDescription?: string;
    isActive: boolean;
    order?: number;
    showToLandingPage?: boolean;
    level?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChildCategoryDocument extends Omit<IChildCategory, '_id' | 'subCategoryId'>, Document {
    subCategoryId: Types.ObjectId;
}

export interface ISubChildCategory {
    _id: string;
    name: string;
    slug: string;
    childCategoryId: Types.ObjectId | IChildCategory;
    description?: string;
    image?: string;
    metaTitle?: string;
    metaDescription?: string;
    isActive: boolean;
    order?: number;
    showToLandingPage?: boolean;
    level?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISubChildCategoryDocument extends Omit<ISubChildCategory, '_id' | 'childCategoryId'>, Document {
    childCategoryId: Types.ObjectId;
}

export interface IOrderItem {
    productId: Types.ObjectId | string;
    title: string;
    price: number;
    quantity: number;
    /** Snapshot of unit cost at order time when product had productCost set */
    unitProductCost?: number | null;
    image?: string;
    variant?: Record<string, unknown>;
    tax?: number;
    taxType?: 'flat' | 'percentage';
    isPreorder?: boolean;
}

export interface ICustomerInfo {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
    notes?: string;
    deliveryLocation?: 'inside' | 'outside';
}

export type PaymentMethod = 'COD' | 'AamarPay' | 'Cash' | 'Card' | 'Digital';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Delivery Charge Paid';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Partially Delivered' | 'Cancelled' | 'Returned' | 'Blocked';

export interface IRefund {
    _id: string;
    orderId: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    reason: string;
    status: 'pending' | 'processing' | 'approved' | 'returned' | 'rejected';
    adminNotes?: string;
    courierReturn?: {
        courierName?: string;
        returnRequestId?: number;
        courierStatus?: string;
        sentAt?: Date;
        lastCheckedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IRefundDocument extends Omit<IRefund, '_id'>, Document { }

export interface ICashierInfo {
    name: string;
    id: string;
}

export interface IRefundDetails {
    reason?: string;
    restocked: boolean;
    refundedAt: Date;
}

export interface IOrder {
    _id: string;
    orderId: string;
    user?: Types.ObjectId | string;
    customerInfo: ICustomerInfo;
    products: IOrderItem[];
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    couponCode?: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    transactionId?: string;
    paymentDetails?: Record<string, unknown>;
    refundDetails?: IRefundDetails;
    isArchived?: boolean;
    source?: 'online' | 'pos' | 'landing';
    cashierInfo?: ICashierInfo;
    changeAmount?: number;
    amountTendered?: number;
    ipAddress?: string;
    isPreorder?: boolean;
    advancePaid?: number;
    advancePaymentMethod?: string;
    advancePaymentRef?: string;
    adminNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document { }

export interface IFraud {
    _id: string;
    phone: string;
    ip?: string;
    name?: string;
    status: 'flagged' | 'blocked';
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFraudDocument extends Omit<IFraud, '_id'>, Document { }

export type AdminRole = 'admin' | 'superadmin';

export interface IAdmin {
    _id: string;
    email: string;
    password: string;
    role: AdminRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAdminDocument extends Omit<IAdmin, '_id'>, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// ==================== User & Review Interfaces ====================

export interface IUser {
    _id: string;
    name: string;
    email: string;
    password?: string;
    image?: string;
    role: 'user' | 'admin' | 'moderator';
    permissions?: string[];
    provider: 'local' | 'google' | 'facebook';
    phone: string;
    address?: string;
    bio?: string;
    gender?: 'male' | 'female' | 'other' | '';
    dateOfBirth?: Date;
    emailVerified?: Date;
    isEmailVerified: boolean;
    phoneVerified?: Date;
    isPhoneVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    resetPasswordOTP?: string;
    resetPasswordExpires?: Date;
    lastOtpMethod?: 'email' | 'sms';
    dailyOtpSmsCount?: number;
    lastSmsOtpDate?: Date;
    addressBook: {
        name: string;
        phone: string;
        address: string;
        city: string;
        isDefault: boolean;
    }[];
    wishlist: (Types.ObjectId | string)[];
    cart: {
        productId: Types.ObjectId | string;
        quantity: number;
        variant?: Map<string, string>;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ISettings {
    _id?: string;
    emailOtpEnabled: boolean;
    smsOtpEnabled: boolean;
    smsApiKey?: string;
    smsSenderId?: string;
    logoUrl?: string;
    logoWidth?: number;
    logoHeight?: number;
    faviconUrl?: string;

    // SMTP Configuration
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;

    // Contact Info
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    brandName?: string;
    shippingChargeInsideDhaka?: number;
    shippingChargeOutsideDhaka?: number;
    // Marketing
    facebookPixelId?: string;
    googleTagManagerId?: string;
    tiktokPixelId?: string;
    
    // Social Auth
    googleClientId?: string;
    googleClientSecret?: string;
    
    // Notifications
    telegramBotToken?: string;
    telegramChatId?: string;
    
    // Integrations
    fraudBdApiKey?: string;
    
    // API
    apiSecret?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

export interface ISettingsDocument extends Omit<ISettings, '_id'>, Document { }

export interface ICoupon {
    _id: string;
    code: string;
    description?: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number; // For percentage discounts
    startDate: Date;
    expiryDate?: Date;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICouponDocument extends Omit<ICoupon, '_id'>, Document { }

export interface ISubscriber {
    _id: string;
    email: string;
    isActive: boolean;
    subscribedAt: Date;
}

export interface ISubscriberDocument extends Omit<ISubscriber, '_id'>, Document { }

export interface IContactMessage {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'pending' | 'read' | 'replied';
    createdAt: Date;
    updatedAt: Date;
}

export interface IContactMessageDocument extends Omit<IContactMessage, '_id'>, Document { }

export interface IUserDocument extends Omit<IUser, '_id'>, Document { }

export interface IReview {
    _id: string;
    productId: Types.ObjectId | string;
    userId?: Types.ObjectId | string;
    reviewerName?: string;
    reviewerAvatar?: string;
    rating: number;
    comment: string;
    images?: string[];
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReviewDocument extends Omit<IReview, '_id'>, Document { }

export interface IPolicy {
    _id: string;
    title: string;
    slug: string;
    content: string;
    isActive: boolean;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPolicyDocument extends Omit<IPolicy, '_id'>, Document { }

export interface IBanner {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    link?: string;
    position: 'primary' | 'secondary' | 'secondary-top' | 'secondary-bottom' | 'promotional-left' | 'promotional-right';
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBannerDocument extends Omit<IBanner, '_id'>, Document { }

export interface ITestimonial {
    _id: string;
    name: string;
    designation?: string;
    quote: string;
    profilePicture?: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITestimonialDocument extends Omit<ITestimonial, '_id'>, Document { }

export interface IStoreLocation {
    _id: string;
    title: string;
    address: string;
    businessHours: string;
    contact: string;
    mapLink?: string;
    image: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IStoreLocationDocument extends Omit<IStoreLocation, '_id'>, Document { }

// ==================== Meta Ads Config Interfaces ====================

export interface IMetaAdsConfig {
    _id?: string;
    accessToken: string;
    adAccountId: string;
    isEnabled: boolean;
    lastSyncedAt?: Date | null;
    cachedInsights?: any;
    cachedCampaigns?: any;
    cacheKey?: string;
    cacheExpiry?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMetaAdsConfigDocument extends Omit<IMetaAdsConfig, '_id'>, Document { }

// ==================== Courier Interfaces ====================

export interface ICourier {
    _id: string;
    name: 'redx' | 'steadfast' | 'pathao';
    isEnabled: boolean;
    config: Record<string, any>;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICourierDocument extends Omit<ICourier, '_id'>, Document { }

// ==================== Cart Types ====================

export interface CartItem {
    productId: string;
    title: string;
    price: number;
    originalPrice: number;
    discount: number;
    discountType?: string;
    tax: number;
    taxType?: 'flat' | 'percentage';
    image: string;
    quantity: number;
    stock: number;
    variant?: Record<string, string>;
    freeShipping?: boolean;
    isPreorder?: boolean;
}

export interface CartState {
    items: CartItem[];
    isLoading: boolean;
}

export type CartAction =
    | { type: 'INIT_CART'; payload: CartItem[] }
    | { type: 'ADD_ITEM'; payload: CartItem }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variant?: Record<string, string> } }
    | { type: 'CLEAR_CART' };

export interface CartContextType {
    items: CartItem[];
    isLoading: boolean;
    addToCart: (product: Partial<IProduct> & { _id?: string; productId?: string }, quantity?: number, variant?: Record<string, string>) => void;
    removeFromCart: (productId: string, variant?: Record<string, string>) => void;
    updateQuantity: (productId: string, quantity: number, variant?: Record<string, string>) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
    isInCart: (productId: string, variant?: Record<string, string>) => boolean;
}

// ==================== API Types ====================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface ProductsResponse {
    success: boolean;
    products: IProduct[];
    pagination: PaginationInfo;
}

export interface CategoriesResponse {
    success: boolean;
    categories: ICategory[];
}

export interface OrderResponse {
    success: boolean;
    order?: IOrder;
    message?: string;
}

export interface UserOrdersResponse {
    success: boolean;
    orders: IOrder[];
    pagination: PaginationInfo;
    message?: string;
}

export interface UsersResponse {
    success: boolean;
    users: IUser[];
    pagination: PaginationInfo;
}

// ==================== Component Props ====================

export interface ProductCardProps {
    product: IProduct;
}

export interface ImageUploadProps {
    value: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    allowMultiple?: boolean;
}

// ==================== Global Types ====================

declare global {
    var mongoose: {
        conn: typeof import('mongoose') | null;
        promise: Promise<typeof import('mongoose')> | null;
    } | undefined;
}
