import request from "supertest";
import app from "../src/app.js";
import { Place } from "../src/models/Place.js";
import { PlaceEditRequest } from "../src/models/PlaceEditRequest.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";

const createFreshUserMock = (expert = true) => ({
    _id: "123",
    expert,
    preferences: { categories: ["montagna", "lago"], alsoPaid: false },
    save: jest.fn().mockResolvedValue(true),
});

describe("Places API", () => {
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
        jest.spyOn(User, "findById").mockImplementation(() => ({
            exec: jest.fn().mockResolvedValue(userMock),
        }) as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("GET /api/v1/places", () => {
        it("should return filtered places by user preferences (categories and alsoPaid)", async () => {
            const findSpy = jest.spyOn(Place, "find").mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: "1", name: "Place" }]),
            } as any);

            await request(app)
                .get("/api/v1/places")
                .set("Authorization", `Bearer ${token}`);

            expect(findSpy).toHaveBeenCalledWith({
                categories: { $in: ["montagna", "lago"] },
                isFree: true
            });
        });

        it("should return all places if user has no preferences", async () => {
            userMock.preferences = { categories: [], alsoPaid: true };
            const findSpy = jest.spyOn(Place, "find").mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            } as any);

            await request(app)
                .get("/api/v1/places")
                .set("Authorization", `Bearer ${token}`);

            expect(findSpy).toHaveBeenCalledWith({});
        });

        it("should filter by distance and radius and sort results", async () => {
            jest.spyOn(Place, "find").mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                    { _id: "1", name: "Lontano", location: { lat: 46.0, lon: 9.0 } },
                    { _id: "2", name: "Vicino", location: { lat: 45.001, lon: 7.001 } }
                ]),
            } as any);

            const res = await request(app)
                .get("/api/v1/places?lat=45.0&lon=7.0&radius=5000")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe("Vicino");
            expect(res.body[0]).toHaveProperty("distance");
        });
    });

    describe("GET /api/v1/places/:id", () => {
        it("should return a place by id", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue({ _id: "123", name: "Test" } as any);
            const res = await request(app).get("/api/v1/places/123").set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
        });

        it("should return 400 if place not found", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue(null);
            const res = await request(app).get("/api/v1/places/123").set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Luogo non trovato");
        });
    });

    describe("POST /api/v1/places/request", () => {
        const validData = {
            name: "Nuovo Posto",
            description: "Descrizione lunga abbastanza",
            categories: ["a", "b", "c"],
            location: { lat: 45, lon: 7 },
            isFree: true
        };

        it("should return 409 if normalized name exists", async () => {
            jest.spyOn(Place, "findOne").mockResolvedValue({ _id: "old" } as any);
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({ ...validData, name: "Nùovò Pòstò!" });
            expect(res.status).toBe(409);
        });

        it("should return 400 if name is too short", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({ ...validData, name: "ab" });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Nome troppo corto");
        });

        it("should return 400 for invalid coordinates (NaN)", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({ ...validData, location: { lat: "not-a-number", lon: 7 } });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Coordinate non valide");
        });

        it("should return 400 if categories are not exactly 3", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({ ...validData, categories: ["a", "b"] });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Categorie non valide");
        });

        it("should return 400 for invalid image format", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({ ...validData, images: ["bad-format"] });
            expect(res.status).toBe(400);
        });

        it("should return 401 if user is not expert", async () => {
            userMock.expert = false;
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send(validData);
            expect(res.status).toBe(401);
        });
    });

    describe("PUT /api/v1/places/:id", () => {
        const placeId = "123456789012345678901234";
        const updateData = {
            name: "Update",
            description: "Descrizione valida",
            categories: ["a", "b", "c"],
            location: { lat: 45, lon: 7 },
            isFree: true
        };

        it("should check duplicates excluding current place ID", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue({ _id: placeId } as any);
            const findOneSpy = jest.spyOn(Place, "findOne").mockResolvedValue(null);
            jest.spyOn(PlaceEditRequest.prototype, "save").mockResolvedValue({} as any);

            await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(updateData);

            expect(findOneSpy).toHaveBeenCalledWith({
                normalizedName: "update",
                _id: { $ne: placeId }
            });
        });

        it("should return 400 if description is too long", async () => {
            const res = await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ ...updateData, description: "a".repeat(501) });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Descrizione troppo lunga");
        });

        it("should return 400 if description is too short", async () => {
            const res = await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ ...updateData, description: "corta" });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Descrizione troppo corta");
        });

        it("should return 400 if place to update does not exist", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue(null);
            const res = await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(updateData);
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Luogo non trovato");
        });
    });

    describe("Global Error Handling", () => {
        it("should return 500 on database crash", async () => {
            jest.spyOn(Place, "find").mockImplementation(() => { throw new Error("Crash"); });
            const res = await request(app).get("/api/v1/places").set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(500);
        });
    });
});
