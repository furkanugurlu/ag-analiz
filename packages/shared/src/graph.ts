import { Node } from "./node";
import { Edge } from "./edge";

export class Graph {
    nodes: Map<string, Node>;
    edges: Edge[];

    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }

    addNode(node: Node): void {
        if (!this.nodes.has(node.id)) {
            this.nodes.set(node.id, node);
        }
    }

    addEdge(sourceId: string, targetId: string, weight: number = 0): void {
        const source = this.nodes.get(sourceId);
        const target = this.nodes.get(targetId);

        if (source && target) {
            const edge = new Edge(source, target, weight);
            this.edges.push(edge);
        } else {
            throw new Error(`Nodes not found: ${sourceId}, ${targetId}`);
        }
    }

    getNodes(): Node[] {
        return Array.from(this.nodes.values());
    }

    getEdges(): Edge[] {
        return this.edges;
    }
}
