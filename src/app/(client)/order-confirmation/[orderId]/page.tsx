import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { notFound } from 'next/navigation';
import OrderConfirmationClient from './OrderConfirmationClient';
import { IOrder } from '@/types';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Order Confirmation',
};

async function getOrder(orderId: string): Promise<IOrder | null> {
    await dbConnect();
    const order = await Order.findOne({ orderId }).lean();
    return order ? JSON.parse(JSON.stringify(order)) : null;
}

interface PageProps {
    params: Promise<{ orderId: string }>;
    searchParams: Promise<{ status?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
    const { orderId } = await params;
    const { status } = await searchParams;
    const order = await getOrder(orderId);

    if (!order) {
        notFound();
    }

    return <OrderConfirmationClient order={order} status={status} />;
}