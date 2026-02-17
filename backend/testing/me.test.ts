import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Place } from "../src/models/Place.js";
import Mission from "../src/models/Mission.js";

const createFreshUserMock = () => ({
    _id: new Types.ObjectId().toHexString(),
    username: "testuser",
    email: "test@example.com",
    name: "Test",
    surname: "User",
    expert: false,
    exp: 0,
    preferences: {
        alsoPaid: false,
        categories: ["montagna", "cultura"],
    },
    discoveredPlaces: [] as any[],
    suggestedPlaces: [] as any[],
    missionsProgresses: [] as any[],
    save: jest.fn().mockResolvedValue(true),
    addEXP: jest.fn().mockResolvedValue(true),
    markModified: jest.fn(), // Necessario perché chiamato nel controller
});

describe("Me API", () => {
    let token: string;
    let userMock: any;

    beforeAll(() => {
        token = jwt.sign(
            { id: "123" },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "1h" },
        );
    });

    beforeEach(() => {
        userMock = createFreshUserMock();

        // Mock di User.findById per l'autenticazione e i controller
        jest.spyOn(User, "findById").mockImplementation(
            () =>
                ({
                    exec: jest.fn().mockResolvedValue(userMock),
                }) as any,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("GET /api/v1/me", () => {
        it("should return user profile data", async () => {
            const res = await request(app)
                .get("/api/v1/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.username).toBe("testuser");
        });

        it("should return 401 if token missing", async () => {
            const res = await request(app).get("/api/v1/me");
            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Manca header autorizzazione");
        });

        it("should return 401 if user not found", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            } as any);

            const res = await request(app)
                .get("/api/v1/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Utente non trovato");
        });
    });

    describe("POST /api/v1/me/preferences", () => {
        it("should update user preferences", async () => {
            const updates = { alsoPaid: true, categories: ["lago", "cultura"] };

            const res = await request(app)
                .post("/api/v1/me/preferences")
                .set("Authorization", `Bearer ${token}`)
                .send(updates);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Ok");
            expect(userMock.save).toHaveBeenCalled();
        });

        it("should return 400 for invalid updates", async () => {
            const res = await request(app)
                .post("/api/v1/me/preferences")
                .set("Authorization", `Bearer ${token}`)
                .send({ alsoPaid: null, categories: null });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Informazioni mancanti");
        });
    });

    describe("POST /api/v1/me/visit", () => {
        let specificPlaceId: string;
        const placeCategory = "montagna";

        beforeEach(() => {
            // Genera un ObjectId valido (24 caratteri hex) per evitare crash in new Types.ObjectId()
            specificPlaceId = new Types.ObjectId().toHexString();

            userMock.missionsProgresses = [
                {
                    missionId: new Types.ObjectId(),
                    requiredPlacesVisited: [],
                    progress: 0,
                    completed: false,
                },
                {
                    missionId: new Types.ObjectId(),
                    requiredPlacesVisited: [{ placeId: new Types.ObjectId() }],
                    progress: 1,
                    completed: false,
                },
            ];

            // Mock Place.findById
            jest.spyOn(Place, "findById").mockImplementation(
                () =>
                    ({
                        exec: jest.fn().mockResolvedValue({
                            _id: new Types.ObjectId(specificPlaceId),
                            categories: [placeCategory],
                            location: { lat: 45, lon: 7 },
                        }),
                    }) as any,
            );

            // Mock Mission.find
            jest.spyOn(Mission, "find").mockImplementation(
                () =>
                    ({
                        lean: jest.fn().mockReturnValue([
                            {
                                _id: userMock.missionsProgresses[0].missionId,
                                requiredPlaces: [],
                                categories: [placeCategory],
                                requiredCount: 1,
                                rewardExp: 10,
                            },
                            {
                                _id: userMock.missionsProgresses[1].missionId,
                                requiredPlaces: [
                                    {
                                        placeId: new Types.ObjectId(
                                            specificPlaceId,
                                        ),
                                    },
                                ],
                                categories: [],
                                requiredCount: 2,
                                rewardExp: 20,
                            },
                        ]),
                    }) as any,
            );
        });

        it("should record a visit, complete relevant missions and give EXP", async () => {
            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: specificPlaceId })
                .send({ lat: 45, lon: 7 });

            expect(res.status).toBe(200);

            // Verifica registrazione nel profilo utente
            const recorded = userMock.discoveredPlaces.some(
                (p: any) => p.placeId.toString() === specificPlaceId,
            );
            expect(recorded).toBe(true);

            // Verifica completamento missioni
            expect(userMock.missionsProgresses[0].completed).toBe(true);
            expect(userMock.missionsProgresses[1].completed).toBe(true);

            // Verifica EXP: 5 (scoperta) + 10 (m1) + 20 (m2)
            expect(userMock.addEXP).toHaveBeenCalledWith(5);
            expect(userMock.addEXP).toHaveBeenCalledWith(10);
            expect(userMock.addEXP).toHaveBeenCalledWith(20);
        });

        it("should not give EXP if place and missions already completed", async () => {
            userMock.discoveredPlaces.push({
                placeId: new Types.ObjectId(specificPlaceId),
                date: new Date(),
                visited: true,
            });
            userMock.missionsProgresses.forEach(
                (m: any) => (m.completed = true),
            );

            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: specificPlaceId })
                .send({ lat: 45, lon: 7 });

            expect(res.status).toBe(200);
            expect(userMock.addEXP).not.toHaveBeenCalled();
        });

        it("should return 400 if user is too far from the place", async () => {
            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: specificPlaceId })
                .send({ lat: 46, lon: 8 }); // Lontano da 45, 7

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(
                "Posizione utente fuori dal raggio consentito",
            );
        });

        it("should return 400 if placeId is not a valid ObjectId", async () => {
            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: "invalid-id" })
                .send({ lat: 45, lon: 7 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Formato placeId non valido");
        });
    });
});
