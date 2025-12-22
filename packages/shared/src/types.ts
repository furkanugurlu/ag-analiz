export interface INodeProperties {
    isActive: boolean;
    activity: number;
    interactionCount: number;
    connectionCount: number;
    [key: string]: any; // Allow for other dynamic properties
}

export interface INode {
    id: string;
    label: string;
    x: number;
    y: number;
    properties: INodeProperties;
}

export interface IEdge {
    id: string;
    sourceId: string;
    targetId: string;
}
