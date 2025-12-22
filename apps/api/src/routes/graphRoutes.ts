import { Router } from "express";
import { GraphController } from "../controllers/graphController";

const router = Router();

router.post("/save", GraphController.saveGraph);
router.get("/load", GraphController.loadGraph);
router.get("/test", GraphController.testGraph);

export default router;
