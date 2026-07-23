'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';

interface IBlog {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    createdAt: string;
}

export default function BlogListPage() {
    const [blogs, setBlogs] = useState<IBlog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await axios.get('/api/blogs');
                if (res.data.success) {
                    setBlogs(res.data.blogs);
                }
            } catch (error) {
                console.error('Failed to load blogs', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">Our Blog</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">Discover the latest updates, tips, and stories from our team.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <p className="text-lg">No blog posts found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <Link href={`/blogs/${blog.slug}`} key={blog._id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                    <Image
                                        src={blog.thumbnail || '/placeholder.png'}
                                        alt={blog.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-3">
                                        <span>{formatDate(blog.createdAt)}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {blog.title}
                                    </h2>
                                    <div className="mt-auto pt-4 flex items-center text-sm font-bold text-indigo-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Read Article <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
