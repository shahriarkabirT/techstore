'use client';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    variant = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const confirmButtonClass = {
        danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
        warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
        info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    }[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-gray-600 mb-8">{message}</p>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 text-white rounded-md text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
