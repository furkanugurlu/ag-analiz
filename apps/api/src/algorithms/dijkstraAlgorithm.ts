import { Graph } from "@repo/shared";
import { IPathAlgorithm } from "./interfaces";

interface HeapNode { id: string; dist: number }

export class DijkstraAlgorithm implements IPathAlgorithm {
    run(params: { graph: Graph; startId: string; endId: string }): { path: string[]; cost: number; aborted?: boolean } {
        const { graph, startId, endId } = params;
        const distances = new Map<string, number>();
        const previous = new Map<string, string | null>();
        const visited = new Set<string>();
        const adjList = this.buildWeightedAdjacencyList(graph);
        const heap: HeapNode[] = [];

        const push = (node: HeapNode) => {
            heap.push(node);
            let i = heap.length - 1;
            while (i > 0) {
                const p = Math.floor((i - 1) / 2);
                if (heap[p]!.dist <= heap[i]!.dist) break;
                [heap[p], heap[i]] = [heap[i]!, heap[p]!];
                i = p;
            }
        };

        const pop = (): HeapNode | undefined => {
            if (heap.length === 0) return undefined;
            const top = heap[0]!;
            const end = heap.pop()!;
            if (heap.length > 0) {
                heap[0] = end;
                let i = 0;
                while (true) {
                    const left = 2 * i + 1;
                    const right = 2 * i + 2;
                    let smallest = i;
                    if (left < heap.length && heap[left]!.dist < heap[smallest]!.dist) smallest = left;
                    if (right < heap.length && heap[right]!.dist < heap[smallest]!.dist) smallest = right;
                    if (smallest === i) break;
                    [heap[i], heap[smallest]] = [heap[smallest]!, heap[i]!];
                    i = smallest;
                }
            }
            return top;
        };

        graph.getNodes().forEach((node) => {
            distances.set(node.id, node.id === startId ? 0 : Infinity);
            previous.set(node.id, null);
        });
        push({ id: startId, dist: 0 });

        let iterations = 0;
        const maxIterations = graph.getNodes().length * graph.getNodes().length + 200;

        while (heap.length > 0) {
            if (iterations++ > maxIterations) {
                return { path: [], cost: 0, aborted: true };
            }
            const current = pop();
            if (!current) break;
            const { id: u, dist } = current;
            if (visited.has(u)) continue;
            visited.add(u);

            if (u === endId) break;
            if (dist === Infinity) break;

            const neighbors = adjList.get(u) || [];
            for (const neighbor of neighbors) {
                const alt = dist + neighbor.weight;
                if (alt < (distances.get(neighbor.target) || Infinity)) {
                    distances.set(neighbor.target, alt);
                    previous.set(neighbor.target, u);
                    push({ id: neighbor.target, dist: alt });
                }
            }
        }

        const path: string[] = [];
        let current: string | null = endId;
        if (distances.get(endId) === Infinity) {
            return { path: [], cost: 0 };
        }

        while (current) {
            path.unshift(current);
            current = previous.get(current) || null;
            if (current === startId) {
                path.unshift(current);
                break;
            }
        }

        return { path, cost: distances.get(endId) || 0 };
    }

    private buildWeightedAdjacencyList(graph: Graph): Map<string, { target: string; weight: number }[]> {
        const adjList = new Map<string, { target: string; weight: number }[]>();
        graph.getNodes().forEach((node) => {
            adjList.set(node.id, []);
        });
        graph.getEdges().forEach((edge) => {
            const safeWeight = (edge as any).weight ?? 1;
            adjList.get(edge.source.id)?.push({ target: edge.target.id, weight: safeWeight });
            adjList.get(edge.target.id)?.push({ target: edge.source.id, weight: safeWeight });
        });
        return adjList;
    }
}
