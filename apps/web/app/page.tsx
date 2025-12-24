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
  const [mounted, setMounted] = useState(false);
  const panelHeights = "lg:h-[90vh]";

  useEffect(() => {
    setMounted(true);
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const fallbackHeight = typeof window !== "undefined" ? window.innerHeight * 0.7 : 600;
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || fallbackHeight
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
    exportGraphJSON, exportGraphCSV, deleteNode, importGraphJSON, generateSmallGraph, generateMediumGraph, clearGraph, autoLayout
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

  const viewportHeight = mounted && typeof window !== "undefined" ? window.innerHeight : 900;
  const canvasHeight = mounted ? Math.max(320, Math.min(canvasSize.height, viewportHeight * 0.8)) : 600;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 font-sans overflow-x-hidden">
      <div className="mb-2 md:mb-4 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Sosyal Ağ Analizi
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl text-sm md:text-base">
          Graf yapılarını kullanarak etkileşimleri analiz edin, toplulukları keşfedin ve en kısa yolları hesaplayın.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-2 sm:mb-4">
        <button onClick={generateSmallGraph} className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-all">
          Küçük (10-20)
        </button>
        <button onClick={generateMediumGraph} className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-all">
          Orta (50-100)
        </button>
        <button onClick={clearGraph} className="w-full sm:w-auto px-4 py-2.5 bg-rose-900 border border-rose-700 rounded-lg text-sm font-medium text-rose-100 hover:bg-rose-800 transition-all">
          Temizle
        </button>
        <button onClick={autoLayout} className="w-full sm:w-auto px-4 py-2.5 bg-emerald-800 border border-emerald-700 rounded-lg text-sm font-medium text-emerald-100 hover:bg-emerald-700 transition-all">
          Düzenle
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full mt-2">
        <div className="flex flex-col xl:flex-row gap-4 flex-1 min-w-0">
          {algoResults && (
            <div className={`results-wrapper w-full xl:w-80 shrink-0 bg-gray-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl overflow-hidden ${panelHeights}`}>
              <ResultsTable />
            </div>
          )}
          <div
            ref={containerRef}
            className={`flex-1 w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-3xl shadow-2xl backdrop-blur-md relative group overflow-hidden ${panelHeights}`}
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
              height={canvasHeight}
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

        <div className={`w-full lg:w-96 shrink-0 lg:self-stretch ${panelHeights}`}>
          <PropertiesPanel className="h-full" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 z-10 w-full max-w-full">
        <button onClick={runBFS} className="px-4 py-3 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 rounded-xl transition-all font-medium text-blue-300 text-sm w-full">
          BFS
        </button>
        <button onClick={runDFS} className="px-4 py-3 bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/20 rounded-xl transition-all font-medium text-purple-300 text-sm w-full">
          DFS
        </button>
        <button onClick={handleRunShortestPath} className="px-4 py-3 bg-orange-600/10 border border-orange-500/30 hover:bg-orange-600/20 rounded-xl transition-all font-medium text-orange-300 text-sm w-full">
          Dijkstra / A*
        </button>
        <button onClick={runCentrality} className="px-4 py-3 bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 rounded-xl transition-all font-medium text-amber-300 text-sm w-full">
          Merkezilik (Top 5)
        </button>
        <button onClick={runCommunities} className="px-4 py-3 bg-cyan-600/10 border border-cyan-500/30 hover:bg-cyan-600/20 rounded-xl transition-all font-medium text-cyan-300 text-sm w-full">
          Topluluklar
        </button>
        <button onClick={runColoring} className="px-4 py-3 bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600/20 rounded-xl transition-all font-medium text-rose-300 text-sm w-full">
          Renklendirme
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 justify-center sm:justify-start z-10 w-full mb-8">
        <button onClick={saveGraph} disabled={loading} className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/40 rounded-lg transition-all text-sm font-semibold text-emerald-300 flex items-center gap-2 justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Kaydet
        </button>
        <button onClick={exportGraphJSON} className="w-full sm:w-auto px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2 transition-all justify-center">
          JSON Dışa Aktar
        </button>
        <button onClick={exportGraphCSV} className="w-full sm:w-auto px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2 transition-all justify-center">
          CSV Dışa Aktar
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2 transition-all justify-center">
          JSON İçe Aktar
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { importGraphJSON(file); e.target.value = ''; }
        }} />
      </div>

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
      <style jsx>{`
      `}</style>
    </main>
  );
}
