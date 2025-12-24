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
    algoHistory: {
        type: string;
        data: any;
        executionTimeMs: number;
        timestamp: number;
    }[];
    customColors: Record<string, string>;
    highlightedPath: string[];
    playbackOrder: string[];
    playbackIndex: number;

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
    generateSmallGraph: () => void;
    generateMediumGraph: () => void;
    generateRandomGraph: (nodeCount: number) => void;
    clearGraph: () => void;
    autoLayout: () => void;

    // Algorithm Operations
    runBFS: () => Promise<void>;
    runDFS: () => Promise<void>;
    runShortestPath: (targetLabelOrId: string, algorithm?: 'dijkstra' | 'astar') => Promise<void>;
    runCentrality: () => Promise<void>;
    runCommunities: () => Promise<void>;
    runColoring: () => Promise<void>;

    // Export/Import Operations
    exportGraphJSON: () => void;
    exportGraphCSV: () => void;
    importGraphJSON: (file: File) => void;
    getAdjacencyList: () => Record<string, string[]>;
    getAdjacencyMatrix: () => { labels: string[], matrix: number[][] };
    animatePath: (path: string[], delay?: number) => Promise<void>;
    resetPlayback: (order: string[]) => void;
    stepPlayback: (direction: 1 | -1) => void;

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
    algoHistory: [],
    customColors: {},
    highlightedPath: [],
    playbackOrder: [],
    playbackIndex: -1,
    modal: { isOpen: false, title: '', message: '', type: 'info' },

    setNodes: (nodes) => set({ nodes }),

    generateSmallGraph: () => {
        const count = Math.floor(Math.random() * 11) + 10;
        get().generateRandomGraph(count);
    },

    generateMediumGraph: () => {
        const count = Math.floor(Math.random() * 51) + 50;
        get().generateRandomGraph(count);
    },

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

    generateRandomGraph: (nodeCount) => {
        const viewWidth = 1200;
        const viewHeight = 900;
        const margin = 50;
        const cols = Math.ceil(Math.sqrt(nodeCount));
        const rows = Math.ceil(nodeCount / cols);
        const cellW = Math.max((viewWidth - margin * 2) / cols, 1);
        const cellH = Math.max((viewHeight - margin * 2) / rows, 1);

        const nodes: INode[] = [];
        for (let i = 0; i < nodeCount; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const jitterX = (Math.random() - 0.5) * Math.min(cellW * 0.3, 30);
            const jitterY = (Math.random() - 0.5) * Math.min(cellH * 0.3, 30);
            const x = margin + c * cellW + cellW / 2 + jitterX;
            const y = margin + r * cellH + cellH / 2 + jitterY;

            nodes.push({
                id: crypto.randomUUID(),
                label: `Node ${i + 1}`,
                x,
                y,
                properties: {
                    isActive: Math.random() > 0.2,
                    activity: Math.random(),
                    interactionCount: Math.floor(Math.random() * 100),
                    connectionCount: 0
                }
            });
        }

        const edges: IEdge[] = [];
        const edgeExists = (a: string, b: string) =>
            edges.some(e => (e.sourceId === a && e.targetId === b) || (e.sourceId === b && e.targetId === a));

        const computeWeight = (a: INode, b: INode) => {
            const d1 = (a.properties.activity || 0) - (b.properties.activity || 0);
            const d2 = (a.properties.interactionCount || 0) - (b.properties.interactionCount || 0);
            const d3 = (a.properties.connectionCount || 0) - (b.properties.connectionCount || 0);
            const dist = Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3);
            return 1 / (1 + dist);
        };

        for (let i = 0; i < nodes.length; i++) {
            const targets = Math.floor(Math.random() * 3) + 1;
            for (let t = 0; t < targets; t++) {
                const targetIndex = Math.floor(Math.random() * nodes.length);
                if (targetIndex === i) continue;
                const sourceId = nodes[i].id;
                const targetId = nodes[targetIndex].id;
                if (edgeExists(sourceId, targetId)) continue;
                edges.push({
                    id: crypto.randomUUID(),
                    sourceId,
                    targetId,
                    weight: computeWeight(nodes[i], nodes[targetIndex])
                });
            }
        }

        const connectionCounts: Record<string, number> = {};
        edges.forEach(e => {
            connectionCounts[e.sourceId] = (connectionCounts[e.sourceId] || 0) + 1;
            connectionCounts[e.targetId] = (connectionCounts[e.targetId] || 0) + 1;
        });

        const updatedNodes = nodes.map(n => ({
            ...n,
            properties: { ...n.properties, connectionCount: connectionCounts[n.id] || 0 }
        }));

        set({ nodes: updatedNodes, edges, selectedNode: null, customColors: {}, highlightedPath: [], algoResults: null });
    },

    clearGraph: () => {
        set({ nodes: [], edges: [], selectedNode: null, customColors: {}, highlightedPath: [], algoResults: null });
    },

    autoLayout: () => {
        const { nodes } = get();
        if (!nodes.length) return;
        const viewWidth = 1200;
        const viewHeight = 900;
        const margin = 50;
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const rows = Math.ceil(nodes.length / cols);
        const cellW = Math.max((viewWidth - margin * 2) / cols, 1);
        const cellH = Math.max((viewHeight - margin * 2) / rows, 1);

        const laidOut = nodes.map((node, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const jitterX = (Math.random() - 0.5) * Math.min(cellW * 0.2, 20);
            const jitterY = (Math.random() - 0.5) * Math.min(cellH * 0.2, 20);
            const x = margin + c * cellW + cellW / 2 + jitterX;
            const y = margin + r * cellH + cellH / 2 + jitterY;
            return { ...node, x, y };
        });

        set({ nodes: laidOut, customColors: {}, highlightedPath: [], algoResults: null });
    },

    runBFS: async () => {
        const { selectedNode } = get();
        if (!selectedNode) {
            get().openModal({ title: 'Uyarı', message: 'Lütfen başlangıç düğümü seçin.', type: 'error' });
            return;
        }
        const prevResult = get().algoResults;
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null, playbackOrder: [], playbackIndex: -1 });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get(`/algorithm/bfs/${selectedNode.id}`);
            const visitOrder = data.visitedOrder as string[];
            const result = { type: 'BFS', data: data, executionTimeMs: data.executionTimeMs };
            set((state) => ({
                algoResults: result,
                algoHistory: [...(prevResult ? [{ ...prevResult, timestamp: Date.now() }] : []), ...state.algoHistory].slice(0, 2),
                playbackOrder: visitOrder,
                playbackIndex: -1,
                customColors: {},
                highlightedPath: []
            }));
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
        const prevResult = get().algoResults;
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null, playbackOrder: [], playbackIndex: -1 });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get(`/algorithm/dfs/${selectedNode.id}`);
            const visitOrder = data.visitedOrder as string[];
            const result = { type: 'DFS', data: data, executionTimeMs: data.executionTimeMs };
            set((state) => ({
                algoResults: result,
                algoHistory: [...(prevResult ? [{ ...prevResult, timestamp: Date.now() }] : []), ...state.algoHistory].slice(0, 2),
                playbackOrder: visitOrder,
                playbackIndex: -1,
                customColors: {},
                highlightedPath: []
            }));
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runShortestPath: async (targetIdentifier, algorithm = 'dijkstra') => {
        const { selectedNode, nodes, algoResults: prevResult } = get();
        if (!selectedNode) {
            get().openModal({ title: 'Uyarı', message: 'Başlangıç düğümü seçiniz.', type: 'error' });
            return;
        }
        const targetNode = nodes.find(n => n.id === targetIdentifier || n.label === targetIdentifier);
        if (!targetNode) {
            setTimeout(() => get().openModal({ title: 'Hata', message: 'Hedef düğüm bulunamadı.', type: 'error' }), 100);
            return;
        }
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null, playbackOrder: [], playbackIndex: -1 });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const endpoint = algorithm === 'astar' ? 'a-star' : 'dijkstra';
            const algoType = algorithm === 'astar' ? 'A*' : 'Dijkstra';
            const { data } = await api.get(`/algorithm/${endpoint}/${selectedNode.id}/${targetNode.id}`);
            const result = { type: algoType, data: data, executionTimeMs: data.executionTimeMs };
            set((state) => ({
                algoResults: result,
                algoHistory: [...(prevResult ? [{ ...prevResult, timestamp: Date.now() }] : []), ...state.algoHistory].slice(0, 2)
            }));
            if (data.path && data.path.length > 0) {
                await get().animatePath(data.path);
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
        const prevResult = get().algoResults;
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null, playbackOrder: [], playbackIndex: -1 });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get('/algorithm/centrality/degree');
            const result = { type: 'Centrality', data: data, executionTimeMs: data.executionTimeMs };
            set((state) => ({
                algoResults: result,
                algoHistory: [...(prevResult ? [{ ...prevResult, timestamp: Date.now() }] : []), ...state.algoHistory].slice(0, 2)
            }));
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
        const prevResult = get().algoResults;
        set({ algoLoading: true, customColors: {}, highlightedPath: [], algoResults: null, playbackOrder: [], playbackIndex: -1 });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get('/algorithm/communities');
            const result = { type: 'Communities', data: data, executionTimeMs: data.executionTimeMs };
            set((state) => ({
                algoResults: result,
                algoHistory: [...(prevResult ? [{ ...prevResult, timestamp: Date.now() }] : []), ...state.algoHistory].slice(0, 2)
            }));
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
        const prevResult = get().algoResults;
        set({ algoLoading: true, customColors: {}, highlightedPath: [], playbackOrder: [], playbackIndex: -1 });
        try { await get().saveGraph(); } catch (e) { console.error("Auto-save failed", e); }
        try {
            const { data } = await api.get('/algorithm/coloring/welsh-powell');
            const result = { type: 'Coloring', data: data, executionTimeMs: data.executionTimeMs };
            set((state) => ({
                algoResults: result,
                algoHistory: [...(prevResult ? [{ ...prevResult, timestamp: Date.now() }] : []), ...state.algoHistory].slice(0, 2)
            }));
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

    animatePath: async (path: string[], delay: number = 200) => {
        let colors: Record<string, string> = {};
        for (let i = 0; i < path.length; i++) {
            colors = { ...colors, [path[i]!]: '#FCD34D' };
            set({ customColors: colors, highlightedPath: path.slice(0, i + 1) });
            await new Promise(res => setTimeout(res, delay));
        }
    },

    resetPlayback: (order: string[]) => {
        set({ playbackOrder: order, playbackIndex: -1, customColors: {}, highlightedPath: [] });
    },

    stepPlayback: (direction: 1 | -1) => {
        const { playbackOrder, playbackIndex, algoResults } = get();
        if (!algoResults || (algoResults.type !== 'BFS' && algoResults.type !== 'DFS')) return;
        if (!playbackOrder.length) return;

        const nextIndex = Math.min(
            playbackOrder.length - 1,
            Math.max(-1, playbackIndex + direction)
        );
        if (nextIndex === playbackIndex) return;

        const color = algoResults.type === 'BFS' ? '#3B82F6' : '#8B5CF6';
        const visitedSlice = nextIndex >= 0 ? playbackOrder.slice(0, nextIndex + 1) : [];
        const colors: Record<string, string> = {};
        visitedSlice.forEach(id => { colors[id] = color; });

        set({
            playbackIndex: nextIndex,
            customColors: colors,
            highlightedPath: visitedSlice
        });
    },

    exportGraphJSON: () => {
        const { nodes, edges } = get();
        const exportData = {
            nodes,
            edges: edges.map(e => ({
                id: e.id,
                sourceId: e.sourceId,
                targetId: e.targetId,
                weight: (e as any).weight || 1,
                sourceLabel: nodes.find(n => n.id === e.sourceId)?.label || undefined,
                targetLabel: nodes.find(n => n.id === e.targetId)?.label || undefined
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
                const nodes = data.nodes || [];
                const labelToId: Record<string, string> = {};
                nodes.forEach((n: any) => { if (n?.label && n?.id) labelToId[n.label] = n.id; });

                const edges = (data.edges || []).flatMap((edge: any) => {
                    const src = edge.sourceId || edge.source || (edge.sourceLabel ? labelToId[edge.sourceLabel] : undefined);
                    const tgt = edge.targetId || edge.target || (edge.targetLabel ? labelToId[edge.targetLabel] : undefined);
                    if (!src || !tgt) return [];
                    return [{
                        id: edge.id || crypto.randomUUID(),
                        sourceId: src,
                        targetId: tgt,
                        weight: edge.weight ?? 1
                    }];
                });

                set({
                    nodes,
                    edges,
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
