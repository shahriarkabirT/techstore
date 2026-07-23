'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    Facebook,
    Instagram,
    Youtube,
    MessageSquare,
    Loader2
} from 'lucide-react';
import { useGetPublicSettingsQuery } from '@/redux/features/settings/settingsApi';
import { useSubmitContactMessageMutation } from '@/redux/features/contact/contactApi';

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function ContactPage() {
    const { data: settingsData } = useGetPublicSettingsQuery();
    const [submitMessage, { isLoading: isSubmitting }] = useSubmitContactMessageMutation();

    const settings = settingsData?.settings;

    const WORD_LIMIT = 250;
    const SUBJECT_LIMIT = 100;

    const getWordCount = (text: string) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const currentWordCount = getWordCount(formData.message);
        if (currentWordCount > WORD_LIMIT) {
            toast.error(`Your message exceeds the maximum limit of ${WORD_LIMIT} words.`);
            return;
        }

        if (formData.subject.length > SUBJECT_LIMIT) {
            toast.error(`Subject cannot exceed ${SUBJECT_LIMIT} characters.`);
            return;
        }

        try {
            const data = await submitMessage(formData).unwrap();

            if (data.success) {
                toast.success('Message sent successfully!');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                });
            }
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to send message');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pt-12 pb-24">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                            Get in <span className="relative inline-block">
                                <span className="relative z-10 text-primary italic">Touch</span>
                                <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/10 -rotate-1 z-0" />
                            </span>
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                            Have questions or feedback? We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you as soon as possible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Info Section (Left) */}
                        <div className="lg:col-span-5 space-y-8">
                            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />

                                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                    <MessageSquare className="w-6 h-6 text-primary" />
                                    Contact Information
                                </h2>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-gray-50 rounded-2xl text-primary shrink-0">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 mb-1">Office address</p>
                                            <p className="text-gray-700 leading-relaxed font-medium">
                                                {settings?.address || 'Loading address...'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-gray-50 rounded-2xl text-primary shrink-0">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 mb-1">Phone number</p>
                                            <p className="text-gray-700 font-medium">{settings?.contactPhone || 'Loading...'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Available 9 AM - 6 PM</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-gray-50 rounded-2xl text-primary shrink-0">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 mb-1">Email address</p>
                                            <p className="text-gray-700 font-medium">{settings?.contactEmail || 'Loading...'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="mt-12 pt-8 border-t border-gray-100">
                                    <p className="text-xs font-black text-gray-700 mb-6">Follow us</p>
                                    <div className="flex gap-4">
                                        {settings?.facebook && (
                                            <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm">
                                                <Facebook className="w-6 h-6" />
                                            </a>
                                        )}
                                        {settings?.instagram && (
                                            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm">
                                                <Instagram className="w-6 h-6" />
                                            </a>
                                        )}
                                        {settings?.youtube && (
                                            <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm">
                                                <Youtube className="w-6 h-6" />
                                            </a>
                                        )}
                                        {settings?.tiktok && (
                                            <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm">
                                                <TikTokIcon className="w-6 h-6" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Card */}
                            <div className="bg-primary p-8 rounded-3xl text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-2">Need immediate help?</h3>
                                    <p className="opacity-80 text-sm mb-6 font-medium">Chat with our support team on WhatsApp for lightning fast response.</p>
                                    <a
                                        href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                                    >
                                        Chat on WhatsApp
                                    </a>
                                </div>
                                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                            </div>
                        </div>

                        {/* Form Section (Right) */}
                        <div className="lg:col-span-7">
                            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-full">
                                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                    <Send className="w-6 h-6 text-primary" />
                                    Send a Message
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700 pl-1">Full name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700 pl-1">Email address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="john@example.com"
                                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700 pl-1">Phone (optional)</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+880 1..."
                                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between pl-1 pr-2">
                                                <label className="text-xs font-bold text-gray-700">Subject</label>
                                                <span className={`text-xs font-bold ${formData.subject.length > SUBJECT_LIMIT ? 'text-rose-500' : 'text-gray-400'}`}>
                                                    {formData.subject.length} / {SUBJECT_LIMIT}
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                name="subject"
                                                required
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="Question about an order"
                                                className={`w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 font-medium placeholder:text-gray-300 ${formData.subject.length > SUBJECT_LIMIT ? 'ring-2 ring-rose-500 bg-rose-50' : ''}`}
                                            />
                                            {formData.subject.length > SUBJECT_LIMIT && (
                                                <p className="text-xs text-rose-500 font-bold pl-1">
                                                    Subject exceeds the maximum allowed length.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between pl-1 pr-2">
                                            <label className="text-xs font-bold text-gray-700">Your message</label>
                                            <span className={`text-xs font-bold ${getWordCount(formData.message) > WORD_LIMIT ? 'text-rose-500' : 'text-gray-400'}`}>
                                                {getWordCount(formData.message)} / {WORD_LIMIT} words
                                            </span>
                                        </div>
                                        <textarea
                                            name="message"
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Write your message here..."
                                            className={`w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 font-medium placeholder:text-gray-300 resize-none ${getWordCount(formData.message) > WORD_LIMIT ? 'ring-2 ring-rose-500 bg-rose-50' : ''}`}
                                        />
                                        {getWordCount(formData.message) > WORD_LIMIT && (
                                            <p className="text-xs text-rose-500 font-bold pl-1">
                                                Your message exceeds the maximum allowed word count. Please shorten it.
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || getWordCount(formData.message) > WORD_LIMIT || formData.subject.length > SUBJECT_LIMIT}
                                            className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    Send Message
                                                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
