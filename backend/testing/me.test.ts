import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/User";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Place } from "../src/models/Place";
import Mission from "../src/models/Mission";

const createFreshUserMock = () => ({
    _id: "123",
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
    // Tipizza esplicitamente gli array per evitare `never[]`
    discoveredPlaces: [] as {
        placeId: string;
        date: Date;
        visited?: boolean;
    }[],
    suggestedPlaces: [] as {
        placeId: string;
        visited: boolean;
        date: Date;
    }[],
    missionsProgresses: [] as {
        missionId: Types.ObjectId;
        requiredPlacesVisited: { placeId: Types.ObjectId }[];
        progress: number;
        completed: boolean;
    }[],
    save: jest.fn().mockResolvedValue(true),
    addEXP: jest.fn().mockResolvedValue(true),
});

describe("Me API", () => {
    let token: string;
    let userMock: ReturnType<typeof createFreshUserMock>;

    beforeAll(() => {
        token = jwt.sign(
            { id: "123" },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "1h" },
        );
    });

    beforeEach(() => {
        userMock = createFreshUserMock();

        // Mock di User.findById
        jest.spyOn(User, "findById").mockImplementation((id: any) => {
            return { exec: jest.fn().mockResolvedValue(userMock) } as any;
        });
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
        let specificPlaceId: Types.ObjectId;
        const placeCategory = "montagna";

        beforeEach(() => {
            specificPlaceId = new Types.ObjectId();

            // Prepara i progressi delle missioni: partiamo da 0 per testare l'incremento
            userMock.missionsProgresses = [
                {
                    missionId: new Types.ObjectId(), // missione categorie
                    requiredPlacesVisited: [],
                    progress: 0,
                    completed: false,
                },
                {
                    missionId: new Types.ObjectId(), // missione con luoghi richiesti
                    // Inseriamo un luogo DIVERSO per far sì che ne manchi 1 alla fine
                    requiredPlacesVisited: [{ placeId: new Types.ObjectId() }],
                    progress: 1,
                    completed: false,
                },
            ];

            // Mock Place.findById (sia per validazione che per updateMissionsProgress)
            jest.spyOn(Place, "findById").mockImplementation(
                () =>
                    ({
                        exec: jest.fn().mockResolvedValue({
                            _id: specificPlaceId,
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
                                    { placeId: specificPlaceId },
                                    {
                                        placeId:
                                            userMock.missionsProgresses[1]
                                                .requiredPlacesVisited[0]
                                                .placeId,
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
                .query({ placeId: specificPlaceId.toHexString() })
                .send({ lat: 45, lon: 7 });

            expect(res.status).toBe(200);

            // Verifica registrazione globale
            expect(
                userMock.discoveredPlaces.some(
                    (p) => p.placeId === specificPlaceId.toHexString(),
                ),
            ).toBe(true);

            // Verifica Missione 1 (Categorie) -> Progress da 0 a 1, completata
            expect(userMock.missionsProgresses[0].progress).toBe(1);
            expect(userMock.missionsProgresses[0].completed).toBe(true);

            // Verifica Missione 2 (Luoghi richiesti) -> Progress da 1 a 2, completata
            expect(userMock.missionsProgresses[1].progress).toBe(2);
            expect(userMock.missionsProgresses[1].completed).toBe(true);

            // Verifica EXP: 5 (nuovo luogo) + 10 (m1) + 20 (m2)
            expect(userMock.addEXP).toHaveBeenCalledWith(5);
            expect(userMock.addEXP).toHaveBeenCalledWith(10);
            expect(userMock.addEXP).toHaveBeenCalledWith(20);
        });

        it("should not give EXP if place and missions already completed", async () => {
            // Mock utente che ha già visitato il luogo
            userMock.discoveredPlaces.push({
                placeId: specificPlaceId.toHexString(),
                date: new Date(),
                visited: true,
            });

            // E ha già completato le missioni (così updateMissionsProgress non aggiunge EXP)
            userMock.missionsProgresses.forEach((m) => (m.completed = true));

            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: specificPlaceId.toHexString() })
                .send({ lat: 45, lon: 7 });

            expect(res.status).toBe(200);
            // addEXP non deve essere chiamato né per il luogo (già visitato) né per le missioni (già completate)
            expect(userMock.addEXP).not.toHaveBeenCalled();
        });

        it("should not increment progress or give EXP if place was already counted for those missions", async () => {
            // Luogo già scoperto globalmente (niente 5 EXP)
            userMock.discoveredPlaces.push({
                placeId: specificPlaceId.toHexString(),
                date: new Date(),
                visited: true,
            });

            // Prepara le missioni come NON completate, ma con il luogo GIA' contato
            userMock.missionsProgresses = [
                {
                    missionId: new Types.ObjectId(), // Missione Categorie
                    requiredPlacesVisited: [{ placeId: specificPlaceId }], // Luogo già contato qui
                    progress: 1,
                    completed: false,
                },
                {
                    missionId: new Types.ObjectId(), // Missione Luoghi Specifici
                    requiredPlacesVisited: [{ placeId: specificPlaceId }], // Luogo già contato qui
                    progress: 1,
                    completed: false,
                },
            ];

            // Mock Mission.find per riflettere queste missioni
            jest.spyOn(Mission, "find").mockImplementation(
                () =>
                    ({
                        lean: jest.fn().mockReturnValue([
                            {
                                _id: userMock.missionsProgresses[0].missionId,
                                requiredPlaces: [],
                                categories: [placeCategory],
                                requiredCount: 3,
                                rewardExp: 50,
                            },
                            {
                                _id: userMock.missionsProgresses[1].missionId,
                                requiredPlaces: [{ placeId: specificPlaceId }],
                                categories: [],
                                requiredCount: 2,
                                rewardExp: 100,
                            },
                        ]),
                    }) as any,
            );

            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: specificPlaceId.toHexString() })
                .send({ lat: 45, lon: 7 });

            expect(res.status).toBe(200);

            // VERIFICHE:
            // Non deve aver chiamato addEXP (né per scoperta, né per completamento)
            expect(userMock.addEXP).not.toHaveBeenCalled();

            // Il progresso deve essere rimasto 1 per entrambe (non deve essere salito a 2)
            expect(userMock.missionsProgresses[0].progress).toBe(1);
            expect(userMock.missionsProgresses[1].progress).toBe(1);

            // Non devono essere state segnate come completate
            expect(userMock.missionsProgresses[0].completed).toBe(false);
            expect(userMock.missionsProgresses[1].completed).toBe(false);
        });

        it("should return 400 if user is too far from the place", async () => {
            const res = await request(app)
                .post("/api/v1/me/visit")
                .set("Authorization", `Bearer ${token}`)
                .query({ placeId: specificPlaceId.toHexString() })
                .send({ lat: 46, lon: 8 }); // Coordinate molto lontane da lat: 45, lon: 7

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(
                "Posizione utente fuori dal raggio consentito",
            );
        });
    });
});
