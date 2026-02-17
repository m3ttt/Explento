import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/User.js";
import { getUserByUsername, parsePublicUser } from "../src/controllers/userController.js";
import { Request, Response } from "express";

const createUserMock = (overrides: any = {}) => ({
    _id: "user123",
    username: "testuser",
    name: "Mario",
    surname: "Rossi",
    email: "mario@test.com",
    exp: 42,
    profileImage: "profile.png",
    expert: false,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

describe("Users API", () => {
    let userMock: any;

    beforeEach(() => {
        userMock = createUserMock();

        jest.spyOn(User, "findOne").mockImplementation(({ username }: any) => {
            if (username === "testuser") return Promise.resolve(userMock) as any;
            return Promise.resolve(null) as any;
        });

        jest.spyOn(User, "find").mockImplementation((filter: any) => {
            let users = [
                createUserMock(),
                createUserMock({
                    _id: "user456",
                    username: "expertuser",
                    expert: true,
                }),
            ];
            if (filter.expert === true) users = users.filter((u) => u.expert);
            if (filter.expert === false) users = users.filter((u) => !u.expert);
            return Promise.resolve(users) as any;
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("Utility: parsePublicUser", () => {
        it("should only return public fields", () => {
            const publicData = parsePublicUser(userMock);
            expect(publicData).toHaveProperty("username");
            expect(publicData).toHaveProperty("exp");
            expect(publicData).toHaveProperty("self");
            expect(publicData).not.toHaveProperty("password");
            expect(publicData).not.toHaveProperty("email");
        });
    });

    describe("GET /api/v1/users/:username", () => {
        it("should return public data for existing user", async () => {
            const res = await request(app).get("/api/v1/users/testuser");
            expect(res.status).toBe(200);
            expect(res.body.username).toBe("testuser");
            expect(res.body.self).toMatch(/\/api\/v1\/users\/testuser/);
        });

        it("should return 404 if user not found", async () => {
            const res = await request(app).get("/api/v1/users/unknownuser");
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Utente non trovato");
        });

        it("should return 400 if username is empty (direct controller test)", async () => {
            const req = { params: { username: "" } } as unknown as Request;
            const jsonMock = jest.fn();
            const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
            const res = { status: statusMock } as unknown as Response;

            await getUserByUsername(req, res);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Nessuno Username inserito",
            });
        });

        it("should return 500 if DB findOne fails", async () => {
            jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("DB error"));
            const res = await request(app).get("/api/v1/users/testuser");
            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Errore del server");
        });
    });

    describe("GET /api/v1/users", () => {
        it("should return all users in public format", async () => {
            const res = await request(app).get("/api/v1/users");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).not.toHaveProperty("email");
        });

        it("should filter expert users correctly (expert=true)", async () => {
            const res = await request(app).get("/api/v1/users?expert=true");
            expect(res.status).toBe(200);
            expect(res.body.every((u: any) => u.username === "expertuser")).toBe(true);
        });

        it("should filter non-expert users correctly (expert=false)", async () => {
            const res = await request(app).get("/api/v1/users?expert=false");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].username).toBe("testuser");
        });

        it("should ignore invalid expert query values and return all", async () => {
            const res = await request(app).get("/api/v1/users?expert=maybe");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it("should return 500 if DB find fails", async () => {
            jest.spyOn(User, "find").mockRejectedValueOnce(new Error("DB error"));
            const res = await request(app).get("/api/v1/users");
            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Errore del server");
        });
    });

    describe("User Model Methods: addEXP", () => {
        it("should increase EXP correctly", async () => {
            const user = new User(createUserMock({ exp: 10 }));
            // Mock .save() del DB
            jest.spyOn(user, "save").mockResolvedValue(user as any);

            await user.addEXP(20);
            expect(user.exp).toBe(30);
            expect(user.expert).toBe(false);
        });

        it("should promote user to expert if EXP >= 50", async () => {
            const user = new User(createUserMock({ exp: 40, expert: false }));
            jest.spyOn(user, "save").mockResolvedValue(user as any);

            await user.addEXP(15);
            expect(user.exp).toBe(55);
            expect(user.expert).toBe(true);
        });

        it("should not change expert status if already expert", async () => {
            const user = new User(createUserMock({ exp: 100, expert: true }));
            jest.spyOn(user, "save").mockResolvedValue(user as any);

            await user.addEXP(10);
            expect(user.expert).toBe(true);
        });
    });
});