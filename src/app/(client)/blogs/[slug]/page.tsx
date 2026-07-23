'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { notFound } from 'next/navigation';

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [blog, setBlog] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const res = await axios.get(`/api/blogs/${slug}`);
                if (res.data.success) {
                    setBlog(res.data.blog);
                } else {
                    setError(true);
                }
            } catch (error) {
                console.error('Failed to load blog', error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlog();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !blog) {
        return notFound();
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <article className="bg-white min-h-screen pb-24">
            {/* Header Section */}
            <div className="bg-gray-50 py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 mb-6">
                        Published on {formatDate(blog.createdAt)}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-8">
                        {blog.title}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl -mt-10 md:-mt-16 relative z-10">
                {/* Hero Image */}
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-gray-100 mb-16">
                    <Image
                        src={blog.thumbnail || '/placeholder.png'}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="bg-white px-2 md:px-8">
                    <div 
                        className="prose prose-lg md:prose-xl max-w-none prose-indigo prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-sm"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />

                    {/* Back to blogs link */}
                    <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                        <Link 
                            href="/blogs"
                            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            Back to all articles
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
