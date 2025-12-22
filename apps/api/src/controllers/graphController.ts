import { Request, Response } from "express";
import { Graph, Node } from "@repo/shared";
import { SupabaseService } from "../services/supabaseService";

export class GraphController {
    static async saveGraph(req: Request, res: Response) {
        try {
            const { nodes, edges } = req.body;
            const graph = new Graph();

            // Reconstruct graph from request body
            if (nodes && Array.isArray(nodes)) {
                const labelSet = new Set<string>();
                for (const n of nodes) {
                    if (!n.label || n.label.trim() === "") {
                        res.status(400).json({ success: false, error: "Node names cannot be empty." });
                        return;
                    }
                    if (labelSet.has(n.label)) {
                        res.status(400).json({ success: false, error: `Duplicate node name found: "${n.label}". Node names must be unique.` });
                        return;
                    }
                    labelSet.add(n.label);

                    const node = new Node(n.id, n.label, n.x, n.y, n.properties);
                    graph.addNode(node);
                }
            }

            if (edges && Array.isArray(edges)) {
                edges.forEach((e: any) => {
                    // Handle both { sourceId, targetId } (new) and { source, target } (legacy/shared potentially)
                    const sourceId = e.sourceId || (typeof e.source === 'object' ? e.source.id : e.source);
                    const targetId = e.targetId || (typeof e.target === 'object' ? e.target.id : e.target);

                    if (sourceId && targetId) {
                        graph.addEdge(sourceId, targetId);
                    }
                });
            }

            const service = SupabaseService.getInstance();
            await service.saveGraph(graph);

            console.log(`[API] Saved ${graph.getNodes().length} nodes and ${graph.getEdges().length} edges.`);
            res.json({ success: true, message: "Graph saved to Supabase" });
        } catch (error) {
            console.error("Save error:", error);
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async loadGraph(req: Request, res: Response) {
        try {
            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();

            console.log(`[API] Loaded ${graph.getNodes().length} nodes and ${graph.getEdges().length} edges.`);

            res.json({
                nodes: graph.getNodes(),
                edges: graph.getEdges().map(e => ({
                    sourceId: e.source.id,
                    targetId: e.target.id,
                    weight: e.weight
                })),
            });
        } catch (error) {
            console.error("Load error:", error);
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async testGraph(req: Request, res: Response) {
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
    }
}
