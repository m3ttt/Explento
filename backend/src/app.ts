import express from "express";
import userRoutes from "./routes/users.js";
import meRoutes from "./routes/me.js";
import { USERS_ENDPOINT, ME_ENDPOINT } from "./config.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "*",
    }),
);

app.use(USERS_ENDPOINT, userRoutes);
app.use(ME_ENDPOINT, meRoutes);

export default app;
