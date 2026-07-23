import axios from 'axios';
import {
    ICourierService,
    CourierOrderRequest,
    CourierOrderResponse,
    CourierTrackingResponse,
    CourierArea,
    CourierPickupStore,
    CourierChargeResponse
} from '../types';

export class PathaoService implements ICourierService {
    private clientId: string;
    private clientSecret: string;
    private username: string;
    private password: string;
    private isSandbox: boolean;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(config: {
        clientId: string;
        clientSecret: string;
        username: string;
        password: string;
        isSandbox?: boolean;
    }) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.username = config.username;
        this.password = config.password;
        this.isSandbox = config.isSandbox || false;
        this.baseUrl = this.isSandbox
            ? 'https://api-hermes-sandbox.pathao.com'
            : 'https://api-hermes.pathao.com';
    }

    private async ensureToken() {
        const now = Math.floor(Date.now() / 1000);
        if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry - 60) {
            return;
        }

        try {
            const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                username: this.username,
                password: this.password,
                grant_type: 'password'
            });

            console.log('Pathao issue-token response:', response.data);

            if (response.data.error) {
                throw new Error('Pathao Auth Error: ' + JSON.stringify(response.data));
            }

            this.accessToken = response.data.access_token;
            this.tokenExpiry = now + (response.data.expires_in || 3600);
        } catch (error: any) {
            console.error('Pathao auth error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to authenticate with Pathao. Please check your credentials.');
        }
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    getName(): string {
        return 'pathao';
    }

    async getAreas(query?: { city_id?: number; zone_id?: number }): Promise<CourierArea[]> {
        await this.ensureToken();

        try {
            let url = '';
            if (query?.zone_id) {
                url = `${this.baseUrl}/aladdin/api/v1/zones/${query.zone_id}/area-list`;
            } else if (query?.city_id) {
                url = `${this.baseUrl}/aladdin/api/v1/cities/${query.city_id}/zone-list`;
            } else {
                url = `${this.baseUrl}/aladdin/api/v1/countries/1/city-list`;
            }

            const response = await axios.get(url, { headers: this.getHeaders() });

            // Pathao API structure: { data: { data: [ ... ] } } or { data: [ ... ] }
            const responseData = response.data;
            const result = responseData.data;
            const areas = Array.isArray(result) ? result : (result?.data || result?.city_list || result?.zone_list || result?.area_list || []);

            return areas.map((item: any) => ({
                id: item.city_id || item.zone_id || item.area_id,
                name: item.city_name || item.zone_name || item.area_name
            }));
        } catch (error: any) {
            console.error('Pathao getAreas error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.message);
        }
    }

    async getPickupStores(): Promise<CourierPickupStore[]> {
        await this.ensureToken();
        try {
            const response = await axios.get(`${this.baseUrl}/aladdin/api/v1/stores`, { headers: this.getHeaders() });
            const result = response.data.data;
            const stores = Array.isArray(result) ? result : (result.data || []);

            return stores.map((s: any) => ({
                id: s.store_id,
                name: s.store_name,
                address: s.store_address,
                phone: s.store_phone,
                area_id: s.area_id,
                area_name: s.area_name
            }));
        } catch (error) {
            return [];
        }
    }

    async sendOrder(data: CourierOrderRequest): Promise<CourierOrderResponse> {
        await this.ensureToken();
        try {
            let storeId = parseInt(data.pickupStoreId || '0');
            if (storeId === 0) {
                // If UI didn't send a store ID, fetch and use the first available store
                const stores = await this.getPickupStores();
                if (stores && stores.length > 0) {
                    storeId = parseInt(stores[0].id.toString());
                }
            }

            const payload = {
                store_id: storeId,
                merchant_order_id: data.order.orderId,
                recipient_name: data.order.customerInfo.name,
                recipient_phone: data.order.customerInfo.phone,
                recipient_address: data.order.customerInfo.address,
                delivery_type: 48, // 48 for normal delivery
                item_type: 2, // 2 for parcel
                special_instruction: data.instruction || '',
                item_quantity: data.order.products.reduce((acc, p) => acc + p.quantity, 0),
                item_weight: data.order.products.reduce((acc, p) => acc + (p.quantity * 0.5), 0).toString(), // String format for weight
                amount_to_collect: data.order.paymentMethod === 'COD' ? Math.max(0, data.order.totalAmount - (data.order.advancePaid || 0)) : 0,
                item_description: data.order.products.map(p => p.title).join(', ')
            };

            const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/orders`, payload, { headers: this.getHeaders() });

            if (response.data.type === 'success') {
                return {
                    success: true,
                    trackingId: response.data.data.consignment_id,
                    message: 'Order created successfully with Pathao'
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Failed to create order'
                };
            }
        } catch (error: any) {
            console.error('Pathao sendOrder error:', error.response?.data || error.message);
            const data = error.response?.data;
            let errorMsg = data?.message || 'Failed to connect to Pathao';
            if (data?.errors) {
                errorMsg += ' - ' + JSON.stringify(data.errors);
            }
            return {
                success: false,
                message: errorMsg
            };
        }
    }

    async trackOrder(trackingId: string): Promise<CourierTrackingResponse> {
        await this.ensureToken();
        try {
            const response = await axios.get(`${this.baseUrl}/aladdin/api/v1/orders/${trackingId}/transcripts`, { headers: this.getHeaders() });
            const data = response.data.data || [];

            // Map status
            const lastLog = data[0];
            const status = lastLog?.order_status || 'Unknown';

            return {
                success: true,
                status: status,
                history: data.map((log: any) => ({
                    message_en: log.order_status,
                    message_bn: log.order_status,
                    time: log.created_at
                }))
            };
        } catch (error: any) {
            return {
                success: false,
                status: 'Error',
                message: error.response?.data?.message || 'Failed to track order'
            };
        }
    }

    async calculateCharge(data: any): Promise<CourierChargeResponse> {
        return { success: false, deliveryCharge: 0, codCharge: 0, message: 'Charge calculation not implemented for Pathao' };
    }

    async getBalance(): Promise<{ success: boolean; balance: number; message?: string }> {
        return { success: false, balance: 0, message: 'Balance calculation not implemented for Pathao' };
    }
}
