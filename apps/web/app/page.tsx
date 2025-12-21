'use client';

import { useState, useEffect } from 'react';
import GraphCanvas from '../components/GraphCanvas';
import { INode, IEdge } from '@repo/shared';

export default function Home() {
  const [nodes, setNodes] = useState<INode[]>([]);
  const [edges, setEdges] = useState<IEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<INode | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/test-graph')
      .then(res => res.json())
      .then(data => {
        // Apply initial layout here if needed, or let canvas handle visual fallback
        // For data consistency, we'll let them start at 0,0 and updated via interaction
        setNodes(data.nodes);
        setEdges(data.edges);
      })
      .catch(err => console.error("Failed to fetch graph:", err));
  }, []);

  const handleNodeMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
    if (selectedNode && selectedNode.id === id) {
      setSelectedNode(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const handleNodeSelect = (node: INode | null) => {
    setSelectedNode(node);
  };

  const handleNodeAdd = (x: number, y: number) => {
    const newNode: INode = {
      id: crypto.randomUUID(),
      label: `Node ${nodes.length + 1}`,
      x,
      y,
      properties: { isActive: true, interactionCount: 0, connectionCount: 0 }
    };
    setNodes(prev => [...prev, newNode]);
  };

  const updateNodeProperty = (key: string, value: any) => {
    if (!selectedNode) return;

    const updatedProps = { ...selectedNode.properties, [key]: value };
    const updatedNode = { ...selectedNode, properties: updatedProps };

    setSelectedNode(updatedNode);
    setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
  };

  return (
    <main className="flex min-h-screen p-8 bg-gradient-to-br from-gray-900 to-black text-white gap-8">

      <div className="flex-grow flex flex-col items-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-600 mb-8">
          Ağ Analizi Projesi
        </h1>

        <div className="w-full max-w-4xl">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            width={800}
            height={600}
            onNodeMove={handleNodeMove}
            onNodeSelect={handleNodeSelect}
            onNodeAdd={handleNodeAdd}
          />
        </div>

        <div className="mt-8 flex gap-4">
          <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium">
            Kaydet (Database)
          </button>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 rounded-xl p-6 border border-gray-700 h-fit shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-blue-400">Özellik Paneli</h2>
        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID</label>
              <div className="text-xs font-mono bg-gray-900 p-2 rounded text-gray-300 truncate">{selectedNode.id}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Etiket</label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => {
                  const updated = { ...selectedNode, label: e.target.value };
                  setSelectedNode(updated);
                  setNodes(prev => prev.map(n => n.id === selectedNode.id ? updated : n));
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="font-semibold mb-2 text-gray-300">Properties</h3>

              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-400">Aktiflik</label>
                <input
                  type="checkbox"
                  checked={selectedNode.properties.isActive}
                  onChange={(e) => updateNodeProperty('isActive', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-900"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Etkileşim</label>
                <input
                  type="number"
                  value={selectedNode.properties.interactionCount}
                  onChange={(e) => updateNodeProperty('interactionCount', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Bağlantı Sayısı</label>
                <input
                  type="number"
                  value={selectedNode.properties.connectionCount}
                  onChange={(e) => updateNodeProperty('connectionCount', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Düzenlemek için bir düğüme tıklayın.</p>
        )}
      </div>

    </main>
  );
}
