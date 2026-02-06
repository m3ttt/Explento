import express from "express";
import { authenticate } from "./auth.js";
import {
    triggerVisitPlace,
    getMeInformation,
    updatePreferences,
} from "../controllers/meController.js";
const router = express.Router();

router.use(authenticate);

// GET /me
router.get("", getMeInformation);

// GET /me/visit
router.post("/visit", triggerVisitPlace);
router.post("/preferences", updatePreferences);

export default router;
