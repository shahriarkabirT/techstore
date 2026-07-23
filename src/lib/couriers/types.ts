import { IOrder } from '@/types';

export interface CourierOrderRequest {
    order: IOrder;
    pickupStoreId?: string;
    deliveryAreaId?: number;
    deliveryAreaName?: string;
    isClosedBox?: boolean;
    instruction?: string;
    parcelDetails?: {
        name: string;
        category: string;
        value: number;
    }[];
}

export interface CourierOrderResponse {
    success: boolean;
    trackingId?: string;
    parcelId?: string;
    message?: string;
    rawResponse?: any;
}

export interface TrackingHistory {
    message_en: string;
    message_bn: string;
    time: string;
}

export interface CourierTrackingResponse {
    success: boolean;
    status: string;
    history?: TrackingHistory[];
    deliveryDate?: Date;
    message?: string;
    rawResponse?: any;
}

export interface CourierArea {
    id: number;
    name: string;
    district_name?: string;
    post_code?: number;
    division_name?: string;
}

export interface CourierPickupStore {
    id: number;
    name: string;
    address: string;
    area_name: string;
    area_id: number;
    phone: string;
}

export interface CourierChargeResponse {
    success: boolean;
    deliveryCharge: number;
    codCharge: number;
    message?: string;
}

export interface ICourierService {
    getName(): string;
    sendOrder(data: CourierOrderRequest): Promise<CourierOrderResponse>;
    trackOrder(trackingId: string): Promise<CourierTrackingResponse>;
    getAreas(query?: {
        post_code?: number;
        district_name?: string;
        city_id?: number;
        zone_id?: number;
    }): Promise<CourierArea[]>;
    getPickupStores(): Promise<CourierPickupStore[]>;
    calculateCharge(data: {
        delivery_area_id: number;
        pickup_area_id: number;
        cash_collection_amount: number;
        weight: number;
    }): Promise<CourierChargeResponse>;
    getBalance(): Promise<{ success: boolean; balance: number; message?: string }>;

    // Return request methods — optional so couriers that don't support returns won't break
    createReturnRequest?(data: CourierReturnRequest): Promise<CourierReturnResponse>;
    getReturnRequest?(returnRequestId: number): Promise<CourierReturnResponse>;
    getReturnRequests?(): Promise<{ success: boolean; requests: any[]; message?: string }>;
}

// ── Return Request Types (extensible for all couriers) ──

export interface CourierReturnRequest {
    consignmentId?: string;
    invoice?: string;
    trackingCode?: string;
    reason?: string;
}

export interface CourierReturnResponse {
    success: boolean;
    returnRequestId?: number;
    status?: string;   // 'pending' | 'approved' | 'processing' | 'completed' | 'cancelled'
    message?: string;
    rawResponse?: any;
}

