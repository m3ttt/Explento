import express from "express";
import { authenticate } from "./auth.js";
import { triggerVisitPlace, getMeInformation } from "../controllers/meController.js";
const router = express.Router();

router.use(authenticate);

// GET /me
router.get("", getMeInformation);

// GET /me/visit/:id:
router.post("/visit/:id", triggerVisitPlace);

export default router;
