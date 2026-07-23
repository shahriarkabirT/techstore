'use client';

import { useState } from 'react';
import {
    useGetAdminTestimonialsQuery,
    useCreateTestimonialMutation,
    useUpdateTestimonialMutation,
    useDeleteTestimonialMutation
} from '@/redux/features/testimonial/testimonialApi';
import { ITestimonial } from '@/types';
import { showError, showSuccess } from '@/lib/toast';
import TestimonialModal from '@/components/admin/testimonials/TestimonialModal';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function TestimonialsPage() {
    const { data: testimonials, isLoading } = useGetAdminTestimonialsQuery();
    const [createTestimonial, { isLoading: isCreating }] = useCreateTestimonialMutation();
    const [updateTestimonial, { isLoading: isUpdating }] = useUpdateTestimonialMutation();
    const [deleteTestimonial] = useDeleteTestimonialMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState<ITestimonial | null>(null);

    const handleAdd = () => {
        setSelectedTestimonial(null);
        setIsModalOpen(true);
    };

    const handleEdit = (testimonial: ITestimonial) => {
        setSelectedTestimonial(testimonial);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this testimonial?')) {
            try {
                await deleteTestimonial(id).unwrap();
                showSuccess('Deleted', 'Testimonial deleted successfully');
            } catch (err: any) {
                showError('Error', err.data?.message || 'Failed to delete');
            }
        }
    };

    const handleToggleStatus = async (testimonial: ITestimonial) => {
        try {
            await updateTestimonial({
                id: testimonial._id,
                body: { isActive: !testimonial.isActive }
            }).unwrap();
            showSuccess('Updated', `Testimonial is now ${!testimonial.isActive ? 'active' : 'inactive'}`);
        } catch (err: any) {
            showError('Error', err.data?.message || 'Failed to update status');
        }
    };

    const handleSubmit = async (data: Partial<ITestimonial>) => {
        try {
            if (selectedTestimonial) {
                await updateTestimonial({ id: selectedTestimonial._id, body: data }).unwrap();
                showSuccess('Updated', 'Testimonial updated successfully');
            } else {
                await createTestimonial(data).unwrap();
                showSuccess('Created', 'Testimonial created successfully');
            }
            setIsModalOpen(false);
        } catch (err: any) {
            showError('Error', err.data?.message || 'Failed to save');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Testimonials</h1>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Manage customer feedback</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="btn bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Add Testimonial
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Person</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Quote</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Order</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">Loading testimonials...</td>
                                </tr>
                            ) : testimonials?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No testimonials found.</td>
                                </tr>
                            ) : (
                                testimonials?.map((testimonial) => (
                                    <tr key={testimonial._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                                    {testimonial.profilePicture?.trim() ? (
                                                        <Image
                                                            src={testimonial.profilePicture}
                                                            alt={testimonial.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{testimonial.designation}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-600 line-clamp-2 max-w-xs">{testimonial.quote}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-900">{testimonial.order}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(testimonial)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${testimonial.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}
                                            >
                                                {testimonial.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(testimonial)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(testimonial._id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TestimonialModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                testimonial={selectedTestimonial}
                onSubmit={handleSubmit}
                isLoading={isCreating || isUpdating}
            />
        </div>
    );
}
