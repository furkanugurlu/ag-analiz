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

    static calculateWeight(node1: Node, node2: Node): number {
        const deltaActive = (node1.properties.activity || 0) - (node2.properties.activity || 0);
        const deltaInteraction = (node1.properties.interactionCount || 0) - (node2.properties.interactionCount || 0);
        const deltaConnection = (node1.properties.connectionCount || 0) - (node2.properties.connectionCount || 0);

        const distance = Math.sqrt(
            Math.pow(deltaActive, 2) +
            Math.pow(deltaInteraction, 2) +
            Math.pow(deltaConnection, 2)
        );

        // Formula: 1 / (1 + Distance)
        return 1 / (1 + distance);
    }
}
