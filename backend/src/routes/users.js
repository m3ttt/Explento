import express from 'express';
import { getUserById } from '../controllers/userController.js';

const router = express.Router();

// GET /api/users/:id
router.get('/:id', getUserById);

// POST /api/users
// router.post('/', createUser);

// GET /api/users
// router.get('/', getAllUsers);

export default router;
