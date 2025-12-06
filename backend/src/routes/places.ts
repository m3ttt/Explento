import { Router } from "express";
import { authenticate } from "./auth.js";
import {
    createAddPlaceRequest,
    getPlaces,
    updatePlace,
} from "../controllers/placeController.js";

const router = Router();

router.get("/", getPlaces); // Lista tutti i luoghi
router.post("/request", authenticate, createAddPlaceRequest); // Aggiungi un nuovo luogo
router.put("/:id", updatePlace); // Modifica un luogo esistente

export default router;
