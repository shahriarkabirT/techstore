'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, ImageIcon, X, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface FaviconUploaderProps {
    currentFavicon?: string;
    onUploadComplete: (url: string) => void;
}

export default function FaviconUploader({
    currentFavicon,
    onUploadComplete,
}: FaviconUploaderProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Basic validation
            if (file.size > 1024 * 1024) { // 1MB limit for icon
                toast.error('Icon file should be less than 1MB');
                return;
            }

            try {
                setIsLoading(true);
                const formData = new FormData();
                formData.append('file', file);

                const response = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (response.data.success) {
                    onUploadComplete(response.data.imageUrl);
                    toast.success('Favicon updated');
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error('Error uploading favicon');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-primary/[0.02]">
                        {currentFavicon ? (
                            <Image src={currentFavicon} alt="Favicon" className="object-contain" width={100} height={100}   />
                        ) : (
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-sm active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New Icon</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isLoading}
                        />
                    </label>
                    <p className="text-[10px] text-gray-400 font-medium tracking-tight">
                        Square PNG or ICO preferred • Max 1MB
                    </p>
                </div>
            </div>
        </div>
    );
}
