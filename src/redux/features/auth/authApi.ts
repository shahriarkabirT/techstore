import { apiSlice } from '../../api/apiSlice';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<{ success: boolean; user: any }, void>({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),
        login: builder.mutation<{ success: boolean; user: any }, any>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),
        signup: builder.mutation<{ success: boolean; data: any }, any>({
            query: (userData) => ({
                url: '/auth/signup',
                method: 'POST',
                body: userData,
            }),
        }),
        verifyOtp: builder.mutation<{ success: boolean; user: any }, { email: string; otp: string; method?: string }>({
            query: (body) => ({
                url: '/auth/verify-otp',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),
        resendOtp: builder.mutation<{ success: boolean; message: string }, { email: string; method: string }>({
            query: (body) => ({
                url: '/auth/resend-otp',
                method: 'POST',
                body,
            }),
        }),
        updateProfile: builder.mutation<{ success: boolean; user: any }, any>({
            query: (userData) => ({
                url: '/user/profile',
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        logout: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const {
    useGetMeQuery,
    useLoginMutation,
    useSignupMutation,
    useVerifyOtpMutation,
    useResendOtpMutation,
    useUpdateProfileMutation,
    useLogoutMutation
} = authApi;
