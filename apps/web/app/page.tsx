'use client';

import { useEffect, useRef, useState } from 'react';
import GraphCanvas from '../components/GraphCanvas';
import Modal from '../components/Modal';
import LoadingOverlay from '../components/LoadingOverlay';
import PropertiesPanel from '../components/PropertiesPanel';
import ResultsTable from '../components/ResultsTable';
import { useGraphStore } from '../store/useGraphStore';
import { INode } from '@repo/shared';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const {
    nodes, edges, selectedNode, loading, algoLoading, algoResults, customColors, highlightedPath, modal,
    fetchGraph, saveGraph, addNode, updateNodePos, selectNode, updateNodeProperty, updateNodeLabel, addEdge,
    runBFS, runDFS, runColoring, runShortestPath, runCentrality, runCommunities, openModal, closeModal,
    exportGraphJSON, exportGraphCSV, deleteNode, importGraphJSON
  } = useGraphStore();

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleNodeSelect = (node: INode | null) => {
    selectNode(node);
  };

  const handleRunShortestPath = () => {
    if (!selectedNode) {
      openModal({ title: "Uyarı", message: "Lütfen başlangıç düğümü seçin.", type: "error" });
      return;
    }
    openModal({
      title: "Hedef Düğüm Seçin",
      message: "Gitmek istediğiniz düğümün adını veya ID'sini girin.",
      type: "input",
      inputPlaceholder: "Örn: Node B",
      onConfirm: (val) => {
        if (val) runShortestPath(val);
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 flex flex-col md:flex-row gap-8 font-sans overflow-x-hidden">
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Sosyal Ağ Analizi
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-sm md:text-base">
            Graf yapılarını kullanarak etkileşimleri analiz edin, toplulukları keşfedin ve en kısa yolları hesaplayın.
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-6 items-start">
          {/* Results Table Overlay (if visible) */}
          {algoResults && (
            <div className="w-full lg:w-80 shrink-0 z-20">
              <ResultsTable />
            </div>
          )}

          <div
            ref={containerRef}
            className="flex-1 w-full min-h-[500px] md:min-h-[650px] bg-[#1e293b]/50 border border-slate-700/50 rounded-3xl shadow-2xl backdrop-blur-md relative group overflow-hidden"
          >
            {algoLoading && (
              <div className="absolute top-4 right-4 z-10 px-4 py-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 rounded-full text-yellow-300 font-mono text-xs animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                Algoritma Çalışıyor...
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 pointer-events-none" />

            <GraphCanvas
              nodes={nodes}
              edges={edges}
              width={canvasSize.width}
              height={800}
              onNodeMove={updateNodePos}
              onNodeSelect={handleNodeSelect}
              onNodeAdd={addNode}
              onEdgeAdd={addEdge}
              customNodeColors={customColors}
              highlightedPath={highlightedPath}
              selectedNodeId={selectedNode?.id}
            />
          </div>
        </div>

        {/* Algorithm Toolbar */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 z-10 w-full">
          <button onClick={runBFS} className="px-4 py-3 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 rounded-xl transition-all font-medium text-blue-300 text-sm">
            BFS
          </button>
          <button onClick={runDFS} className="px-4 py-3 bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/20 rounded-xl transition-all font-medium text-purple-300 text-sm">
            DFS
          </button>
          <button onClick={handleRunShortestPath} className="px-4 py-3 bg-orange-600/10 border border-orange-500/30 hover:bg-orange-600/20 rounded-xl transition-all font-medium text-orange-300 text-sm">
            Dijkstra / A*
          </button>
          <button onClick={runCentrality} className="px-4 py-3 bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 rounded-xl transition-all font-medium text-amber-300 text-sm">
            Merkezilik (Top 5)
          </button>
          <button onClick={runCommunities} className="px-4 py-3 bg-cyan-600/10 border border-cyan-500/30 hover:bg-cyan-600/20 rounded-xl transition-all font-medium text-cyan-300 text-sm">
            Topluluklar
          </button>
          <button onClick={runColoring} className="px-4 py-3 bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600/20 rounded-xl transition-all font-medium text-rose-300 text-sm">
            Renklendirme
          </button>
        </div>

        {/* File Operations Row */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center z-10 w-full mb-8">
          <button onClick={saveGraph} disabled={loading} className="px-6 py-2.5 bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/40 rounded-lg transition-all text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Kaydet
          </button>
          <button onClick={exportGraphJSON} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2 transition-all">
            JSON Dışa Aktar
          </button>
          <button onClick={exportGraphCSV} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2 transition-all">
            CSV Dışa Aktar
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2 transition-all">
            JSON İçe Aktar
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { importGraphJSON(file); e.target.value = ''; }
          }} />
        </div>
      </div>

      {/* Properties Panel (Sidebar) */}
      <PropertiesPanel />

      {/* Modals */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        inputPlaceholder={modal.inputPlaceholder}
      />

      <LoadingOverlay isLoading={loading} />
    </main>
  );
}
