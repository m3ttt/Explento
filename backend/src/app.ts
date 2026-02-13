import express from "express";
import userRoutes from "./routes/users";
import meRoutes from "./routes/me";
import operatorRouter from "./routes/operator";
import placesRouter from "./routes/places";
import heatMapRouter from "./routes/heatmap"
import missionsRouter from "./routes/mission"
import {
    USERS_ENDPOINT,
    ME_ENDPOINT,
    AUTH_ENDPOINT,
    OPERATOR_ENDPOINT,
    PLACES_ENDPOINT,
    HEATMAP_ENDPOINT,
    MISSIONS_ENDPOINT
} from "./config";
import cors from "cors";
import { router as authRouter } from "./routes/auth";

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
app.use(MISSIONS_ENDPOINT, missionsRouter);

export default app;
