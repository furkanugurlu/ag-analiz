import { Graph } from "@repo/shared";
import { IColoringAlgorithm } from "./interfaces";

export class WelshPowellColoring implements IColoringAlgorithm {
    run(graph: Graph): Map<string, number> {
        const colors = new Map<string, number>();
        const degrees = new Map<string, number>();
        const adjList = this.buildAdjacencyList(graph);

        adjList.forEach((neighbors, id) => {
            degrees.set(id, neighbors.length);
        });

        const sortedNodes = graph.getNodes().sort((a, b) => {
            return (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0);
        });

        let currentColor = 1;

        while (colors.size < sortedNodes.length) {
            const uncolored = sortedNodes.filter((n) => !colors.has(n.id));

            uncolored.forEach((node) => {
                const neighbors = adjList.get(node.id);

                let canColor = true;
                if (neighbors) {
                    for (const neighborId of neighbors) {
                        if (colors.get(neighborId) === currentColor) {
                            canColor = false;
                            break;
                        }
                    }
                }

                if (canColor) {
                    colors.set(node.id, currentColor);
                }
            });

            currentColor++;
        }

        return colors;
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
