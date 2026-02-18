import request from "supertest";
import app from "../src/app.js";
import jwt from "jsonwebtoken";
import { Operator } from "../src/models/Operator.js";
import { User } from "../src/models/User.js";
import { PlaceEditRequest } from "../src/models/PlaceEditRequest.js";
import { Place } from "../src/models/Place.js";
import bcrypt from "bcrypt";
import { Types } from "mongoose";

const createOperatorMock = () => ({
    _id: new Types.ObjectId().toHexString(),
    email: "operator@test.com",
    password: "$2b$10$hashedpassword",
});

const createUserMock = () => ({
    _id: new Types.ObjectId().toHexString(),
    addEXP: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
});

const mockQuery = <T>(result: T) => ({ exec: jest.fn().mockResolvedValue(result) });

describe("Operator API", () => {
    let token: string;
    let operatorMock: any;
    let userMock: any;

    beforeAll(() => {
        process.env.JWT_SECRET ||= "supersecret";
        token = jwt.sign(
            { id: "op123", role: "operator" }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );
    });

    beforeEach(() => {
        operatorMock = createOperatorMock();
        userMock = createUserMock();

        // Mock dei modelli principali
        jest.spyOn(Operator, "findOne").mockImplementation(() => mockQuery(operatorMock) as any);
        jest.spyOn(Operator, "findById").mockImplementation(() => mockQuery(operatorMock) as any);
        jest.spyOn(User, "findById").mockImplementation(() => mockQuery(userMock) as any);

        // Mock PlaceEditRequest.findById
        jest.spyOn(PlaceEditRequest, "findById").mockImplementation(id =>
            mockQuery({
                _id: id,
                userId: userMock._id,
                status: "pending",
                isNewPlace: false,
                placeId: new Types.ObjectId().toHexString(),
                proposedChanges: { name: "Nuovo Nome" },
                save: jest.fn().mockResolvedValue(true),
            }) as any
        );

        // Mock PlaceEditRequest.find per i filtri
        jest.spyOn(PlaceEditRequest, "find").mockImplementation(() =>
            mockQuery([
                { _id: "edit1", status: "pending", isNewPlace: false },
                { _id: "edit2", status: "approved", isNewPlace: true },
            ]) as any
        );

        // Mock Place: gestisce sia la modifica che la creazione (new Place)
        jest.spyOn(Place.prototype, "save").mockResolvedValue({ _id: "new_place_123" } as any);
        
        jest.spyOn(Place, "findById").mockImplementation(id =>
            mockQuery({
                _id: id,
                name: "Vecchio Nome",
                categories: ["montagna"],
                location: { lat: 0, lon: 0 },
                isFree: true,
                set: jest.fn(), // Necessario per place.set('normalizedName', ...)
                save: jest.fn().mockResolvedValue(true),
            }) as any
        );

        jest.spyOn(bcrypt, "compare").mockImplementation(async (plain) => plain === "password");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("POST /login", () => {
        it("should login operator with valid credentials", async () => {
            const res = await request(app)
                .post("/api/v1/operator/login")
                .send({ email: "operator@test.com", password: "password" });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
        });

        it("should return 400 if email or password are empty", async () => {
            const res = await request(app)
                .post("/api/v1/operator/login")
                .send({ email: "", password: "" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Email e/o password mancanti");
        });

        it("should fail with wrong password", async () => {
            const res = await request(app)
                .post("/api/v1/operator/login")
                .send({ email: "operator@test.com", password: "wrongpass" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Email o password errati");
        });

        it("should return 400 if operator is not found", async () => {
            jest.spyOn(Operator, "findOne").mockImplementation(() => mockQuery(null) as any);
            const res = await request(app)
                .post("/api/v1/operator/login")
                .send({ email: "ghost@test.com", password: "password" });
            expect(res.status).toBe(400);
        });
    });

    describe("GET /me", () => {
        it("should return operator info", async () => {
            const res = await request(app)
                .get("/api/v1/operator/me")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.email).toBe("operator@test.com");
        });

        it("should return 401 without token", async () => {
            const res = await request(app).get("/api/v1/operator/me");
            expect(res.status).toBe(401);
        });
    });

    describe("GET /place_edit_requests", () => {
        it("should return all requests", async () => {
            const res = await request(app)
                .get("/api/v1/operator/place_edit_requests")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it("should filter by status", async () => {
            const res = await request(app)
                .get("/api/v1/operator/place_edit_requests?status=pending")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(PlaceEditRequest.find).toHaveBeenCalledWith(expect.objectContaining({ status: "pending" }));
        });

        it("should return 400 for invalid status filter", async () => {
            const res = await request(app)
                .get("/api/v1/operator/place_edit_requests?status=invalid")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
        });
    });

    describe("GET /place_edit_requests/:id", () => {
        it("should return a single request", async () => {
            const res = await request(app)
                .get("/api/v1/operator/place_edit_requests/edit1")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body._id).toBe("edit1");
        });
    });

    describe("PATCH /place_edit_requests/:id", () => {
        it("should approve a pending request and add EXP", async () => {
            const res = await request(app)
                .patch("/api/v1/operator/place_edit_requests/edit1")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "approved", operatorComment: "Ottimo lavoro" });
            
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Richiesta processata con successo");
            expect(userMock.addEXP).toHaveBeenCalledWith(10);
            expect(userMock.save).toHaveBeenCalled();
        });

        it("should approve a new place request and add 3x EXP", async () => {
            // Mock specifico per nuova richiesta luogo
            jest.spyOn(PlaceEditRequest, "findById").mockImplementation(id =>
                mockQuery({
                    _id: id,
                    userId: userMock._id,
                    status: "pending",
                    isNewPlace: true,
                    proposedChanges: { name: "Nuovo Posto", location: { lat: 1, lon: 1 } },
                    save: jest.fn().mockResolvedValue(true),
                }) as any
            );

            const res = await request(app)
                .patch("/api/v1/operator/place_edit_requests/editNew")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "approved" });
            
            expect(res.status).toBe(200);
            expect(userMock.addEXP).toHaveBeenCalledWith(30);
        });

        it("should reject a request", async () => {
            const res = await request(app)
                .patch("/api/v1/operator/place_edit_requests/edit1")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "rejected" });
            
            expect(res.status).toBe(200);
            expect(userMock.addEXP).not.toHaveBeenCalled();
        });

        it("should return 400 if request is already processed", async () => {
            jest.spyOn(PlaceEditRequest, "findById").mockImplementation(id =>
                mockQuery({
                    _id: id,
                    status: "approved",
                }) as any
            );

            const res = await request(app)
                .patch("/api/v1/operator/place_edit_requests/edit1")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "rejected" });
            
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Richiesta già approved/);
        });

        it("should return 404 if original place is not found during approval", async () => {
            jest.spyOn(Place, "findById").mockImplementation(() => mockQuery(null) as any);

            const res = await request(app)
                .patch("/api/v1/operator/place_edit_requests/edit1")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "approved" });
            
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Place originale non trovato");
        });
    });

    describe("Authentication Middleware", () => {
        it("should return 401 for invalid token", async () => {
            const res = await request(app)
                .get("/api/v1/operator/me")
                .set("Authorization", "Bearer invalidtoken");
            expect(res.status).toBe(401);
        });

        it("should return 401 if operator no longer exists", async () => {
            jest.spyOn(Operator, "findById").mockImplementation(() => mockQuery(null) as any);
            const res = await request(app)
                .get("/api/v1/operator/me")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Operatore non trovato o permessi mancanti");
        });
    });
});
