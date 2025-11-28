import express from "express";
import { authenticate } from "./auth.js";
import { triggerVisit, getMeInformation } from "../controllers/meController.js";
const router = express.Router();

router.use(authenticate);

router.get("/", getMeInformation);
router.post("/visit/:id", triggerVisit);

export default router;
