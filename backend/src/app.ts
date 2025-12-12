import express from "express";
import userRoutes from "./routes/users.js";
import meRoutes from "./routes/me.js";
import operatorRouter from "./routes/operator.js";
import placesRouter from "./routes/places.js";
import heatMapRouter from "./routes/heatmapMissions.js"
import {
    USERS_ENDPOINT,
    ME_ENDPOINT,
    AUTH_ENDPOINT,
    OPERATOR_ENDPOINT,
    PLACES_ENDPOINT,
    HEATMAP_ENDPOINT
} from "./config.js";
import cors from "cors";
import { router as authRouter } from "./routes/auth.js";

const app = express();
app.use(express.json());

// Abilita CORS per permettere richieste
// da qualsiasi origine (backend e frontend separati)
app.use(
    cors({
        origin: "*",
    }),
);

app.use(USERS_ENDPOINT, userRoutes);
app.use(ME_ENDPOINT, meRoutes);
app.use(AUTH_ENDPOINT, authRouter);
app.use(OPERATOR_ENDPOINT, operatorRouter);
app.use(PLACES_ENDPOINT, placesRouter);
app.use(HEATMAP_ENDPOINT, heatMapRouter);

export default app;
