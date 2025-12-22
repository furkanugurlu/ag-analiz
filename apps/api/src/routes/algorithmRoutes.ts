import { Router } from "express";
import { AlgorithmController } from "../controllers/algorithmController";

const router = Router();

router.get("/bfs/:startNodeId", AlgorithmController.runBFS);
router.get("/dfs/:startNodeId", AlgorithmController.runDFS);
router.get("/dijkstra/:startNodeId/:endNodeId", AlgorithmController.runDijkstra);
router.get("/astar/:startNodeId/:endNodeId", AlgorithmController.runAStar);
router.get("/centrality/degree", AlgorithmController.runDegreeCentrality);
router.get("/coloring/welsh-powell", AlgorithmController.runWelshPowell);
router.get("/communities", AlgorithmController.runConnectedComponents);

export default router;
