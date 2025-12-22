import React from 'react';

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = "İşlem Yapılıyor..." }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4 p-8 bg-gray-900/90 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl transform scale-100 transition-transform">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-blue-200 font-medium animate-pulse text-lg">{message}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
