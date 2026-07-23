import { Metadata } from 'next';
import OrderTrackingClient from './OrderTrackingClient';

export const metadata: Metadata = {
    title: 'Track Order',
    description: 'Track your order progress and view details. Enter your order number to get real-time updates on your delivery status.',
};

export default function TrackOrderPage() {
    return <OrderTrackingClient />;
}
