import express from "express";
import { Graph, Node, Edge } from "@repo/shared";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/", (req, res) => {
    const fileID = "2526G";
    console.log(`Log: processing ${fileID}`);
    res.json({ message: "API Running", file: fileID });
});

app.get("/test-graph", (req, res) => {
    const graph = new Graph();
    const nodeA = new Node("A", "Node A", 0, 0, { isActive: true, interactionCount: 10, connectionCount: 2 });
    const nodeB = new Node("B", "Node B", 10, 10, { isActive: true, interactionCount: 5, connectionCount: 1 });

    graph.addNode(nodeA);
    graph.addNode(nodeB);
    try {
        graph.addEdge(nodeA.id, nodeB.id);
    } catch (e) {
        console.error(e);
    }

    res.json({
        nodes: graph.getNodes(),
        edges: graph.getEdges(),
    });
});

import { SupabaseService } from "./services/supabaseService";

app.post("/graph/save", async (req, res) => {
    try {
        const { nodes, edges } = req.body;
        const graph = new Graph();

        // Reconstruct graph from request body
        if (nodes && Array.isArray(nodes)) {
            nodes.forEach((n: any) => {
                const node = new Node(n.id, n.label, n.x, n.y, n.properties);
                graph.addNode(node);
            });
        }

        if (edges && Array.isArray(edges)) {
            edges.forEach((e: any) => {
                // Assuming source and target in body are IDs
                const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
                const targetId = typeof e.target === 'object' ? e.target.id : e.target;
                graph.addEdge(sourceId, targetId);
            });
        }

        const service = SupabaseService.getInstance();
        await service.saveGraph(graph);

        res.json({ success: true, message: "Graph saved to Supabase" });
    } catch (error) {
        console.error("Save error:", error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

app.get("/graph/load", async (req, res) => {
    try {
        const service = SupabaseService.getInstance();
        const graph = await service.loadGraph();

        res.json({
            nodes: graph.getNodes(),
            edges: graph.getEdges(),
        });
    } catch (error) {
        console.error("Load error:", error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

import { GraphAlgorithms } from "./algorithms/graphAlgorithms";

app.get("/algorithm/bfs/:startNodeId", async (req, res) => {
    try {
        const { startNodeId } = req.params;
        const service = SupabaseService.getInstance();

        // Load current graph state from DB to ensure we run algo on persistent data
        const graph = await service.loadGraph();

        const visitOrder = GraphAlgorithms.bfs(graph, startNodeId);

        res.json({
            algorithm: "BFS",
            startNode: startNodeId,
            visitedOrder: visitOrder
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get("/algorithm/dfs/:startNodeId", async (req, res) => {
    try {
        const { startNodeId } = req.params;
        const service = SupabaseService.getInstance();

        // Load current graph state from DB
        const graph = await service.loadGraph();

        const visitOrder = GraphAlgorithms.dfs(graph, startNodeId);

        res.json({
            algorithm: "DFS",
            startNode: startNodeId,
            visitedOrder: visitOrder
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get("/algorithm/dijkstra/:startNodeId/:endNodeId", async (req, res) => {
    try {
        const { startNodeId, endNodeId } = req.params;
        const service = SupabaseService.getInstance();

        const graph = await service.loadGraph();
        const result = GraphAlgorithms.dijkstra(graph, startNodeId, endNodeId);

        res.json({
            algorithm: "Dijkstra",
            startNode: startNodeId,
            endNode: endNodeId,
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get("/algorithm/astar/:startNodeId/:endNodeId", async (req, res) => {
    try {
        const { startNodeId, endNodeId } = req.params;
        const service = SupabaseService.getInstance();

        const graph = await service.loadGraph();
        const result = GraphAlgorithms.astar(graph, startNodeId, endNodeId);

        res.json({
            algorithm: "A*",
            startNode: startNodeId,
            endNode: endNodeId,
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get("/algorithm/centrality/degree", async (req, res) => {
    try {
        const service = SupabaseService.getInstance();
        const graph = await service.loadGraph();

        // Default limit 5
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const result = GraphAlgorithms.degreeCentrality(graph, limit);

        res.json({
            algorithm: "Degree Centrality",
            topNodes: result
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get("/algorithm/coloring/welsh-powell", async (req, res) => {
    try {
        const service = SupabaseService.getInstance();
        const graph = await service.loadGraph();

        const colorMap = GraphAlgorithms.welshPowell(graph);

        // Convert Map to object for JSON response
        const result: Record<string, number> = {};
        colorMap.forEach((color, id) => {
            result[id] = color;
        });

        res.json({
            algorithm: "Welsh-Powell Coloring",
            colors: result
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
