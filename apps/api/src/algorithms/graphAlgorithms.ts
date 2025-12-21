import { Graph, Node } from "@repo/shared";

export class GraphAlgorithms {

    private static buildAdjacencyList(graph: Graph): Map<string, string[]> {
        const adjList = new Map<string, string[]>();

        // Initialize for all nodes
        graph.getNodes().forEach(node => {
            adjList.set(node.id, []);
        });

        // Populate with edges (Assuming undirected or directed based on Edge definition? 
        // Usually graph analysis on such coords is undirected unless specified.
        // The previous prompt implies simple connections. Let's assume edges are directed as per Edge class (source->target) 
        // BUT for interaction networks usually we might traverse both ways? 
        // PDF says "Source->Target". Let's stick to directed for now unless "Undirected" is specified.
        // Wait, typical Graph traversal usually implies following the edge direction.
        // If user wants undirected, we'd add both ways. Let's stick to directed (source -> target).

        graph.getEdges().forEach(edge => {
            const neighbors = adjList.get(edge.source.id);
            if (neighbors) {
                neighbors.push(edge.target.id);
            }
        });

        return adjList;
    }

    static bfs(graph: Graph, startNodeId: string): string[] {
        const visited = new Set<string>();
        const result: string[] = [];
        const queue: string[] = [startNodeId];

        if (!graph.nodes.has(startNodeId)) {
            return [];
        }

        const adjList = this.buildAdjacencyList(graph);
        visited.add(startNodeId);

        while (queue.length > 0) {
            const currentNodeId = queue.shift()!;
            result.push(currentNodeId);

            const neighbors = adjList.get(currentNodeId) || [];
            for (const neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }

        return result;
    }

    static dfs(graph: Graph, startNodeId: string): string[] {
        const visited = new Set<string>();
        const result: string[] = [];

        if (!graph.nodes.has(startNodeId)) {
            return [];
        }

        const adjList = this.buildAdjacencyList(graph);

        const traverse = (nodeId: string) => {
            visited.add(nodeId);
            result.push(nodeId);

            const neighbors = adjList.get(nodeId) || [];
            for (const neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    traverse(neighborId);
                }
            }
        };

        traverse(startNodeId);
        return result;
    }
}
