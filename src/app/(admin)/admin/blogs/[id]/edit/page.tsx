'use client';

import { useState, useEffect, use } from 'react';
import axios from 'axios';
import BlogForm from '../../_components/BlogForm';
import toast from 'react-hot-toast';

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [blog, setBlog] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const res = await axios.get(`/api/admin/blogs/${id}`);
                if (res.data.success) {
                    setBlog(res.data.blog);
                }
            } catch (error) {
                toast.error('Failed to load blog data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (!blog) {
        return <div className="text-center p-12 text-gray-500">Blog not found</div>;
    }

    return <BlogForm initialData={blog} isEdit={true} />;
}
