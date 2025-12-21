'use client';

import { useState, useEffect } from 'react';
import GraphCanvas from '../components/GraphCanvas';
import { INode, IEdge } from '@repo/shared';

export default function Home() {
  const [nodes, setNodes] = useState<INode[]>([]);
  const [edges, setEdges] = useState<IEdge[]>([]);

  useEffect(() => {
    // Example fetch - replace with your actual API endpoint later
    // For now we can test with the text-graph endpoint we made
    fetch('http://localhost:3001/test-graph')
      .then(res => res.json())
      .then(data => {
        setNodes(data.nodes);
        setEdges(data.edges);
      })
      .catch(err => console.error("Failed to fetch graph:", err));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-600 mb-8">
        Ağ Analizi Projesi
      </h1>

      <div className="w-full max-w-4xl">
        <GraphCanvas nodes={nodes} edges={edges} width={800} height={600} />
      </div>

      <div className="mt-8 flex gap-4">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium">
          Düğüm Ekle
        </button>
        <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium">
          Kaydet
        </button>
      </div>
    </main>
  );
}
