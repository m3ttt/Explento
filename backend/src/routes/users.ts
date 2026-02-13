import express from "express";
import {
    getAllUsers,
    getUserByUsername,
} from "../controllers/userController";

const router = express.Router();

// GET /users/:username:
router.get("/:username", getUserByUsername);

// GET /users
// GET /users?expert=true
router.get("/", getAllUsers);

export default router;
