'use client';

import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { notFound } from 'next/navigation';

export default function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [policy, setPolicy] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const res = await axios.get(`/api/policies/${slug}`);
                if (res.data.success && res.data.policy.isActive) {
                    setPolicy(res.data.policy);
                } else {
                    setError(true);
                }
            } catch (error) {
                console.error('Failed to load policy', error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolicy();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !policy) {
        return notFound();
    }

    return (
        <article className="bg-white min-h-screen pb-24">
            <div className="bg-gray-50/50 py-12 md:py-16 border-b border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {policy.title}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl mt-12">
                <div className="bg-white">
                    <div 
                        className="rich-text-content prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-img:shadow-sm"
                        dangerouslySetInnerHTML={{ __html: policy.content }}
                    />
                </div>
            </div>
        </article>
    );
}
