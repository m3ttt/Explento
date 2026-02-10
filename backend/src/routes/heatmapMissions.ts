import { Router } from "express";
import { heatmapMissions } from "../controllers/heatmapMissionsController.js";
import { operatorAuthenticate } from "./operator.js";

const router = Router();

// router.use(operatorAuthenticate)

router.get("/missions", heatmapMissions);

export default router;
