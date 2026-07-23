import { apiSlice } from '../../api/apiSlice';
import { ITestimonial } from '@/types';

export const testimonialApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPublicTestimonials: builder.query<ITestimonial[], void>({
            query: () => '/testimonials',
            transformResponse: (response: { success: boolean; testimonials: ITestimonial[] }) => response.testimonials,
            providesTags: ['Testimonial'],
        }),
        getAdminTestimonials: builder.query<ITestimonial[], void>({
            query: () => '/admin/testimonials',
            transformResponse: (response: { success: boolean; testimonials: ITestimonial[] }) => response.testimonials,
            providesTags: ['Testimonial'],
        }),
        createTestimonial: builder.mutation<{ success: boolean; testimonial: ITestimonial }, Partial<ITestimonial>>({
            query: (body) => ({
                url: '/admin/testimonials',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Testimonial'],
        }),
        updateTestimonial: builder.mutation<{ success: boolean; testimonial: ITestimonial }, { id: string; body: Partial<ITestimonial> }>({
            query: ({ id, body }) => ({
                url: `/admin/testimonials/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Testimonial'],
        }),
        deleteTestimonial: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/admin/testimonials/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Testimonial'],
        }),
    }),
});

export const {
    useGetPublicTestimonialsQuery,
    useGetAdminTestimonialsQuery,
    useCreateTestimonialMutation,
    useUpdateTestimonialMutation,
    useDeleteTestimonialMutation
} = testimonialApi;
