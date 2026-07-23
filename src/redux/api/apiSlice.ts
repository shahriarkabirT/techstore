import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        credentials: 'include'
    }),
    tagTypes: ['Product', 'Category', 'SubCategory', 'ChildCategory', 'SubChildCategory', 'Order', 'Banner', 'Testimonial', 'User', 'Wishlist', 'Settings', 'Message', 'Coupon', 'Subscriber', 'VariantOption', 'Courier', 'Brand', 'MetaAds', 'Policy', 'StoreLocation', 'CompatibleModel', 'Attribute', 'ModelCategories'],
    endpoints: () => ({}),
});
