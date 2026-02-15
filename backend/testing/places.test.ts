// tests/places.test.ts
import request from "supertest";
import app from "../src/app";
import { Place } from "../src/models/Place";
import { PlaceEditRequest } from "../src/models/PlaceEditRequest";
import { User } from "../src/models/User";
import jwt from "jsonwebtoken";

const createFreshUserMock = (expert = true) => ({
    _id: "123",
    expert,
    preferences: { categories: ["montagna", "lago", "città"], alsoPaid: false },
    save: jest.fn().mockResolvedValue(true),
});

describe("Places API", () => {
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

        jest.spyOn(User, "findById").mockImplementation(
            () =>
                ({
                    exec: jest.fn().mockResolvedValue(userMock),
                }) as any,
        );
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("GET /api/v1/places", () => {
        beforeAll(() => {
            jest.spyOn(Place, "find").mockReturnValue({
                lean: jest.fn().mockReturnValue([
                    {
                        _id: "1",
                        name: "Monte Bianco",
                        location: { lat: 45, lon: 7 },
                        isFree: true,
                        categories: ["montagna", "rilassante", "outdoor"],
                    },
                    {
                        _id: "2",
                        name: "Lago di Garda",
                        location: { lat: 45.6, lon: 10.6 },
                        isFree: true,
                        categories: ["lago", "per famiglie", "outdoor"],
                    },
                ]),
            } as any);
        });

        it("should return all places for authenticated user", async () => {
            const res = await request(app)
                .get("/api/v1/places")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty("name");
        });

        it("should filter by nearby coordinates", async () => {
            const res = await request(app)
                .get("/api/v1/places?lat=45&lon=7&radius=1000")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body[0].distance).toBeDefined();
        });
    });

    describe("POST /api/v1/places/request", () => {
        beforeEach(() => {
            jest.spyOn(Place, "findOne").mockResolvedValue(null as any);
            jest.spyOn(PlaceEditRequest.prototype, "save").mockResolvedValue({
                _id: "newReq",
            } as any);
        });

        it("should create a new place request", async () => {
            const newPlace = {
                name: "Città Fantastica",
                description: "Una città piena di magia e colori",
                categories: ["città", "cultura", "gusto"],
                location: { lat: 44.5, lon: 11.3 },
                images: [],
                isFree: true,
            };

            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send(newPlace);

            expect(res.status).toBe(201);
            expect(res.body.message).toMatch(/Richiesta di nuovo luogo/);
        });

        it("should return 401 if user is not expert", async () => {
            userMock.expert = false;

            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Prova",
                    description: "Test",
                    categories: ["città", "cultura", "gusto"],
                    location: { lat: 0, lon: 0 },
                    isFree: true,
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Utente non esperto");
        });

        it("should return 400 if validation fails", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "",
                    description: "Test",
                    categories: ["città"],
                    location: { lat: 0, lon: 0 },
                    isFree: true,
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe("GET /api/v1/places/:id", () => {
        it("should return a place by ID", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue({
                _id: "1",
                name: "Monte Bianco",
            } as any);

            const res = await request(app)
                .get("/api/v1/places/1")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Monte Bianco");
        });

        it("should return 400 if place not found", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue(null);

            const res = await request(app)
                .get("/api/v1/places/999")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Luogo non trovato");
        });
    });
});
