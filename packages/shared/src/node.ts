import { INodeProperties } from "./types";

export class Node {
    id: string;
    label: string;
    x: number;
    y: number;
    properties: INodeProperties;

    constructor(
        id: string,
        label: string = "",
        x: number = 0,
        y: number = 0,
        properties: INodeProperties = { isActive: true, activity: 0, interactionCount: 0, connectionCount: 0 }
    ) {
        this.id = id;
        this.label = label || id;
        this.x = x;
        this.y = y;
        this.properties = properties;
    }
}
