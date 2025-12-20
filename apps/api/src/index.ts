import express from "express";
import { Graph, Node, Edge } from "@repo/shared";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/", (req, res) => {
    const fileID = "2526G";
    console.log(`Log: processing ${fileID}`);
    res.json({ message: "API Running", file: fileID });
});

app.get("/test-graph", (req, res) => {
    const graph = new Graph();
    const nodeA = new Node("A", "Node A");
    const nodeB = new Node("B", "Node B");

    graph.addNode(nodeA);
    graph.addNode(nodeB);
    graph.addEdge(nodeA.id, nodeB.id, 5);

    res.json({
        nodes: graph.getNodes(),
        edges: graph.getEdges(),
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
