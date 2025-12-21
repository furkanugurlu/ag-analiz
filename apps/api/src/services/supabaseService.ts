import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Node, Edge, Graph, INodeProperties, INode } from "@repo/shared";
import dotenv from "dotenv";

dotenv.config();

export class SupabaseService {
    private static instance: SupabaseService;
    private supabase: SupabaseClient;

    private constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase credentials");
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    public static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    async saveGraph(graph: Graph): Promise<void> {
        const nodes = graph.getNodes().map((node) => ({
            id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            properties: node.properties,
        }));

        const edges = graph.getEdges().map((edge) => ({
            id: undefined, // Let DB generate ID if needed, or maintain consistency if passed
            source_id: edge.source.id,
            target_id: edge.target.id
            // Weight is calculated dynamically, no need to store unless specific requirement
        }));

        // Upsert nodes
        const { error: nodeError } = await this.supabase
            .from("nodes")
            .upsert(nodes, { onConflict: "id" });

        if (nodeError) throw new Error(`Error saving nodes: ${nodeError.message}`);

        // Clear existing edges and re-insert (simple strategy for full graph save)
        // In a production scenario, you might want more complex diffing
        const { error: deleteError } = await this.supabase
            .from("edges")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (deleteError) throw new Error(`Error clearing edges: ${deleteError.message}`);

        if (edges.length > 0) {
            const { error: edgeError } = await this.supabase
                .from("edges")
                .insert(edges);

            if (edgeError) throw new Error(`Error saving edges: ${edgeError.message}`);
        }
    }

    async loadGraph(): Promise<Graph> {
        const graph = new Graph();

        // Fetch all nodes
        const { data: nodesData, error: nodeError } = await this.supabase
            .from("nodes")
            .select("*");

        if (nodeError) throw new Error(`Error loading nodes: ${nodeError.message}`);

        // Fetch all edges
        const { data: edgesData, error: edgeError } = await this.supabase
            .from("edges")
            .select("*");

        if (edgeError) throw new Error(`Error loading edges: ${edgeError.message}`);

        // Map to Node objects
        if (nodesData) {
            nodesData.forEach((data: any) => {
                const props: INodeProperties = data.properties || {};
                const node = new Node(data.id, data.label, data.x, data.y, props);
                graph.addNode(node);
            });
        }

        // Map to Edge objects
        if (edgesData) {
            edgesData.forEach((data: any) => {
                try {
                    // Weight is automatically calculated by the Edge constructor
                    graph.addEdge(data.source_id, data.target_id);
                } catch (e) {
                    console.warn(`Skipping edge ${data.id}: ${(e as Error).message}`);
                }
            });
        }

        return graph;
    }
}
