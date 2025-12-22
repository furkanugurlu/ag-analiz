import React from 'react';
import { useGraphStore } from '../store/useGraphStore';

interface PropertiesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PropertiesModal: React.FC<PropertiesModalProps> = ({ isOpen, onClose }) => {
    const {
        selectedNode,
        nodes,
        edges,
        updateNodeProperty,
        updateNodeLabel,
        openModal
    } = useGraphStore();

    if (!isOpen || !selectedNode) return null;

    const connectionCount = edges.filter(e => e.sourceId === selectedNode.id || e.targetId === selectedNode.id).length;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-96 bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Özellik Paneli
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">ID</label>
                        <div className="text-xs font-mono bg-gray-800/50 p-2 rounded text-gray-300 truncate border border-gray-700/50">{selectedNode.id}</div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Etiket (Tıkla ve Düzenle)</label>
                        <div
                            onClick={() => openModal({
                                title: "Etiket Düzenle",
                                message: "Yeni etiket adını girin:",
                                type: "input",
                                inputPlaceholder: selectedNode.label,
                                onConfirm: (val) => {
                                    if (val) updateNodeLabel(selectedNode.id, val);
                                }
                            })}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg p-2.5 text-white hover:border-blue-500/50 hover:bg-gray-800 transition-all cursor-pointer flex justify-between items-center group"
                        >
                            <span>{selectedNode.label}</span>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </div>
                    </div>

                    <div className="border-t border-gray-700/50 pt-4 mt-4">
                        <h3 className="font-semibold mb-3 text-gray-300 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            Properties
                        </h3>

                        <div className="flex items-center justify-between mb-4 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                            <label className="text-sm text-gray-400">Aktiflik Durumu</label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="toggle"
                                    id="toggle-modal"
                                    checked={selectedNode.properties.isActive}
                                    onChange={(e) => updateNodeProperty(selectedNode.id, 'isActive', e.target.checked)}
                                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out transform checked:translate-x-full checked:border-blue-600"
                                />
                                <label htmlFor="toggle-modal" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${selectedNode.properties.isActive ? 'bg-blue-600' : 'bg-gray-600'}`}></label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm text-gray-400">Etkileşim</label>
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">{selectedNode.properties.interactionCount}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={selectedNode.properties.interactionCount}
                                onChange={(e) => updateNodeProperty(selectedNode.id, 'interactionCount', e.target.value)}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm text-gray-400 mb-1">Bağlantı Sayısı (Hesaplanan)</label>
                            <div className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg p-2.5 text-white font-mono">
                                {connectionCount}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertiesModal;
