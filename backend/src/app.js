import express from 'express';
import userRoutes from './routes/users.js';
import { USERS_ENDPOINT } from './config.js';

const app = express();
app.use(express.json());

app.use(USERS_ENDPOINT, userRoutes);

export default app;
