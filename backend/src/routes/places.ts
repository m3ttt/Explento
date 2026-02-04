import { Router } from "express";
import { authenticate } from "./auth.js";
import {
    createAddPlaceRequest,
    getPlaces,
    createUpdatePlaceRequest,
} from "../controllers/placeController.js";

const router = Router();

router.use(authenticate);

router.get("/", getPlaces); // Lista tutti i luoghi
router.post("/request", createAddPlaceRequest); // Aggiungi un nuovo luogo
router.put("/:id", createUpdatePlaceRequest); // Modifica un luogo esistente

export default router;
