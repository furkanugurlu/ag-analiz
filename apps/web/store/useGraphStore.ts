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
    addEdge: (sourceId: string, targetId: string) => void;
    updateNodePos: (id: string, x: number, y: number) => void;
    selectNode: (node: INode | null) => void;
    updateNodeProperty: (id: string, key: string, value: any) => void;
    updateNodeLabel: (id: string, label: string) => void;

    // Algorithm Operations
    runBFS: () => Promise<void>;
    runColoring: () => Promise<void>;
    runShortestPath: (targetLabelOrId: string) => Promise<void>;

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
    customColors: {},
    highlightedPath: [],
    modal: {
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    },

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
        try {
            const { nodes, edges } = get();
            await api.post('/graph/save', { nodes, edges });
            get().openModal({ title: 'Başarılı', message: 'Veriler kaydedildi.', type: 'success' });
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Kaydetme başarısız: ' + error.message, type: 'error' });
        }
    },

    addNode: (x, y) => {
        const { nodes } = get();
        const newNode: INode = {
            id: crypto.randomUUID(),
            label: `Node ${nodes.length + 1}`,
            x,
            y,
            properties: { isActive: true, interactionCount: 0, connectionCount: 0 }
        };
        set({ nodes: [...nodes, newNode] });
    },

    addEdge: (sourceId, targetId) => {
        const { edges, nodes } = get();
        // Check if edge already exists (undirected check)
        const exists = edges.some(e =>
            (e.sourceId === sourceId && e.targetId === targetId) ||
            (e.sourceId === targetId && e.targetId === sourceId)
        );

        if (exists) {
            get().openModal({ title: 'Bilgi', message: 'Bu bağlantı zaten mevcut.', type: 'info' });
            return;
        }

        // Calculate weight (using hypothetical node lookup and formula, or just default 1 for now)
        // The Edge calculations happen on backend or Shared, here we just add simple obj
        // We rely on backend to recalculate weights properly on save
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);

        // Weight calculation mockup on frontend for immediate feedback if we wanted
        // For now simple object (IEdge doesn't force weight in frontend usually if it's calculated, but let's check interface)
        // If interface doesn't have weight, we remove it. If it does, we keep it. 
        // Based on previous files, IEdge usually has it. But let's be safe.
        const newEdge: IEdge = {
            id: crypto.randomUUID(),
            sourceId,
            targetId,
            // We let backend handle weight calculation on save/load or implicit logic
        };

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

        if (key === 'interactionCount' || key === 'connectionCount') {
            value = parseInt(value) || 0;
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
            get().openModal({ title: 'Uyarı', message: 'Başlangıç düğümü seçiniz.', type: 'error' });
            return;
        }

        set({ algoLoading: true, customColors: {}, highlightedPath: [] });
        // AUTO SAVE
        try {
            await get().saveGraph();
        } catch (e) {
            console.error("Auto-save failed", e);
        }

        try {
            const { data } = await api.get(`/algorithm/bfs/${selectedNode.id}`);
            const visitOrder = data.visitedOrder as string[];

            let currentColors: Record<string, string> = {};
            for (let i = 0; i < visitOrder.length; i++) {
                const nodeId = visitOrder[i] as string;
                currentColors = { ...currentColors, [nodeId]: '#3B82F6' };
                set({ customColors: currentColors });
                await new Promise(r => setTimeout(r, 500));
            }

            get().openModal({ title: 'Tamamlandı', message: `BFS Gezintisi tamamlandı. ${visitOrder.length} düğüm ziyaret edildi.`, type: 'success' });
        } catch (error: any) {
            get().openModal({ title: 'Hata', message: 'Algoritma hatası: ' + error.message, type: 'error' });
        } finally {
            set({ algoLoading: false });
        }
    },

    runColoring: async () => {
        set({ algoLoading: true, customColors: {}, highlightedPath: [] });
        // AUTO SAVE
        try {
            await get().saveGraph();
        } catch (e) {
            console.error("Auto-save failed", e);
        }

        try {
            const { data } = await api.get('/algorithm/coloring/welsh-powell');
            const colors = data.colors as Record<string, number>;

            const palette = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];
            const colorMap: Record<string, string> = {};

            Object.keys(colors).forEach(id => {
                const colorCode = colors[id];
                if (colorCode !== undefined) {
                    colorMap[id] = palette[(colorCode - 1) % palette.length] || '#FFFFFF';
                }
            });

            set({ customColors: colorMap });
            get().openModal({ title: 'Tamamlandı', message: 'Renklendirme tamamlandı.', type: 'success' });
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
            get().openModal({ title: 'Hata', message: 'Hedef düğüm bulunamadı.', type: 'error' });
            return;
        }

        set({ algoLoading: true, customColors: {}, highlightedPath: [] });
        // AUTO SAVE
        try {
            await get().saveGraph();
        } catch (e) {
            console.error("Auto-save failed", e);
        }

        try {
            const { data } = await api.get(`/algorithm/dijkstra/${selectedNode.id}/${targetNode.id}`);

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

    openModal: (params) => set((state) => ({ modal: { ...state.modal, isOpen: true, ...params } })),
    closeModal: () => set((state) => ({ modal: { ...state.modal, isOpen: false } })),
}));
