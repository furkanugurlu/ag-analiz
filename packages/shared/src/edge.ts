import { Node } from "./node";

export class Edge {
    source: Node;
    target: Node;
    weight: number;

    constructor(source: Node, target: Node, weight: number = 0) {
        this.source = source;
        this.target = target;
        this.weight = weight;
    }
}
