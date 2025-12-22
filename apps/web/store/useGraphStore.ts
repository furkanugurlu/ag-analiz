import axios from 'axios';
import { INode, IEdge, Graph } from '@repo/shared';
import { create } from 'zustand';

// Axios Instance
const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
});

interface GraphAnalysisState {
    // Data State
    nodes: INode[];
    edges: IEdge[];
    selectedNode: INode | null;

    // UI State
    loading: boolean;
    algoLoading: boolean;
    algoResults: {
        type: string;
        data: any;
        executionTimeMs: number;
    } | null;
    customColors: Record<string, string>;
    highlightedPath: string[];

    // Modal State
    modal: {
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'success' | 'error' | 'confirm' | 'input';
        onConfirm?: (val?: string) => void;
        inputPlaceholder?: string;
    };

    // Actions
    fetchGraph: () => Promise<void>;
    saveGraph: () => Promise<void>;

    // Node Operations
    setNodes: (nodes: INode[]) => void;
    addNode: (x: number, y: number) => void;
    deleteNode: (id: string) => void;
    addEdge: (sourceId: string, targetId: string) => void;
    deleteEdge: (sourceId: string, targetId: string) => void;
    updateNodePos: (id: string, x: number, y: number) => void;
    selectNode: (node: INode | null) => void;
    updateNodeProperty: (id: string, key: string, value: any) => void;
    updateNodeLabel: (id: string, label: string) => void;

    // Algorithm Operations
    runBFS: () => Promise<void>;
    runDFS: () => Promise<void>;
    runShortestPath: (targetLabelOrId: string) => Promise<void>;
    runCentrality: () => Promise<void>;
    runCommunities: () => Promise<void>;
    runColoring: () => Promise<void>;

    // Export/Import Operations
    exportGraphJSON: () => void;
    exportGraphCSV: () => void;
    importGraphJSON: (file: File) => void;
    getAdjacencyList: () => Record<string, string[]>;
    getAdjacencyMatrix: () => { labels: string[], matrix: number[][] };

    // Modal Actions
    openModal: (params: Partial<GraphAnalysisState['modal']>) => void;
    closeModal: () => void;
}

export const useGraphStore = create<GraphAnalysisState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    loading: false,
    algoLoading: false,
    algoResults: null,
    customColors: {},
    highlightedPath: [],
    modal: { isOpen: false, title: '', message: '', type: 'info' },

    setNodes: (nodes) => set({ nodes }),

    fetchGraph: async () => {
        set({ loading: true });
        try {
            const { data } = await api.get('/graph/load');
            set({
                nodes: data.nodes || [],
                edges: data.edges || [],
                loading: false
            });
        } catch (error: any) {
            set({ loading: false });
            get().openModal({
                title: 'Hata',
                message: 'Veri yüklenemedi: ' + error.message,
                type: 'error'
            });
        }
    },

    saveGraph: async () => {
        set({ loading: true });
        try {
            const { nodes, edges } = get();
            await api.post('/graph/save', { nodes, edges });
            get().openModal({ title: 'Başarılı', message: 'Veriler kaydedildi.', type: 'success' });
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Kaydetme başarısız: ' + error.message, type: 'error' });
        } finally {
            set({ loading: false });
        }
    },

    addNode: (x, y) => {
        const { nodes } = get();
        let counter = nodes.length + 1;
        let label = `Node ${counter}`;
        while (nodes.some(n => n.label === label)) {
            counter++;
            label = `Node ${counter}`;
        }

        const newNode: INode = {
            id: crypto.randomUUID(),
            label,
            x,
            y,
            properties: { isActive: true, activity: 0, interactionCount: 0, connectionCount: 0 }
        };
        set({ nodes: [...nodes, newNode] });
    },

    addEdge: (sourceId, targetId) => {
        const { edges, nodes } = get();
        const exists = edges.some(e =>
            (e.sourceId === sourceId && e.targetId === targetId) ||
            (e.sourceId === targetId && e.targetId === sourceId)
        );

        if (exists) {
            get().openModal({ title: 'Bilgi', message: 'Bu bağlantı zaten mevcut.', type: 'info' });
            return;
        }

        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);

        const newEdge: IEdge = {
            id: crypto.randomUUID(),
            sourceId,
            targetId,
        };

        if (sourceNode && targetNode) {
            const d1 = (sourceNode.properties.activity || 0) - (targetNode.properties.activity || 0);
            const d2 = (sourceNode.properties.interactionCount || 0) - (targetNode.properties.interactionCount || 0);
            const d3 = (sourceNode.properties.connectionCount || 0) - (targetNode.properties.connectionCount || 0);
            const dist = Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3);
            (newEdge as any).weight = 1 / (1 + dist);
        }

        set({ edges: [...edges, newEdge] });
    },

    updateNodePos: (id, x, y) => {
        const { nodes, selectedNode } = get();
        const updatedNodes = nodes.map(n => n.id === id ? { ...n, x, y } : n);
        set({ nodes: updatedNodes });

        if (selectedNode && selectedNode.id === id) {
            set({ selectedNode: { ...selectedNode, x, y } });
        }
    },

    selectNode: (node) => set({ selectedNode: node }),

    updateNodeProperty: (id, key, value) => {
        const { nodes, selectedNode } = get();
        if (key === 'interactionCount' || key === 'connectionCount' || key === 'activity') {
            value = parseFloat(value) || 0;
        }
        const updatedNodes = nodes.map(n => {
            if (n.id === id) {
                const updatedProps = { ...n.properties, [key]: value };
                const updatedNode = { ...n, properties: updatedProps };
                if (selectedNode && selectedNode.id === id) {
                    set({ selectedNode: updatedNode });
                }
                return updatedNode;
            }
            return n;
        });
        set({ nodes: updatedNodes });
    },

    updateNodeLabel: (id, label) => {
        const { nodes, selectedNode } = get();
        if (!label || label.trim() === "") {
            setTimeout(() => get().openModal({ title: 'Hata', message: 'Düğüm ismi boş olamaz.', type: 'error' }), 100);
            return;
        }
        const exists = nodes.some(n => n.id !== id && n.label === label);
        if (exists) {
            setTimeout(() => get().openModal({
                title: 'Hata',
                message: 'Bu isimde bir düğüm zaten var. Benzersiz bir isim seçin.',
                type: 'error'
            }), 100);
            return;
        }
        const updatedNodes = nodes.map(n => {
            if (n.id === id) {
                const updatedNode = { ...n, label };
                if (selectedNode && selectedNode.id === id) {
                    set({ selectedNode: updatedNode });
                }
                return updatedNode;
            }
            return n;
        });
        set({ nodes: updatedNodes });
    },

    runBFS: async () => {
        const { selectedNode } = get();
        if (!selectedNode) {
            get().openModal({ title: 'Uyarı', message: 'Lütfen başlangıç düğümü seçin.', type: 'error' });
            return;
        }
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get(`/algorithm/bfs/${selectedNode.id}`);
            const visitOrder = data.visitedOrder as string[];
            set({ algoResults: { type: 'BFS', data: data, executionTimeMs: data.executionTimeMs } });
            let currentColors: Record<string, string> = {};
            for (let i = 0; i < visitOrder.length; i++) {
                const nodeId = visitOrder[i] as string;
                currentColors = { ...currentColors, [nodeId]: '#3B82F6' };
                set({ customColors: currentColors });
                await new Promise(r => setTimeout(r, 200));
            }
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runDFS: async () => {
        const { selectedNode } = get();
        if (!selectedNode) {
            get().openModal({ title: 'Uyarı', message: 'Lütfen başlangıç düğümü seçin.', type: 'error' });
            return;
        }
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get(`/algorithm/dfs/${selectedNode.id}`);
            const visitOrder = data.visitedOrder as string[];
            set({ algoResults: { type: 'DFS', data: data, executionTimeMs: data.executionTimeMs } });
            let currentColors: Record<string, string> = {};
            for (let i = 0; i < visitOrder.length; i++) {
                const nodeId = visitOrder[i] as string;
                currentColors = { ...currentColors, [nodeId]: '#8B5CF6' };
                set({ customColors: currentColors });
                await new Promise(r => setTimeout(r, 200));
            }
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runShortestPath: async (targetIdentifier) => {
        const { selectedNode, nodes } = get();
        if (!selectedNode) {
            get().openModal({ title: 'Uyarı', message: 'Başlangıç düğümü seçiniz.', type: 'error' });
            return;
        }
        const targetNode = nodes.find(n => n.id === targetIdentifier || n.label === targetIdentifier);
        if (!targetNode) {
            setTimeout(() => get().openModal({ title: 'Hata', message: 'Hedef düğüm bulunamadı.', type: 'error' }), 100);
            return;
        }
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get(`/algorithm/dijkstra/${selectedNode.id}/${targetNode.id}`);
            set({ algoResults: { type: 'Dijkstra', data: data, executionTimeMs: data.executionTimeMs } });
            if (data.path && data.path.length > 0) {
                set({ highlightedPath: data.path });
                get().openModal({ title: 'Yol Bulundu', message: `Toplam Maliyet: ${data.cost.toFixed(2)}`, type: 'success' });
            } else {
                get().openModal({ title: 'Sonuç', message: 'Yol bulunamadı.', type: 'info' });
            }
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runCentrality: async () => {
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get('/algorithm/centrality/degree');
            set({ algoResults: { type: 'Centrality', data: data, executionTimeMs: data.executionTimeMs } });
            const colorMap: Record<string, string> = {};
            data.topNodes.forEach((node: any, idx: number) => {
                const intensity = 100 - (idx * 15);
                colorMap[node.id] = `rgba(251, 191, 36, ${intensity / 100})`;
            });
            set({ customColors: colorMap });
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runCommunities: async () => {
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get('/algorithm/communities');
            set({ algoResults: { type: 'Communities', data: data, executionTimeMs: data.executionTimeMs } });
            const palette = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#2DD4BF', '#FB923C'];
            const colorMap: Record<string, string> = {};
            data.communities.forEach((community: string[], idx: number) => {
                const color = palette[idx % palette.length] || '#FFFFFF';
                community.forEach(nodeId => {
                    colorMap[nodeId] = color;
                });
            });
            set({ customColors: colorMap });
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runColoring: async () => {
        set({ algoLoading: true, customColors: {}, highlightedPath: [] });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get('/algorithm/coloring/welsh-powell');
            set({ algoResults: { type: 'Coloring', data: data, executionTimeMs: data.executionTimeMs } });
            const colors = data.colors as Record<string, number>;
            const palette = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];
            const colorMap: Record<string, string> = {};
            Object.keys(colors).forEach(id => {
                const colorCode = colors[id];
                colorMap[id] = palette[(colorCode - 1) % palette.length] || '#FFFFFF';
            });
            set({ customColors: colorMap });
            get().openModal({ title: 'Tamamlandı', message: 'Renklendirme tamamlandı.', type: 'success' });
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    openModal: (params) => set((state) => ({ modal: { ...state.modal, isOpen: true, ...params } })),
    closeModal: () => set((state) => ({ modal: { ...state.modal, isOpen: false } })),

    deleteNode: (id) => {
        const { nodes, edges, selectedNode } = get();
        const updatedNodes = nodes.filter(n => n.id !== id);
        const updatedEdges = edges.filter(e => e.sourceId !== id && e.targetId !== id);
        set({
            nodes: updatedNodes,
            edges: updatedEdges,
            selectedNode: selectedNode?.id === id ? null : selectedNode
        });
        get().openModal({ title: 'Silindi', message: 'Düğüm ve bağlantıları silindi.', type: 'success' });
    },

    deleteEdge: (sourceId, targetId) => {
        const { edges } = get();
        const updatedEdges = edges.filter(e =>
            !((e.sourceId === sourceId && e.targetId === targetId) ||
                (e.sourceId === targetId && e.targetId === sourceId))
        );
        if (updatedEdges.length === edges.length) {
            get().openModal({ title: 'Bilgi', message: 'Bağlantı bulunamadı.', type: 'info' });
            return;
        }
        set({ edges: updatedEdges });
        get().openModal({ title: 'Silindi', message: 'Bağlantı silindi.', type: 'success' });
    },

    getAdjacencyList: () => {
        const { nodes, edges } = get();
        const adjList: Record<string, string[]> = {};
        nodes.forEach(node => { adjList[node.label] = []; });
        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.sourceId);
            const targetNode = nodes.find(n => n.id === edge.targetId);
            if (sourceNode && targetNode) {
                adjList[sourceNode.label]?.push(targetNode.label);
                adjList[targetNode.label]?.push(sourceNode.label);
            }
        });
        return adjList;
    },

    getAdjacencyMatrix: () => {
        const { nodes, edges } = get();
        const labels = nodes.map(n => n.label);
        const dimension = nodes.length;
        const matrix: number[][] = Array(dimension).fill(null).map(() => Array(dimension).fill(0));
        const idToIndex: Record<string, number> = {};
        nodes.forEach((node, idx) => { idToIndex[node.id] = idx; });
        edges.forEach(edge => {
            const i = idToIndex[edge.sourceId];
            const j = idToIndex[edge.targetId];
            if (i !== undefined && j !== undefined) {
                matrix[i]![j] = 1;
                matrix[j]![i] = 1;
            }
        });
        return { labels, matrix };
    },

    exportGraphJSON: () => {
        const { nodes, edges } = get();
        const exportData = {
            nodes,
            edges: edges.map(e => ({
                source: nodes.find(n => n.id === e.sourceId)?.label || e.sourceId,
                target: nodes.find(n => n.id === e.targetId)?.label || e.targetId,
                weight: (e as any).weight || 1
            })),
            adjacencyList: get().getAdjacencyList(),
            adjacencyMatrix: get().getAdjacencyMatrix()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    exportGraphCSV: () => {
        const { nodes, edges } = get();
        let csv = "ID,Label,X,Y,Activity,Interaction,Connection\n";
        nodes.forEach(n => {
            csv += `${n.id},${n.label},${n.x},${n.y},${n.properties.activity},${n.properties.interactionCount},${n.properties.connectionCount}\n`;
        });
        csv += "\nSource,Target,Weight\n";
        edges.forEach(e => {
            csv += `${e.sourceId},${e.targetId},${(e as any).weight || 1}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph_${new Date().getTime()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importGraphJSON: (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                set({
                    nodes: data.nodes || [],
                    edges: data.edges || [],
                    selectedNode: null,
                    customColors: {},
                    highlightedPath: []
                });
                get().openModal({ title: 'Başarılı', message: 'Graf yüklendi.', type: 'success' });
            } catch (err) {
                get().openModal({ title: 'Hata', message: 'JSON okunamadı.', type: 'error' });
            }
        };
        reader.readAsText(file);
    },
}));
