import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { Operator } from "../src/models/Operator";
import { User } from "../src/models/User";

// Mock helper per query di Mongoose che usano .exec()
const mockQuery = (result: any) => ({
    exec: jest.fn().mockResolvedValue(result),
});

describe("Heatmap API", () => {
    let operatorToken: string;

    beforeAll(() => {
        process.env.JWT_SECRET = "supersecret";
        // Token valido con ruolo operatore
        operatorToken = jwt.sign(
            { id: "op123", role: "operator" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
    });

    // Pulizia finale per evitare "Open Handles" e processi appesi
    afterAll(async () => {
        await mongoose.connection.close();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        // Mock predefinito: l'operatore esiste e ha il ruolo corretto
        jest.spyOn(Operator, "findById").mockImplementation((id: any) => {
            return mockQuery({
                _id: "op123",
                email: "operator@test.com",
                role: "operator"
            }) as any;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/v1/heatmap/missions", () => {
        
        it("should return heatmap data for operators", async () => {
            const mockAggregateResult = [
                {
                    placeId: "place_A",
                    completedMissions: 10,
                    name: "Colosseo",
                    location: { lat: 41.89, lon: 12.49 },
                },
                {
                    placeId: "place_B",
                    completedMissions: 3,
                    name: "Duomo",
                    location: { lat: 45.46, lon: 9.19 },
                }
            ];

            // Mock dell'aggregazione di Mongoose
            const aggregateSpy = jest.spyOn(User, "aggregate").mockResolvedValue(mockAggregateResult as any);

            const res = await request(app)
                .get("/api/v1/heatmap/missions")
                .set("Authorization", `Bearer ${operatorToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe("Colosseo");
            expect(aggregateSpy).toHaveBeenCalled();
        });

        it("should return 401 if token is missing", async () => {
            const res = await request(app).get("/api/v1/heatmap/missions");
            expect(res.status).toBe(401);
        });

        it("should return 401 if user is not an operator (Fix Timeout)", async () => {
            // Mock Operator.findById affinché restituisca null 
            // Questo simula il fallimento del middleware operatorAuthenticate
            jest.spyOn(Operator, "findById").mockImplementation(() => {
                return mockQuery(null) as any;
            });

            // Token con ruolo sbagliato
            const userToken = jwt.sign(
                { id: "user123", role: "user" }, 
                process.env.JWT_SECRET!
            );
            
            const res = await request(app)
                .get("/api/v1/heatmap/missions")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(401);
        });

        it("should return 500 if aggregate fails", async () => {
            jest.spyOn(User, "aggregate").mockRejectedValue(new Error("Aggregation failed"));

            const res = await request(app)
                .get("/api/v1/heatmap/missions")
                .set("Authorization", `Bearer ${operatorToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Errore durante la generazione della heatmap");
        });

        it("should return empty array if no missions are completed", async () => {
            jest.spyOn(User, "aggregate").mockResolvedValue([]);

            const res = await request(app)
                .get("/api/v1/heatmap/missions")
                .set("Authorization", `Bearer ${operatorToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });
});
