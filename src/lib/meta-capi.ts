import crypto from 'crypto';
import Settings from '@/models/Settings';

/**
 * Hash data using SHA-256 as required by Meta Conversions API
 */
export function hashData(data: string | undefined | null): string {
    if (!data) return '';
    return crypto
        .createHash('sha256')
        .update(data.trim().toLowerCase())
        .digest('hex');
}

export type CapiEventName = 'Purchase' | 'AddToCart' | 'InitiateCheckout' | 'ViewContent';

export interface CapiEventParams {
    eventName: CapiEventName;
    eventID: string;
    totalAmount?: number;
    currency?: string;
    orderId?: string;
    customerInfo?: {
        email?: string;
        phone?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        city?: string;
        externalId?: string;
        fbp?: string;
        fbc?: string;
    };
    products?: Array<{
        productId: string | number;
        quantity?: number;
        price?: number;
        name?: string;
        category?: string;
    }>;
    ipAddress?: string;
    userAgent?: string;
    sourceUrl?: string;
}

/**
 * Send a generic event to Meta Conversions API
 */
export async function sendCapiEvent(params: CapiEventParams) {
    try {
        // Fetch Pixel ID and Access Token from settings
        const settings = await Settings.findOne().lean();
        const pixelId = settings?.facebookPixelId;
        const accessToken = settings?.metaAccessToken || process.env.META_ACCESS_TOKEN;

        if (!pixelId || !accessToken) {
            console.warn('Meta CAPI: Missing Pixel ID or Access Token in settings.');
            return;
        }

        const { eventName, eventID, orderId, totalAmount = 0, currency = 'BDT', customerInfo, products = [], ipAddress, userAgent, sourceUrl } = params;

        // Prepare user data (hashed)
        const em = customerInfo?.email ? [hashData(customerInfo.email)] : [];
        const ph = customerInfo?.phone ? [hashData(customerInfo.phone)] : [];
        const externalIdFallback = customerInfo?.externalId || customerInfo?.email || customerInfo?.phone || eventID;
        
        const userData: any = {
            client_ip_address: ipAddress,
            client_user_agent: userAgent,
            external_id: [hashData(externalIdFallback)]
        };
        
        if (em.length > 0) userData.em = em;
        if (ph.length > 0) userData.ph = ph;
        if (customerInfo?.city) userData.ct = [hashData(customerInfo.city)];
        
        const fName = customerInfo?.firstName || (customerInfo?.name ? customerInfo.name.split(' ')[0] : undefined);
        const lName = customerInfo?.lastName || (customerInfo?.name && customerInfo.name.includes(' ') ? customerInfo.name.split(' ').slice(1).join(' ') : undefined);
        
        if (fName) userData.fn = [hashData(fName)];
        if (lName) userData.ln = [hashData(lName)];
        
        if (customerInfo?.fbp) userData.fbp = customerInfo.fbp;
        if (customerInfo?.fbc) userData.fbc = customerInfo.fbc;

        // Prepare custom data
        const customData: any = {
            content_type: 'product',
        };
        
        if (orderId) customData.order_id = orderId;
        if (totalAmount > 0) customData.value = totalAmount;
        if (totalAmount > 0) customData.currency = currency;
        
        if (products.length > 0) {
             customData.content_ids = products.map(p => String(p.productId));
             customData.contents = products.map(p => {
                 const item: any = {
                     id: String(p.productId),
                     quantity: p.quantity || 1,
                     item_price: p.price
                 };
                 if (p.name) item.item_name = p.name;
                 if (p.category) item.item_category = p.category;
                 return item;
             });
        }

        const payload: any = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: 'website',
                    event_id: eventID,
                    event_source_url: sourceUrl,
                    user_data: userData,
                    custom_data: customData,
                },
            ],
            test_event_code: process.env.NODE_ENV === "development" ? process.env.META_TEST_EVENT_CODE : undefined
        };

        const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Meta CAPI Fetch Error:', text);
            return;
        }

        const result = await response.json();

        if (result.error) {
            console.error('Meta CAPI Error:', JSON.stringify(result.error, null, 2));
        } else {
            console.log(`Meta CAPI Success: ${eventName} tracked for ${eventID} (${result.events_received} events received)`);
        }
    } catch (error) {
        console.error('Meta CAPI Exception:', error);
    }
}

export interface CapiPurchaseParams {
    eventID: string;
    orderId: string;
    totalAmount: number;
    currency?: string;
    customerInfo: {
        email?: string;
        phone?: string;
        name?: string;
        city?: string;
        fbp?: string;
        fbc?: string;
    };
    products: Array<{
        productId: string | number;
        quantity: number;
        price: number;
        name?: string;
    }>;
    ipAddress?: string;
    userAgent?: string;
    sourceUrl?: string;
}

/**
 * Legacy wrapper for Purchase event to maintain backward compatibility
 */
export async function sendCapiPurchase(params: CapiPurchaseParams) {
    return sendCapiEvent({
        ...params,
        eventName: 'Purchase'
    });
}
