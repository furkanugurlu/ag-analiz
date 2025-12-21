import { Node } from "./node";

export class Edge {
    source: Node;
    target: Node;
    weight: number;

    constructor(source: Node, target: Node, weight?: number) {
        this.source = source;
        this.target = target;
        if (weight !== undefined) {
            this.weight = weight;
        } else {
            this.weight = Edge.calculateWeight(source, target);
        }
    }

    /**
     * Calculates weight based on the formula: 1 + sqrt(Delta^2...)
     * Specifically using interactionCount and connectionCount differences.
     */
    static calculateWeight(node1: Node, node2: Node): number {
        const deltaInteraction = (node1.properties.interactionCount || 0) - (node2.properties.interactionCount || 0);
        const deltaConnection = (node1.properties.connectionCount || 0) - (node2.properties.connectionCount || 0);

        return 1 + Math.sqrt(Math.pow(deltaInteraction, 2) + Math.pow(deltaConnection, 2));
    }
}
