import express from "express";
import {
    getAllUsers,
    getUserByUsername,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/:username", getUserByUsername);
router.get("/", getAllUsers);

export default router;
