'use client';

import React from 'react';
import { useGraphStore } from '../store/useGraphStore';

const ResultsTable: React.FC = () => {
    const { algoResults, nodes } = useGraphStore();

    if (!algoResults) return null;

    const getNodeLabel = (id: string) => nodes.find(n => n.id === id)?.label || id;

    const renderData = () => {
        const { type, data } = algoResults;

        switch (type) {
            case 'BFS':
            case 'DFS':
                return (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="py-2 px-4 text-gray-400 font-medium">Sıra</th>
                                <th className="py-2 px-4 text-gray-400 font-medium">Düğüm</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.visitedOrder.map((id: string, idx: number) => (
                                <tr key={id} className="border-b border-gray-800/50 hover:bg-gray-700/30 transition-colors">
                                    <td className="py-2 px-4 text-gray-300 font-mono">{idx + 1}</td>
                                    <td className="py-2 px-4 text-white">{getNodeLabel(id)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'Dijkstra':
                return (
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <span className="text-blue-300 font-medium">Toplam Maliyet: </span>
                            <span className="text-white font-mono">{data.cost.toFixed(4)}</span>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="py-2 px-4 text-gray-400 font-medium">Adım</th>
                                    <th className="py-2 px-4 text-gray-400 font-medium">Düğüm</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.path.map((id: string, idx: number) => (
                                    <tr key={id} className="border-b border-gray-800/50 hover:bg-gray-700/30 transition-colors">
                                        <td className="py-2 px-4 text-gray-300 font-mono">{idx + 1}</td>
                                        <td className="py-2 px-4 text-white">{getNodeLabel(id)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'Centrality':
                return (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="py-2 px-4 text-gray-400 font-medium">Sıralama</th>
                                <th className="py-2 px-4 text-gray-400 font-medium">Düğüm</th>
                                <th className="py-2 px-4 text-gray-400 font-medium">Derece</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topNodes.map((item: any, idx: number) => (
                                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-700/30 transition-colors">
                                    <td className="py-2 px-4 text-gray-300 font-mono">{idx + 1}</td>
                                    <td className="py-2 px-4 text-white font-medium">{getNodeLabel(item.id)}</td>
                                    <td className="py-2 px-4 text-emerald-400 font-mono">{item.degree}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'Communities':
                return (
                    <div className="space-y-4">
                        {data.communities.map((community: string[], idx: number) => (
                            <div key={idx} className="bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-gray-700/50 border-b border-gray-700 text-sm font-medium text-gray-200">
                                    Topluluk #{idx + 1} ({community.length} Düğüm)
                                </div>
                                <div className="p-3 flex flex-wrap gap-2">
                                    {community.map(id => (
                                        <span key={id} className="px-2 py-1 bg-gray-900/50 border border-gray-700 rounded text-xs text-gray-300">
                                            {getNodeLabel(id)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'Coloring':
                return (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="py-2 px-4 text-gray-400 font-medium">Düğüm</th>
                                <th className="py-2 px-4 text-gray-400 font-medium">Renk ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(data.colors).map(([id, color]) => (
                                <tr key={id} className="border-b border-gray-800/50 hover:bg-gray-700/30 transition-colors">
                                    <td className="py-2 px-4 text-white">{getNodeLabel(id)}</td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-600"
                                                style={{
                                                    backgroundColor: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'][(Number(color) - 1) % 6]
                                                }}
                                            />
                                            <span className="text-gray-300 font-mono">{color as any}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            default:
                return <pre className="text-xs text-gray-400 overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
        }
    };

    return (
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in max-h-[600px] flex flex-col">
            <div className="p-4 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Algoritma Sonuçları: {algoResults.type}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        Hesaplama Süresi: <span className="text-blue-400 font-mono">{algoResults.executionTimeMs}ms</span>
                    </p>
                </div>
                <button
                    onClick={() => useGraphStore.setState({ algoResults: null })}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">
                {renderData()}
            </div>
        </div>
    );
};

export default ResultsTable;
