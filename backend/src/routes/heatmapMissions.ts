import { Router } from "express";
import { heatmapMissions } from "../controllers/heatmapMissionsController";
import { operatorAuthenticate } from "./operator";

const router = Router();

// router.use(operatorAuthenticate)

router.get("/missions", heatmapMissions);

export default router;
