import {
    ICourierService,
    CourierOrderRequest,
    CourierOrderResponse,
    CourierTrackingResponse,
    CourierArea,
    CourierPickupStore,
    CourierChargeResponse,
    CourierReturnRequest,
    CourierReturnResponse
} from '../types';
import axios from 'axios';

export class RedXService implements ICourierService {
    private apiKey: string;
    private isSandbox: boolean;
    private baseUrl: string;

    constructor(config: { apiKey?: string; isSandbox?: boolean }) {
        this.apiKey = config.apiKey || '';
        this.isSandbox = config.isSandbox || false;
        this.baseUrl = this.isSandbox
            ? 'https://sandbox.redx.com.bd/v1.0.0-beta'
            : 'https://openapi.redx.com.bd/v1.0.0-beta';
    }

    getName(): string {
        return 'redx';
    }

    private getHeaders() {
        return {
            'API-ACCESS-TOKEN': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async sendOrder(data: CourierOrderRequest): Promise<CourierOrderResponse> {
        if (!this.apiKey) {
            return { success: false, message: 'RedX API key is missing' };
        }

        try {
            const payload = {
                customer_name: data.order.customerInfo.name,
                customer_phone: data.order.customerInfo.phone,
                delivery_area: data.deliveryAreaName || data.order.customerInfo.city || '',
                delivery_area_id: data.deliveryAreaId,
                customer_address: data.order.customerInfo.address,
                merchant_invoice_id: data.order.orderId,
                cash_collection_amount: Math.max(0, data.order.totalAmount - (data.order.advancePaid || 0)).toString(),
                parcel_weight: (data.order.products.reduce((acc, p) => acc + ((p as any).weight || 500), 0)).toString(),
                instruction: data.instruction || '',
                value: data.order.totalAmount.toString(),
                is_closed_box: !!data.isClosedBox,
                pickup_store_id: data.pickupStoreId,
                parcel_details_json: JSON.stringify(data.parcelDetails || data.order.products.map(p => ({
                    name: `${p.title} (Qty: ${p.quantity})`,
                    category: 'General',
                    value: p.price * p.quantity
                })))
            };

            const response = await axios.post(`${this.baseUrl}/parcel`, payload, {
                headers: this.getHeaders()
            });

            return {
                success: true,
                trackingId: response.data.tracking_id,
                message: 'Parcel created successfully',
                rawResponse: response.data
            };
        } catch (error: any) {
            console.error('RedX sendOrder error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create parcel on RedX'
            };
        }
    }

    async trackOrder(trackingId: string): Promise<CourierTrackingResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/parcel/track/${trackingId}`, {
                headers: this.getHeaders()
            });

            const trackingData = response.data.tracking || [];
            const history = trackingData.map((item: any) => ({
                message_en: item.message_en,
                message_bn: item.message_bn,
                time: item.time
            }));
            const latestStatus = history.length > 0 ? history[history.length - 1].message_en : 'Unknown';

            return {
                success: true,
                status: latestStatus,
                history: history,
                rawResponse: response.data
            };
        } catch (error: any) {
            console.error('RedX trackOrder error:', error.response?.data || error.message);
            return {
                success: false,
                status: 'Error retrieving tracking info',
            };
        }
    }

    async getAreas(query?: { post_code?: number; district_name?: string }): Promise<CourierArea[]> {
        try {
            let url = `${this.baseUrl}/areas`;
            if (query?.post_code) url += `?post_code=${query.post_code}`;
            else if (query?.district_name) url += `?district_name=${query.district_name}`;

            const response = await axios.get(url, {
                headers: this.getHeaders()
            });

            return response.data.areas || [];
        } catch (error: any) {
            console.error('RedX getAreas error:', error.response?.data || error.message);
            return [];
        }
    }

    async getPickupStores(): Promise<CourierPickupStore[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/pickup/stores`, {
                headers: this.getHeaders()
            });

            return response.data.pickup_stores || [];
        } catch (error: any) {
            console.error('RedX getPickupStores error:', error.response?.data || error.message);
            return [];
        }
    }

    async calculateCharge(data: {
        delivery_area_id: number;
        pickup_area_id: number;
        cash_collection_amount: number;
        weight: number;
    }): Promise<CourierChargeResponse> {
        try {
            const url = `${this.baseUrl}/charge/charge_calculator?delivery_area_id=${data.delivery_area_id}&pickup_area_id=${data.pickup_area_id}&cash_collection_amount=${data.cash_collection_amount}&weight=${data.weight}`;

            const response = await axios.get(url, {
                headers: this.getHeaders()
            });

            return {
                success: true,
                deliveryCharge: response.data.deliveryCharge,
                codCharge: response.data.codCharge
            };
        } catch (error: any) {
            console.error('RedX calculateCharge error:', error.response?.data || error.message);
            return {
                success: false,
                deliveryCharge: 0,
                codCharge: 0,
                message: error.response?.data?.message || 'Failed to calculate charge'
            };
        }
    }

    async getBalance(): Promise<{ success: boolean; balance: number; message?: string }> {
        return {
            success: false,
            balance: 0,
            message: 'Balance check not available for RedX'
        };
    }

    // ── Return Request Methods ──
    // RedX has no dedicated return endpoint. Returns are handled by:
    // 1. Cancelling the parcel via PATCH /parcels → triggers RedX internal return flow
    // 2. Monitoring the parcel status for 'agent-returning' / 'returned' via GET /parcel/info

    async createReturnRequest(data: CourierReturnRequest): Promise<CourierReturnResponse> {
        if (!this.apiKey) {
            return { success: false, message: 'RedX API key is missing' };
        }

        const trackingId = data.trackingCode;
        if (!trackingId) {
            return { success: false, message: 'Tracking code is required for RedX return' };
        }

        try {
            // First check parcel status — cancellation only works pre-delivery
            const infoRes = await axios.get(`${this.baseUrl}/parcel/info/${trackingId}`, {
                headers: this.getHeaders()
            });

            const parcelStatus = infoRes.data?.parcel?.status;
            const alreadyDelivered = ['delivered', 'returned'].includes(parcelStatus);

            if (alreadyDelivered) {
                // RedX does not support API-based returns for delivered parcels.
                // The refund still gets approved on our side, but courier pickup
                // must be coordinated manually via RedX support or dashboard.
                return {
                    success: true,
                    status: 'pending',
                    message: `Parcel already "${parcelStatus}". RedX does not support API-based returns for delivered parcels. Please coordinate the return via RedX support (09610007339) or merchant dashboard.`,
                    rawResponse: infoRes.data
                };
            }

            // Parcel not yet delivered — cancel it to trigger the return flow
            const response = await axios.patch(`${this.baseUrl}/parcels`, {
                entity_type: 'parcel-tracking-id',
                entity_id: trackingId,
                update_details: {
                    property_name: 'status',
                    new_value: 'cancelled',
                    reason: data.reason || 'Customer requested return/refund'
                }
            }, {
                headers: this.getHeaders()
            });

            if (response.data.success) {
                return {
                    success: true,
                    status: 'agent-returning',
                    message: 'Return initiated via parcel cancellation. RedX will process the return.',
                    rawResponse: response.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to initiate return on RedX'
            };
        } catch (error: any) {
            console.error('RedX createReturnRequest error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to initiate return on RedX'
            };
        }
    }

    async getReturnRequest(returnRequestId: number): Promise<CourierReturnResponse> {
        // RedX doesn't use numeric IDs — the returnRequestId is stored but we need
        // the tracking_id. We fetch parcel info by tracking_id which is stored
        // on the order's paymentDetails.trackingId. For the sync flow, the caller
        // passes the tracking code via the Refund's courierReturn data.
        // Since the interface requires a number, we handle it gracefully.
        try {
            // The admin sync-courier route will use this. For RedX, we look up
            // parcel info by tracking ID. The returnRequestId is not applicable,
            // so we return a generic status indicating manual check is needed.
            return {
                success: true,
                status: 'pending',
                message: 'RedX does not expose a return status API. Check the parcel tracking status or RedX dashboard for updates.'
            };
        } catch (error: any) {
            return {
                success: false,
                message: 'Failed to check return status'
            };
        }
    }

    /**
     * Check return status by tracking ID (RedX-specific helper)
     * This can be called directly when we have the tracking code.
     */
    async getReturnStatusByTracking(trackingId: string): Promise<CourierReturnResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/parcel/info/${trackingId}`, {
                headers: this.getHeaders()
            });

            const parcel = response.data.parcel;
            if (!parcel) {
                return { success: false, message: 'Parcel not found' };
            }

            // Map RedX status to our return status
            const returnStatuses: Record<string, string> = {
                'agent-returning': 'processing',
                'returned': 'completed',
                'cancelled': 'processing',
                'agent-hold': 'pending',
                'delivered': 'completed',
            };

            const courierStatus = returnStatuses[parcel.status] || parcel.status;

            return {
                success: true,
                status: courierStatus,
                message: `RedX parcel status: ${parcel.status}`,
                rawResponse: parcel
            };
        } catch (error: any) {
            console.error('RedX getReturnStatusByTracking error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to check parcel status'
            };
        }
    }

    async getReturnRequests(): Promise<{ success: boolean; requests: any[]; message?: string }> {
        return {
            success: true,
            requests: [],
            message: 'RedX does not have a dedicated return requests API. Use parcel tracking to monitor return status.'
        };
    }
}

