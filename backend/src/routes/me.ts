import express from "express";
import { authenticate } from "./auth";
import {
    triggerVisitPlace,
    getMeInformation,
    updatePreferences,
} from "../controllers/meController";
const router = express.Router();

router.use(authenticate);

// GET /me
router.get("", getMeInformation);

// GET /me/visit
router.post("/visit", triggerVisitPlace);
router.post("/preferences", updatePreferences);

export default router;
