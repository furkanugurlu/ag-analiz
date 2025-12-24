import { Graph } from "@repo/shared";
import { BFSAlgorithm } from "./bfsAlgorithm";
import { DFSAlgorithm } from "./dfsAlgorithm";
import { DijkstraAlgorithm } from "./dijkstraAlgorithm";
import { AStarAlgorithm } from "./aStarAlgorithm";
import { WelshPowellColoring } from "./welshPowellColoring";

export class GraphAlgorithms {
  static bfs(graph: Graph, startNodeId: string): string[] {
    return new BFSAlgorithm().run({ graph, startId: startNodeId });
  }

  static dfs(graph: Graph, startNodeId: string): string[] {
    return new DFSAlgorithm().run({ graph, startId: startNodeId });
  }

  static dijkstra(
    graph: Graph,
    startNodeId: string,
    endNodeId: string
  ): { path: string[]; cost: number; aborted?: boolean } {
    return new DijkstraAlgorithm().run({ graph, startId: startNodeId, endId: endNodeId });
  }

  static astar(
    graph: Graph,
    startNodeId: string,
    endNodeId: string
  ): { path: string[]; cost: number; aborted?: boolean } {
    return new AStarAlgorithm().run({ graph, startId: startNodeId, endId: endNodeId });
  }

  static degreeCentrality(
    graph: Graph,
    limit: number = 5
  ): { id: string; degree: number }[] {
    const degrees = new Map<string, number>();
    const nodes = graph.getNodes();

    nodes.forEach((node) => degrees.set(node.id, 0));

    graph.getEdges().forEach((edge) => {
      degrees.set(edge.source.id, (degrees.get(edge.source.id) || 0) + 1);
      degrees.set(edge.target.id, (degrees.get(edge.target.id) || 0) + 1);
    });

    return Array.from(degrees.entries())
      .map(([id, degree]) => ({ id, degree }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, limit);
  }

  static welshPowell(graph: Graph): Map<string, number> {
    return new WelshPowellColoring().run(graph);
  }

  static getConnectedComponents(graph: Graph): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];
    const nodes = graph.getNodes();
    const adjList = this.buildAdjacencyList(graph);

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const component: string[] = [];
        const queue: string[] = [node.id];
        visited.add(node.id);

        while (queue.length > 0) {
          const u = queue.shift()!;
          component.push(u);

          const neighbors = adjList.get(u) || [];
          for (const v of neighbors) {
            if (!visited.has(v)) {
              visited.add(v);
              queue.push(v);
            }
          }
        }
        components.push(component);
      }
    }

    return components;
  }

  private static buildAdjacencyList(graph: Graph): Map<string, string[]> {
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
