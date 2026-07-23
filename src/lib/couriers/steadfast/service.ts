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

export class SteadfastService implements ICourierService {
    private apiKey: string;
    private secretKey: string;
    private baseUrl: string = 'https://portal.packzy.com/api/v1';

    constructor(config: { apiKey?: string; secretKey?: string }) {
        this.apiKey = config.apiKey || '';
        this.secretKey = config.secretKey || '';
    }

    getName(): string {
        return 'steadfast';
    }

    private getHeaders() {
        return {
            'Api-Key': this.apiKey,
            'Secret-Key': this.secretKey,
            'Content-Type': 'application/json'
        };
    }

    async sendOrder(data: CourierOrderRequest): Promise<CourierOrderResponse> {
        if (!this.apiKey || !this.secretKey) {
            return { success: false, message: 'Steadfast API Key or Secret Key is missing' };
        }

        try {
            const address = data.deliveryAreaName 
                ? `${data.order.customerInfo.address}, ${data.deliveryAreaName}` 
                : data.order.customerInfo.address;

            const payload = {
                invoice: data.order.orderId,
                recipient_name: data.order.customerInfo.name,
                recipient_phone: data.order.customerInfo.phone,
                recipient_address: address,
                cod_amount: Math.max(0, data.order.totalAmount - (data.order.advancePaid || 0)),
                note: data.instruction || data.order.customerInfo.notes || '',
            };

            const response = await axios.post(`${this.baseUrl}/create_order`, payload, {
                headers: this.getHeaders()
            });

            if (response.data.status === 200) {
                return {
                    success: true,
                    trackingId: response.data.consignment.tracking_code,
                    parcelId: response.data.consignment.consignment_id?.toString(),
                    message: response.data.message || 'Consignment created successfully',
                    rawResponse: response.data
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Failed to create order on Steadfast'
                };
            }
        } catch (error: any) {
            console.error('Steadfast sendOrder error:', error.response?.data || error.message);
            
            let errorMessage = 'Failed to connect to Steadfast';
            
            if (error.response?.status === 401 || error.response?.status === 403 || error.message?.includes('401') || error.message?.includes('403')) {
                errorMessage = 'Courier authentication failed. Please check your API keys in settings.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Steadfast server is currently experiencing issues. Please try again later.';
            } else if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                errorMessage = typeof errors === 'object' 
                    ? Object.values(errors).flat().join(', ') 
                    : JSON.stringify(errors);
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else {
                errorMessage = 'A network error occurred while attempting to connect to the courier.';
            }

            return {
                success: false,
                message: errorMessage
            };
        }
    }

    async trackOrder(trackingId: string): Promise<CourierTrackingResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/status_by_trackingcode/${trackingId}`, {
                headers: this.getHeaders()
            });

            if (response.data.status === 200) {
                const rawStatus = response.data.delivery_status;
                const statusMap: Record<string, string> = {
                    'pending': 'Pending',
                    'delivered_approval_pending': 'Delivered (Pending Approval)',
                    'partial_delivered_approval_pending': 'Partially Delivered (Pending Approval)',
                    'cancelled_approval_pending': 'Cancelled (Pending Approval)',
                    'unknown_approval_pending': 'Unknown (Pending Approval)',
                    'delivered': 'Delivered',
                    'partial_delivered': 'Partially Delivered',
                    'cancelled': 'Cancelled',
                    'hold': 'On Hold',
                    'in_review': 'In Review',
                    'unknown': 'Unknown status'
                };

                const status = statusMap[rawStatus] || rawStatus;

                return {
                    success: true,
                    status: status,
                    history: [
                        {
                            message_en: `Current Status: ${status}`,
                            message_bn: `বর্তমান অবস্থা: ${status}`,
                            time: new Date().toISOString()
                        }
                    ],
                    rawResponse: response.data
                };
            }

            return {
                success: false,
                status: 'Error retrieving status',
                message: response.data.message
            };
        } catch (error: any) {
            console.error('Steadfast trackOrder error:', error.response?.data || error.message);
            return {
                success: false,
                status: 'Error connecting to Steadfast',
                message: error.message
            };
        }
    }

    async getAreas(): Promise<CourierArea[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/police_stations`, {
                headers: this.getHeaders()
            });

            // Steadfast returns police stations as a list of areas
            // Handle both direct array and wrapped response { data: [...] }
            const data = response.data;
            const stations = Array.isArray(data) ? data : (data.data || data.police_stations || []);

            if (Array.isArray(stations)) {
                return stations.map((ps: any) => ({
                    id: ps.id,
                    name: ps.name,
                    district_name: ps.district || ps.district_name || ''
                }));
            }
            return [];
        } catch (error: any) {
            console.error('Steadfast getAreas error:', error.response?.data || error.message);
            return [];
        }
    }

    // Steadfast doesn't seem to have a public pickup stores API like RedX in this documentation version
    async getPickupStores(): Promise<CourierPickupStore[]> {
        return [];
    }

    // Steadfast documentation doesn't specify a dynamic charge calculator API like RedX
    async calculateCharge(): Promise<CourierChargeResponse> {
        return {
            success: false,
            deliveryCharge: 0,
            codCharge: 0,
            message: 'Charge calculation not implemented for Steadfast'
        };
    }

    async getBalance(): Promise<{ success: boolean; balance: number; message?: string }> {
        if (!this.apiKey || !this.secretKey) {
            return { success: false, balance: 0, message: 'Steadfast API Key or Secret Key is missing' };
        }

        try {
            const response = await axios.get(`${this.baseUrl}/get_balance`, {
                headers: this.getHeaders()
            });

            if (response.data.status === 200) {
                return {
                    success: true,
                    balance: response.data.current_balance,
                    message: 'Balance retrieved successfully'
                };
            } else {
                return {
                    success: false,
                    balance: 0,
                    message: response.data.message || 'Failed to retrieve balance'
                };
            }
        } catch (error: any) {
            console.error('Steadfast getBalance error:', error.response?.data || error.message);
            return {
                success: false,
                balance: 0,
                message: error.response?.data?.message || 'Failed to connect to Steadfast'
            };
        }
    }

    // ── Return Request Methods ──

    async createReturnRequest(data: CourierReturnRequest): Promise<CourierReturnResponse> {
        if (!this.apiKey || !this.secretKey) {
            return { success: false, message: 'Steadfast API Key or Secret Key is missing' };
        }

        try {
            const payload: Record<string, any> = {};

            // Steadfast accepts consignment_id OR invoice OR tracking_code
            if (data.consignmentId) {
                payload.consignment_id = data.consignmentId;
            } else if (data.invoice) {
                payload.invoice = data.invoice;
            } else if (data.trackingCode) {
                payload.tracking_code = data.trackingCode;
            } else {
                return { success: false, message: 'One of consignment_id, invoice, or tracking_code is required' };
            }

            if (data.reason) {
                payload.reason = data.reason;
            }

            const response = await axios.post(`${this.baseUrl}/create_return_request`, payload, {
                headers: this.getHeaders()
            });

            // Steadfast returns the return request object directly
            const rr = response.data;
            return {
                success: true,
                returnRequestId: rr.id,
                status: rr.status || 'pending',
                message: 'Return request created successfully',
                rawResponse: rr
            };
        } catch (error: any) {
            console.error('Steadfast createReturnRequest error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.errors
                    ? JSON.stringify(error.response.data.errors)
                    : 'Failed to create return request on Steadfast'
            };
        }
    }

    async getReturnRequest(returnRequestId: number): Promise<CourierReturnResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/get_return_request/${returnRequestId}`, {
                headers: this.getHeaders()
            });

            const rr = response.data;
            return {
                success: true,
                returnRequestId: rr.id,
                status: rr.status,
                rawResponse: rr
            };
        } catch (error: any) {
            console.error('Steadfast getReturnRequest error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch return request'
            };
        }
    }

    async getReturnRequests(): Promise<{ success: boolean; requests: any[]; message?: string }> {
        try {
            const response = await axios.get(`${this.baseUrl}/get_return_requests`, {
                headers: this.getHeaders()
            });

            return {
                success: true,
                requests: Array.isArray(response.data) ? response.data : (response.data?.data || [])
            };
        } catch (error: any) {
            console.error('Steadfast getReturnRequests error:', error.response?.data || error.message);
            return {
                success: false,
                requests: [],
                message: error.response?.data?.message || 'Failed to fetch return requests'
            };
        }
    }
}

