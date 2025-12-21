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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
