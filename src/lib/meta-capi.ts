import crypto from 'crypto';
import Settings from '@/models/Settings';

/**
 * Hash data using SHA-256 as required by Meta Conversions API
 */
function hashData(data: string | undefined | null): string {
    if (!data) return '';
    return crypto
        .createHash('sha256')
        .update(data.trim().toLowerCase())
        .digest('hex');
}

interface CapiPurchaseParams {
    eventID: string;
    orderId: string;
    totalAmount: number;
    currency?: string;
    customerInfo: {
        email?: string;
        phone?: string;
        name?: string;
        city?: string;
    };
    products: Array<{
        productId: any;
        quantity: number;
        price: number;
    }>;
    ipAddress?: string;
    userAgent?: string;
    sourceUrl?: string;
}

/**
 * Send a Purchase event to Meta Conversions API
 */
export async function sendCapiPurchase(params: CapiPurchaseParams) {
    try {
        const accessToken = process.env.META_ACCESS_TOKEN;
        if (!accessToken) {
            console.warn('Meta CAPI: No access token found in environment variables.');
            return;
        }

        // Fetch Pixel ID from settings if not provided
        const settings = await Settings.findOne().lean();
        const pixelId = settings?.facebookPixelId;

        if (!pixelId) {
            console.warn('Meta CAPI: No Pixel ID found in settings.');
            return;
        }

        const { eventID, totalAmount, currency = 'BDT', customerInfo, products, ipAddress, userAgent, sourceUrl } = params;

        // Prepare user data (hashed)
        const userData = {
            em: customerInfo.email ? [hashData(customerInfo.email)] : [],
            ph: customerInfo.phone ? [hashData(customerInfo.phone)] : [],
            client_ip_address: ipAddress,
            client_user_agent: userAgent,
            // External ID can be hashed email or phone if user is not logged in
            external_id: [hashData(customerInfo.email || customerInfo.phone || eventID)]
        };

        // Prepare custom data
        const customData = {
            value: totalAmount,
            currency: currency,
            content_type: 'product',
            content_ids: products.map(p => String(p.productId)),
            contents: products.map(p => ({
                id: String(p.productId),
                quantity: p.quantity,
                delivery_category: 'home_delivery'
            }))
        };

        const payload = {
            data: [
                {
                    event_name: 'Purchase',
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: 'website',
                    event_id: eventID,
                    event_source_url: sourceUrl,
                    user_data: userData,
                    custom_data: customData,
                },
            ],
        };

        const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.error) {
            console.error('Meta CAPI Error:', JSON.stringify(result.error, null, 2));
        } else {
            console.log(`Meta CAPI Success: Purchase tracked for ${eventID} (${result.events_received} events received)`);
        }
    } catch (error) {
        console.error('Meta CAPI Exception:', error);
    }
}
