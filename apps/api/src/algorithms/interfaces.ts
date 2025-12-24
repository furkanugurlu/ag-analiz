import { Graph } from "@repo/shared";

export interface IAlgorithm<TInput, TResult> {
    run(input: TInput): TResult;
}

export interface IGraphAlgorithm<TResult> extends IAlgorithm<Graph, TResult> {
    run(graph: Graph): TResult;
}

export interface ITraversalAlgorithm extends IAlgorithm<{ graph: Graph; startId: string }, string[]> {
    run(params: { graph: Graph; startId: string }): string[];
}

export interface IPathAlgorithm extends IAlgorithm<{ graph: Graph; startId: string; endId: string }, { path: string[]; cost: number; aborted?: boolean }> {
    run(params: { graph: Graph; startId: string; endId: string }): { path: string[]; cost: number; aborted?: boolean };
}

export interface IColoringAlgorithm extends IAlgorithm<Graph, Map<string, number>> {
    run(graph: Graph): Map<string, number>;
}
