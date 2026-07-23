export default function TrustBar() {
    return (
        <div className="border-y border-gray-100 bg-gray-50/40">
            <div className="container mx-auto py-8 px-4">
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 lg:gap-20 lg:justify-evenly">
                    <div className="flex items-center gap-3.5 w-[calc(50%-12px)] md:w-auto">
                        <div className="w-10 h-10 2xl:w-11 2xl:h-11 flex flex-shrink-0 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[13px] 2xl:text-sm font-bold text-gray-900 leading-tight">Loyal Customers</h4>
                            <p className="text-[11px] 2xl:text-xs text-gray-400 mt-0.5">Trusted by thousands</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5 w-[calc(50%-12px)] md:w-auto">
                        <div className="w-10 h-10 2xl:w-11 2xl:h-11 flex flex-shrink-0 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[13px] 2xl:text-sm font-bold text-gray-900 leading-tight">100% Authentic</h4>
                            <p className="text-[11px] 2xl:text-xs text-gray-400 mt-0.5">Verified genuine</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5 w-[calc(50%-12px)] md:w-auto">
                        <div className="w-10 h-10 2xl:w-11 2xl:h-11 flex flex-shrink-0 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[13px] 2xl:text-sm font-bold text-gray-900 leading-tight">Easy Returns</h4>
                            <p className="text-[11px] 2xl:text-xs text-gray-400 mt-0.5">7-day hassle-free</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5 w-[calc(50%-12px)] md:w-auto">
                        <div className="w-10 h-10 2xl:w-11 2xl:h-11 flex flex-shrink-0 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[13px] 2xl:text-sm font-bold text-gray-900 leading-tight">Cash on Delivery</h4>
                            <p className="text-[11px] 2xl:text-xs text-gray-400 mt-0.5">Pay when you receive</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
