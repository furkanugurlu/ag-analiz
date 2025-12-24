import { Graph } from "@repo/shared";
import { IPathAlgorithm } from "./interfaces";

export class AStarAlgorithm implements IPathAlgorithm {
    run(params: { graph: Graph; startId: string; endId: string }): { path: string[]; cost: number; aborted?: boolean } {
        const { graph, startId, endId } = params;
        const distances = new Map<string, number>(); // gScore
        const fScores = new Map<string, number>(); // fScore
        const previous = new Map<string, string | null>();
        const adjList = this.buildWeightedAdjacencyList(graph);

        const openSet: { id: string; f: number }[] = [];
        const closed = new Set<string>();

        const heuristic = (id1: string, id2: string): number => {
            const n1 = graph.nodes.get(id1);
            const n2 = graph.nodes.get(id2);
            if (!n1 || !n2) return 0;
            return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
        };

        graph.getNodes().forEach((node) => {
            distances.set(node.id, Infinity);
            fScores.set(node.id, Infinity);
            previous.set(node.id, null);
        });

        distances.set(startId, 0);
        fScores.set(startId, heuristic(startId, endId));
        openSet.push({ id: startId, f: fScores.get(startId)! });

        let iterations = 0;
        const maxIterations = graph.getNodes().length * graph.getNodes().length + 200;

        while (openSet.length > 0) {
            if (iterations++ > maxIterations) {
                return { path: [], cost: 0, aborted: true };
            }
            openSet.sort((a, b) => a.f - b.f);
            const { id: u } = openSet.shift()!;

            if (closed.has(u)) continue;
            closed.add(u);

            if (u === endId) {
                const path: string[] = [];
                let current: string | null = endId;
                while (current) {
                    path.unshift(current);
                    if (current === startId) break;
                    current = previous.get(current) || null;
                }
                return { path, cost: distances.get(endId) || 0 };
            }

            const neighbors = adjList.get(u) || [];
            for (const neighbor of neighbors) {
                const tentativeGScore = (distances.get(u) || Infinity) + neighbor.weight;

                if (tentativeGScore < (distances.get(neighbor.target) || Infinity)) {
                    previous.set(neighbor.target, u);
                    distances.set(neighbor.target, tentativeGScore);
                    const f = tentativeGScore + heuristic(neighbor.target, endId);
                    fScores.set(neighbor.target, f);

                    const existing = openSet.find((o) => o.id === neighbor.target);
                    if (!existing) {
                        openSet.push({ id: neighbor.target, f });
                    } else {
                        existing.f = f;
                    }
                }
            }
        }

        return { path: [], cost: 0 };
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
