import { Request, Response } from "express";
import { SupabaseService } from "../services/supabaseService";
import { GraphAlgorithms } from "../algorithms/graphAlgorithms";

export class AlgorithmController {
    static async runBFS(req: Request, res: Response) {
        try {
            const start = Date.now();
            const { startNodeId } = req.params;
            if (!startNodeId) {
                res.status(400).json({ error: "startNodeId is required" });
                return;
            }

            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const visitOrder = GraphAlgorithms.bfs(graph, startNodeId);
            const executionTime = Date.now() - start;

            res.json({
                algorithm: "BFS",
                startNode: startNodeId,
                visitedOrder: visitOrder,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async runDFS(req: Request, res: Response) {
        try {
            const start = Date.now();
            const { startNodeId } = req.params;
            if (!startNodeId) {
                res.status(400).json({ error: "startNodeId is required" });
                return;
            }

            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const visitOrder = GraphAlgorithms.dfs(graph, startNodeId);
            const executionTime = Date.now() - start;

            res.json({
                algorithm: "DFS",
                startNode: startNodeId,
                visitedOrder: visitOrder,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async runDijkstra(req: Request, res: Response) {
        try {
            const start = Date.now();
            const { startNodeId, endNodeId } = req.params;
            if (!startNodeId || !endNodeId) {
                res.status(400).json({ error: "startNodeId and endNodeId are required" });
                return;
            }

            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const result = GraphAlgorithms.dijkstra(graph, startNodeId, endNodeId);
            const executionTime = Date.now() - start;

            res.json({
                algorithm: "Dijkstra",
                startNode: startNodeId,
                endNode: endNodeId,
                ...result,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async runAStar(req: Request, res: Response) {
        try {
            const start = Date.now();
            const { startNodeId, endNodeId } = req.params;
            if (!startNodeId || !endNodeId) {
                res.status(400).json({ error: "startNodeId and endNodeId are required" });
                return;
            }

            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const result = GraphAlgorithms.astar(graph, startNodeId, endNodeId);
            const executionTime = Date.now() - start;

            res.json({
                algorithm: "A*",
                startNode: startNodeId,
                endNode: endNodeId,
                ...result,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async runDegreeCentrality(req: Request, res: Response) {
        try {
            const start = Date.now();
            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
            const result = GraphAlgorithms.degreeCentrality(graph, limit);
            const executionTime = Date.now() - start;

            res.json({
                algorithm: "Degree Centrality",
                topNodes: result,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async runWelshPowell(req: Request, res: Response) {
        try {
            const start = Date.now();
            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const colorMap = GraphAlgorithms.welshPowell(graph);
            const executionTime = Date.now() - start;

            // Convert Map to object for JSON response
            const result: Record<string, number> = {};
            colorMap.forEach((color, id) => {
                result[id] = color;
            });

            res.json({
                algorithm: "Welsh-Powell Coloring",
                colors: result,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async runConnectedComponents(req: Request, res: Response) {
        try {
            const start = Date.now();
            const service = SupabaseService.getInstance();
            const graph = await service.loadGraph();
            const communities = GraphAlgorithms.getConnectedComponents(graph);
            const executionTime = Date.now() - start;

            res.json({
                algorithm: "Connected Components",
                communities: communities,
                count: communities.length,
                executionTimeMs: executionTime
            });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
