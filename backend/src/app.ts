import express from "express";
import userRoutes from "./routes/users.js";
import meRoutes from "./routes/me.js";
import operatorRouter from "./routes/operator.js";
import placesRouter from "./routes/places.js";
import heatMapRouter from "./routes/heatmap.js"
import missionsRouter from "./routes/mission.js"
import {
    USERS_ENDPOINT,
    ME_ENDPOINT,
    AUTH_ENDPOINT,
    OPERATOR_ENDPOINT,
    PLACES_ENDPOINT,
    HEATMAP_ENDPOINT,
    MISSIONS_ENDPOINT
} from "./config.js";
import cors from "cors";
import { router as authRouter } from "./routes/auth.js";

const app = express();
app.use(express.json());

// Abilita CORS per permettere richieste
// da qualsiasi origine (backend e frontend separati)
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*", // In locale userà "*" o localhost, in prod. l'URL
    }),
);

app.use(USERS_ENDPOINT, userRoutes);
app.use(ME_ENDPOINT, meRoutes);
app.use(AUTH_ENDPOINT, authRouter);
app.use(OPERATOR_ENDPOINT, operatorRouter);
app.use(PLACES_ENDPOINT, placesRouter);
app.use(HEATMAP_ENDPOINT, heatMapRouter);
app.use(MISSIONS_ENDPOINT, missionsRouter);

export default app;
