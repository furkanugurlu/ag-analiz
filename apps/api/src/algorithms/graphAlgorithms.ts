import { Graph, Node } from "@repo/shared";

export class GraphAlgorithms {
  private static buildAdjacencyList(graph: Graph): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    // Initialize for all nodes
    graph.getNodes().forEach((node) => {
      adjList.set(node.id, []);
    });

    // Treat edges as Undirected (add both ways) because UI does not show arrows
    graph.getEdges().forEach((edge) => {
      adjList.get(edge.source.id)?.push(edge.target.id);
      adjList.get(edge.target.id)?.push(edge.source.id);
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

  private static buildWeightedAdjacencyList(
    graph: Graph
  ): Map<string, { target: string; weight: number }[]> {
    const adjList = new Map<string, { target: string; weight: number }[]>();

    graph.getNodes().forEach((node) => {
      adjList.set(node.id, []);
    });

    graph.getEdges().forEach((edge) => {
      const safeWeight = Number.isFinite(edge.weight) && edge.weight > 0 ? edge.weight : 1;
      adjList
        .get(edge.source.id)
        ?.push({ target: edge.target.id, weight: safeWeight });
      adjList
        .get(edge.target.id)
        ?.push({ target: edge.source.id, weight: safeWeight });
    });

    return adjList;
  }

  static dijkstra(
    graph: Graph,
    startNodeId: string,
    endNodeId: string
  ): { path: string[]; cost: number; aborted?: boolean } {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const nodes = graph.getNodes();
    const adjList = this.buildWeightedAdjacencyList(graph);
    const visited = new Set<string>();

    const heap: { id: string; dist: number }[] = [];
    const push = (item: { id: string; dist: number }) => {
      heap.push(item);
      let i = heap.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (heap[p].dist <= heap[i].dist) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    };
    const pop = () => {
      if (!heap.length) return undefined;
      const top = heap[0];
      const last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        while (true) {
          const l = 2 * i + 1;
          const r = 2 * i + 2;
          let smallest = i;
          if (l < heap.length && heap[l].dist < heap[smallest].dist) smallest = l;
          if (r < heap.length && heap[r].dist < heap[smallest].dist) smallest = r;
          if (smallest === i) break;
          [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
          i = smallest;
        }
      }
      return top;
    };

    nodes.forEach((node) => {
      const dist = node.id === startNodeId ? 0 : Infinity;
      distances.set(node.id, dist);
      previous.set(node.id, null);
      push({ id: node.id, dist });
    });

    let iterations = 0;
    const maxIterations = nodes.length * nodes.length + 200;

    while (heap.length > 0) {
      if (iterations++ > maxIterations) {
        return { path: [], cost: 0, aborted: true };
      }
      const current = pop();
      if (!current) break;
      const { id: u, dist } = current;
      if (visited.has(u)) continue;
      visited.add(u);

      if (u === endNodeId) break;
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
    let current: string | null = endNodeId;
    if (distances.get(endNodeId) === Infinity) {
      return { path: [], cost: 0 };
    }

    while (current) {
      path.unshift(current);
      current = previous.get(current) || null;
      if (current === startNodeId) {
        path.unshift(current);
        break;
      }
    }

    return { path, cost: distances.get(endNodeId) || 0 };
  }

  static astar(
    graph: Graph,
    startNodeId: string,
    endNodeId: string
  ): { path: string[]; cost: number; aborted?: boolean } {
    const distances = new Map<string, number>(); // gScore
    const fScores = new Map<string, number>(); // fScore
    const previous = new Map<string, string | null>();
    const adjList = this.buildWeightedAdjacencyList(graph);

    const openSet: { id: string; f: number }[] = [];
    const closed = new Set<string>();

    // Heuristic: Euclidean Distance
    const heuristic = (id1: string, id2: string): number => {
      const n1 = graph.nodes.get(id1);
      const n2 = graph.nodes.get(id2);
      if (!n1 || !n2) return 0;
      return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
    };

    // Initialize
    graph.getNodes().forEach((node) => {
      distances.set(node.id, Infinity);
      fScores.set(node.id, Infinity);
      previous.set(node.id, null);
    });

    distances.set(startNodeId, 0);
    fScores.set(startNodeId, heuristic(startNodeId, endNodeId));
    openSet.push({ id: startNodeId, f: fScores.get(startNodeId)! });

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

      if (u === endNodeId) {
        // Reconstruct path
        const path: string[] = [];
        let current: string | null = endNodeId;
        while (current) {
          path.unshift(current);
          if (current === startNodeId) break;
          current = previous.get(current) || null;
        }
        return { path, cost: distances.get(endNodeId) || 0 };
      }

      const neighbors = adjList.get(u) || [];
      for (const neighbor of neighbors) {
        const tentativeGScore =
          (distances.get(u) || Infinity) + neighbor.weight;

        if (tentativeGScore < (distances.get(neighbor.target) || Infinity)) {
          previous.set(neighbor.target, u);
          distances.set(neighbor.target, tentativeGScore);
          const f = tentativeGScore + heuristic(neighbor.target, endNodeId);
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

  static degreeCentrality(
    graph: Graph,
    limit: number = 5
  ): { id: string; degree: number }[] {
    const degrees = new Map<string, number>();
    const nodes = graph.getNodes();

    nodes.forEach((node) => degrees.set(node.id, 0));

    graph.getEdges().forEach((edge) => {
      degrees.set(edge.source.id, (degrees.get(edge.source.id) || 0) + 1);
      degrees.set(edge.target.id, (degrees.get(edge.target.id) || 0) + 1); // Assuming undirected for centrality
    });

    return Array.from(degrees.entries())
      .map(([id, degree]) => ({ id, degree }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, limit);
  }

  static welshPowell(graph: Graph): Map<string, number> {
    const colors = new Map<string, number>();
    const degrees = new Map<string, number>();
    // Use the unified Undirected Adjacency List
    const adjList = this.buildAdjacencyList(graph);

    // 1. Calculate degrees
    adjList.forEach((neighbors, id) => {
      degrees.set(id, neighbors.length);
    });

    // 2. Sort vertices by degree in descending order
    const sortedNodes = graph.getNodes().sort((a, b) => {
      return (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0);
    });

    let currentColor = 1;

    // 3. Assign colors
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
}
