import { Graph } from "@repo/shared";
import { ITraversalAlgorithm } from "./interfaces";

export class BFSAlgorithm implements ITraversalAlgorithm {
    run(params: { graph: Graph; startId: string }): string[] {
        const { graph, startId } = params;
        const visited = new Set<string>();
        const result: string[] = [];
        const queue: string[] = [];

        if (!graph.nodes.has(startId)) return [];

        const adjList = this.buildAdjacencyList(graph);
        queue.push(startId);
        visited.add(startId);

        let head = 0;
        while (head < queue.length) {
            const current = queue[head++]!;
            result.push(current);
            const neighbors = adjList.get(current) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return result;
    }

    private buildAdjacencyList(graph: Graph): Map<string, string[]> {
        const adjList = new Map<string, string[]>();
        graph.getNodes().forEach((node) => {
            adjList.set(node.id, []);
        });
        graph.getEdges().forEach((edge) => {
            adjList.get(edge.source.id)?.push(edge.target.id);
            adjList.get(edge.target.id)?.push(edge.source.id);
        });
        return adjList;
    }
}
