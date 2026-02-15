import request from "supertest";
import app from "../src/app";
import jwt from "jsonwebtoken";
import { Operator } from "../src/models/Operator";
import { User } from "../src/models/User";
import { PlaceEditRequest } from "../src/models/PlaceEditRequest";
import { Place } from "../src/models/Place";
import bcrypt from "bcrypt";

const createOperatorMock = () => ({
    _id: "op123",
    email: "operator@test.com",
    password: "$2b$10$hashedpassword",
});

const createUserMock = () => ({
    _id: "user123",
    addEXP: jest.fn(),
});

const mockQuery = <T>(result: T) => ({ exec: jest.fn().mockResolvedValue(result) });

describe("Operator API", () => {
    let token: string;
    let operatorMock: ReturnType<typeof createOperatorMock>;
    let userMock: ReturnType<typeof createUserMock>;

    beforeAll(() => {
        process.env.JWT_SECRET ||= "supersecret";
        token = jwt.sign({ id: "op123", role: "operator" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    });

    beforeEach(() => {
        operatorMock = createOperatorMock();
        userMock = createUserMock();

        jest.spyOn(Operator, "findOne").mockImplementation(() => mockQuery(operatorMock) as any);
        jest.spyOn(Operator, "findById").mockImplementation(() => mockQuery(operatorMock) as any);
        jest.spyOn(User, "findById").mockImplementation(() => mockQuery(userMock) as any);

        jest.spyOn(PlaceEditRequest, "findById").mockImplementation(id =>
            mockQuery({
                _id: id,
                userId: userMock._id,
                status: "pending",
                isNewPlace: false,
                placeId: "place123",
                proposedChanges: { name: "Nuovo Nome" },
                save: jest.fn(),
            }) as any
        );

        jest.spyOn(PlaceEditRequest, "find").mockImplementation(() =>
            mockQuery([
                { _id: "edit1", status: "pending", isNewPlace: false },
                { _id: "edit2", status: "approved", isNewPlace: true },
            ]) as any
        );

        jest.spyOn(Place.prototype, "save").mockResolvedValue({ _id: "place123" } as any);
        jest.spyOn(Place, "findById").mockImplementation(id =>
            mockQuery({
                _id: id,
                name: "Vecchio Nome",
                categories: ["montagna"],
                location: { lat: 0, lon: 0 },
                isFree: true,
                save: jest.fn(),
            }) as any
        );

        jest.spyOn(bcrypt, "compare").mockImplementation(async (plain) => plain === "password");
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("POST /login", () => {
        it("should login operator with valid credentials", async () => {
            const res = await request(app).post("/api/v1/operator/login").send({ email: "operator@test.com", password: "password" });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
        });

        it("should fail with wrong password", async () => {
            const res = await request(app).post("/api/v1/operator/login").send({ email: "operator@test.com", password: "wrongpass" });
            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /place_edit_requests/:id", () => {
        it("should approve a pending request", async () => {
            const res = await request(app)
                .patch("/api/v1/operator/place_edit_requests/edit1")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "approved" });
            expect(res.status).toBe(200);
            expect(userMock.addEXP).toHaveBeenCalled();
        });
    });

    describe("GET /place_edit_requests", () => {
        it("should return all requests", async () => {
            const res = await request(app)
                .get("/api/v1/operator/place_edit_requests")
                .set("Authorization", `Bearer ${token}`);
            expect(res.body).toHaveLength(2);
        });
    });
});
