'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Upload,
    Maximize2,
    Link2,
    Link2Off,
    RotateCcw,
    Check,
    X,
    Crop,
    Image as ImageIcon,
    ZoomIn,
    Sun,
    Moon
} from 'lucide-react';
import NextImage from 'next/image';

interface LogoUploaderProps {
    currentLogo?: string;
    width: number;
    height: number;
    onUploadComplete: (url: string) => void;
    onDimensionsChange: (width: number, height: number) => void;
}

type AspectRatioOption = {
    label: string;
    value: number | undefined;
};

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
    { label: 'Free', value: undefined },
    { label: 'Square', value: 1 },
    { label: '3:2', value: 3 / 2 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
];

export default function LogoUploader({
    currentLogo,
    width,
    height,
    onUploadComplete,
    onDimensionsChange
}: LogoUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    const [isLightCropper, setIsLightCropper] = useState(true);

    // Auto-scaling / Aspect Ratio Management
    const [isLocked, setIsLocked] = useState(true);
    const currentRatio = width / height;

    // Cropper State
    const [selectedAspect, setSelectedAspect] = useState<number | undefined>(width / height);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleWidthChange = (newWidth: number) => {
        if (isLocked) {
            const newHeight = Math.round(newWidth / currentRatio);
            onDimensionsChange(newWidth, newHeight);
        } else {
            onDimensionsChange(newWidth, height);
        }
    };

    const handleHeightChange = (newHeight: number) => {
        if (isLocked) {
            const newWidth = Math.round(newHeight * currentRatio);
            onDimensionsChange(newWidth, newHeight);
        } else {
            onDimensionsChange(width, newHeight);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result as string));
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/png');
        });
    };

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setIsLoading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            const formData = new FormData();
            formData.append('file', croppedImageBlob, 'logo.png');

            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                // If we cropped with a different aspect ratio, update dimensions to match
                if (croppedAreaPixels.width && croppedAreaPixels.height) {
                    // Update dimensions to match the new crop's aspect ratio, keeping width similar
                    const newHeight = Math.round(width * (croppedAreaPixels.height / croppedAreaPixels.width));
                    onDimensionsChange(width, newHeight);
                }

                const newLogoUrl = response.data.imageUrl;
                onUploadComplete(newLogoUrl);
                setPreviewKey(prev => prev + 1);
                setImageSrc(null);
                toast.success('Logo uploaded and resized to fit crop');
            } else {
                toast.error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error uploading logo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Controls (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Upload Section */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Upload className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">1. Upload Logo</h3>
                        </div>

                        <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                                <p className="text-sm text-gray-500 group-hover:text-primary transition-colors">Click to upload NEW logo</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                        <p className="mt-3 text-[11px] text-gray-400 text-center">PNG, JPG, WEBP • Max 5MB • Instant Crop</p>
                    </div>

                    {/* Dimensions Section */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Maximize2 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">2. Auto Scaling</h3>
                            </div>
                            <button
                                onClick={() => setIsLocked(!isLocked)}
                                className={`p-2 rounded-lg transition-all ${isLocked ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                title={isLocked ? "Aspect Ratio Locked" : "Aspect Ratio Unlocked"}
                            >
                                {isLocked ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Width</label>
                                    <span className="px-2 py-0.5 bg-gray-50 rounded text-xs font-mono font-bold text-gray-600">{width}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="400"
                                    value={width}
                                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Height</label>
                                    <span className="px-2 py-0.5 bg-gray-50 rounded text-xs font-mono font-bold text-gray-600">{height}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    value={height}
                                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => onDimensionsChange(120, 40)}
                                    className="w-full py-2.5 rounded-xl border border-gray-100 text-xs font-semibold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset to Default
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Preview (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-50 rounded-lg">
                                <ImageIcon className="w-5 h-5 text-teal-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">3. Live Header Preview</h3>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 p-8">
                            {/* Simulated Navbar Header */}
                            <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl border border-gray-100 group overflow-hidden">
                                {/* Browser chrome bar */}
                                <div className="h-10 bg-gray-50/80 border-b flex items-center px-4 gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-200" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-200" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
                                    <div className="ml-4 h-5 w-48 bg-white rounded-md border text-[10px] text-gray-300 flex items-center px-2">yourstore.com</div>
                                </div>

                                {/* Exact replica of real navbar: bg-white/80 backdrop-blur-md border-b */}
                                <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
                                    <div className="container mx-auto">
                                        <div className="flex items-center justify-between h-18 gap-4 px-3 md:px-0">
                                            {/* Left: Logo — exact same as Navbar.tsx */}
                                            <div className="flex-shrink-0">
                                                {currentLogo ? (
                                                    <div className="flex items-center justify-start">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            key={`logo-preview-${previewKey}`}
                                                            src={currentLogo}
                                                            alt="Logo Preview"
                                                            style={{ width: `${width}px`, height: `${height}px` }}
                                                            className="object-contain object-left"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-start">
                                                        <span className="text-xl font-bold text-primary">YourStore</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Center: Nav links placeholder */}
                                            <div className="hidden md:flex items-center gap-6 italic text-gray-300 text-xs">
                                                <span>Shop</span>
                                                <span>Categories</span>
                                                <span>Contact</span>
                                            </div>

                                            {/* Right: Icons placeholder */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 border shadow-sm" />
                                                <div className="w-16 h-8 rounded-full bg-primary/10 border border-primary/20" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center space-y-2">
                                <p className="text-sm font-medium text-gray-500">Current Dimensions: <span className="font-bold text-gray-800">{width}px x {height}px</span></p>
                                <p className="text-xs text-gray-400">Scale the sliders on the left to see instant updates in your header layout.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cropper Modal */}
            {imageSrc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" onClick={() => setImageSrc(null)} />

                    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white relative z-20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Crop className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-900">Crop & Refine Logo</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setIsLightCropper(!isLightCropper)}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 text-gray-700"
                                >
                                   {isLightCropper ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}
                                   {isLightCropper ? 'Dark Board' : 'Light Board'}
                                </button>
                                <button onClick={() => setImageSrc(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className={`flex-1 relative flex min-h-[300px] transition-colors duration-300 ${isLightCropper ? 'bg-gray-50' : 'bg-gray-950'}`}>
                            <div className="flex-1 relative">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={selectedAspect}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>

                            {/* Aspect Ratio Presets Sidebar */}
                            <div className={`w-24 backdrop-blur border-l p-4 flex flex-col gap-4 overflow-y-auto transition-colors duration-300 ${isLightCropper ? 'bg-white/80 border-gray-200' : 'bg-gray-900/50 border-gray-800'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest text-center mb-2 ${isLightCropper ? 'text-gray-400' : 'text-gray-500'}`}>Aspect</p>
                                {ASPECT_RATIO_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setSelectedAspect(opt.value)}
                                        className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${selectedAspect === opt.value
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                : isLightCropper 
                                                    ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200' 
                                                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.08]'
                                            }`}
                                    >
                                        <div className={`border-2 rounded ${selectedAspect === opt.value ? 'border-white' : (isLightCropper ? 'border-gray-400' : 'border-gray-600')} ${opt.label === 'Square' ? 'w-6 h-6' :
                                                opt.label === '16:9' ? 'w-8 h-4.5' :
                                                    opt.label === 'Free' ? 'w-6 h-6 border-dashed opacity-50' : 'w-7 h-5'
                                            }`} />
                                        <span className="text-[10px] font-medium uppercase">{opt.label}</span>
                                    </button>
                                ))}

                                <button
                                    onClick={() => setSelectedAspect(width / height)}
                                    className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${selectedAspect === width / height
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                            : isLightCropper 
                                                ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200' 
                                                : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.08]'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold leading-tight">Match<br />Header</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-white border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shrink-0">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <ZoomIn className="w-4 h-4 text-primary" />
                                        Level of Zoom
                                    </div>
                                    <span className="text-sm font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{zoom.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setImageSrc(null)}
                                    disabled={isLoading}
                                    className="px-8 py-3.5 rounded-2xl text-gray-600 hover:bg-gray-100 font-bold transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isLoading}
                                    className="px-10 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/30 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Crop & Apply Logo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
