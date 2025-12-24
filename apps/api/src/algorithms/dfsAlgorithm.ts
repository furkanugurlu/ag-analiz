import { Graph } from "@repo/shared";
import { ITraversalAlgorithm } from "./interfaces";

export class DFSAlgorithm implements ITraversalAlgorithm {
    run(params: { graph: Graph; startId: string }): string[] {
        const { graph, startId } = params;
        const visited = new Set<string>();
        const result: string[] = [];
        const stack: string[] = [];

        if (!graph.nodes.has(startId)) return [];

        const adjList = this.buildAdjacencyList(graph);
        stack.push(startId);

        while (stack.length > 0) {
            const current = stack.pop()!;
            if (visited.has(current)) continue;

            visited.add(current);
            result.push(current);

            const neighbors = adjList.get(current) || [];
            for (let i = neighbors.length - 1; i >= 0; i--) {
                const neighbor = neighbors[i]!;
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
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
