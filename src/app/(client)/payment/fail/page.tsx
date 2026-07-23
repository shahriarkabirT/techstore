import Link from 'next/link';

export const metadata = {
    title: 'Payment Failed',
};

export default async function PaymentFailPage({ searchParams }) {
    const { orderId } = await searchParams;

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container mx-auto max-w-md">
                <div className="card p-6 text-center rounded-2xl border-none shadow-sm">
                    {/* Error Icon */}
                    <div className="w-16 h-16 mx-auto mb-5 bg-danger/10 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-danger">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Payment Failed</h1>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        Unfortunately, your payment could not be processed.
                        Please try again or choose a different payment method.
                    </p>

                    {orderId && (
                        <p className="text-xs text-gray-400 mb-6 font-medium">
                            Order ID: <span className="font-mono text-gray-900">{orderId}</span>
                        </p>
                    )}

                    <div className="flex flex-col gap-3">
                        <Link href="/cart" className="btn btn-primary py-3.5 font-bold text-xs uppercase tracking-widest">
                            Return to Cart
                        </Link>
                        <Link href="/products" className="btn btn-outline py-3 font-bold text-[10px] uppercase tracking-widest">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
