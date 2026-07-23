'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';

interface SocialShareProps {
    url?: string;
    title: string;
}

export default function SocialShare({ url, title }: SocialShareProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // If not mounted yet (SSR), we don't have access to window.location
    if (!isMounted) {
        return (
            <div className="flex items-center gap-4 animate-pulse">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Share:</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-9 h-9 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    const currentUrl = url || window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title);

    const shares = [
        {
            name: 'Facebook',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'text-[#1877F2]',
            isAction: false
        },
        {
            name: 'Twitter',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
            ),
            link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: 'text-[#1DA1F2]',
            isAction: false
        },
        {
            name: 'WhatsApp',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.674 1.436 5.662 1.436h.008c6.548 0 11.88-5.335 11.883-11.892a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            ),
            link: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
            color: 'text-[#25D366]',
            isAction: false
        },
        {
            name: 'Share',
            icon: <Share2 className="w-5 h-5" />,
            link: '#',
            color: 'text-gray-700',
            isAction: true
        }
    ];

    const handleShare = async (e: React.MouseEvent, social: any) => {
        if (social.isAction) {
            e.preventDefault();
            setShowModal(true);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setShowModal(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div className="flex items-center gap-4 relative">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Share:</span>
            <div className="flex gap-1">
                {shares.map((social) => (
                    <a
                        key={social.name}
                        href={social.link}
                        onClick={(e) => handleShare(e, social)}
                        target={social.isAction ? undefined : "_blank"}
                        rel={social.isAction ? undefined : "noopener noreferrer"}
                        className={`p-2 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors ${social.color}`}
                        title={social.name}
                    >
                        {social.icon}
                    </a>
                ))}
            </div>

            {/* Share Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowModal(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-72 origin-top-left animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-900">Share Link</h4>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                            <input 
                                type="text" 
                                value={currentUrl} 
                                readOnly 
                                className="bg-transparent text-sm text-gray-600 flex-1 outline-none min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className="p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
