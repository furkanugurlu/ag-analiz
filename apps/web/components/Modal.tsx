"use client";

import React, { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type?: 'info' | 'success' | 'error' | 'confirm' | 'input';
    message?: string;
    onConfirm?: (inputValue?: string) => void;
    inputPlaceholder?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    type = 'info',
    message,
    onConfirm,
    inputPlaceholder
}) => {
    const [inputValue, setInputValue] = useState("");
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            setInputValue("");
        } else {
            // Delay hide for animation
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!show && !isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"><svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>;
            case 'error': return <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></div>;
            default: return null;
        }
    };

    return (
        <div className={`fixed z-50 inset-0 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-900 opacity-75 backdrop-blur-sm" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className={`inline-block align-bottom bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {getIcon()}
                        <div className="sm:flex sm:items-start justify-center">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-xl leading-6 font-bold text-white text-center mb-2" id="modal-title">
                                    {title}
                                </h3>
                                {message && (
                                    <div className="mt-2 text-center">
                                        <p className="text-sm text-gray-300">
                                            {message}
                                        </p>
                                    </div>
                                )}
                                {type === 'input' && (
                                    <div className="mt-4">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={inputPlaceholder}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-700">
                        {(type === 'confirm' || type === 'input') && (
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                onClick={() => {
                                    if (type === 'input' && !inputValue.trim()) return;
                                    onConfirm?.(type === 'input' ? inputValue : undefined);
                                    onClose();
                                }}
                            >
                                {type === 'input' ? 'Onayla' : 'Onayla'}
                            </button>
                        )}
                        {(type === 'info' || type === 'success' || type === 'error') && (
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                onClick={onClose}
                            >
                                Tamam
                            </button>
                        )}
                        {(type === 'confirm' || type === 'input') && (
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                onClick={onClose}
                            >
                                İptal
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
