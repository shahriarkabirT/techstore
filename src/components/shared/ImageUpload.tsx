"use client";

import Image from "next/image";
import { useRef, useState, ChangeEvent, useEffect } from "react";
import { Loader2, Maximize2 } from "lucide-react";
import WatermarkedImage from "@/components/ui/WatermarkedImage";

interface ImageUploadProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    onError?: (message: string) => void;
    aspectRatio?: string;
    recommendedSize?: string;
    maxImages?: number;
    allowMultiple?: boolean;
}

interface UploadResponse {
    success: boolean;
    imageUrl?: string;
    message?: string;
}

export default function ImageUpload({
    images,
    onImagesChange,
    onError,
    aspectRatio = "1:1",
    recommendedSize = "1000x1000px",
    maxImages = 5,
    allowMultiple = true
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPreviewImage(null);
        };
        if (previewImage) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [previewImage]);

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (images.length + files.length > maxImages) {
            const msg = `You can only upload a maximum of ${maxImages} images.`;
            setLocalError(msg);
            onError?.(msg);
            return;
        }

        setUploading(true);
        setLocalError(null);
        const newImages = [...images.filter(img => img)]; // Filter out empty strings

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const data: UploadResponse = await res.json();

                if (data.success && data.imageUrl) {
                    newImages.push(data.imageUrl);
                } else {
                    const msg = data.message || "Failed to upload image";
                    setLocalError(msg);
                    onError?.(msg);
                }
            }

            onImagesChange(newImages);
        } catch (error) {
            console.error("Upload error:", error);
            const msg = "Failed to upload images. Network error.";
            setLocalError(msg);
            onError?.(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <>
        <div className="space-y-4">
            {localError && (
                <div className="bg-white border border-rose-600 text-rose-600 text-[10px] px-3 py-2 rounded-lg font-bold flex items-center justify-between">
                    <span>{localError}</span>
                    <button onClick={() => setLocalError(null)} className="hover:text-rose-800 font-black">×</button>
                </div>
            )}

            {/* Recommended Aspect Ratio Note */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2 text-[10px] text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <span>Recommended aspect ratio: <span className="font-bold text-gray-700">{aspectRatio}</span> (e.g., {recommendedSize})</span>
            </div>

            {/* Image preview grid */}
            <div className={`grid ${aspectRatio === "3:1" || aspectRatio === "4:3" ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-4"} gap-4`}>
                {images.filter(img => img).map((img, index) => {
                    const ratioClass = aspectRatio.replace(':', '/');
                    return (
                        <div key={index} className={`relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm`} style={{ aspectRatio: ratioClass }}>
                            <div className="absolute inset-0 cursor-pointer" onClick={() => setPreviewImage(img)}>
                                <Image
                                    src={img}
                                    fill
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-700 z-10"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}

                {/* Upload button inside grid if needed or separate */}
                {images.length < maxImages && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`${(aspectRatio === "3:1" || aspectRatio === "4:3") ? "w-full aspect-[4/1]" : "aspect-square"} border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-gray-900 hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple={allowMultiple && images.length < maxImages}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        {uploading ? (
                            <div className="spinner w-5 h-5 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span className="text-[9px] font-semibold uppercase tracking-tighter">New Image</span>
                            </>
                        )}
                    </button>
                )}
            </div>


        </div>

            {/* Fullscreen Preview Lightbox */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/50 hover:text-white p-2 transition-colors z-50 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <div 
                        className="relative w-full max-w-4xl h-[80vh] rounded-lg overflow-hidden flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* We use WatermarkedImage here so they can preview the watermark and download it! */}
                        <WatermarkedImage 
                            src={previewImage} 
                            alt="Preview High Quality" 
                            className="w-full h-full"
                            imageClassName="object-contain" 
                        />
                    </div>
                </div>
            )}
        </>
    );
}
