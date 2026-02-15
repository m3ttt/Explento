// tests/users.test.ts
import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/User";
import { getUserByUsername } from "../src/controllers/userController";
import { Request, Response } from "express";

const createUserMock = (overrides: any = {}) => ({
    _id: "user123",
    username: "testuser",
    exp: 42,
    profileImage: "profile.png",
    expert: false,
    ...overrides,
});

describe("Users API", () => {
    let userMock: ReturnType<typeof createUserMock>;

    beforeEach(() => {
        userMock = createUserMock();

        jest.spyOn(User, "findOne").mockImplementation(({ username }: any) => {
            if (username === "testuser")
                return Promise.resolve(userMock) as any;
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

    describe("GET /api/v1/users/:username", () => {
        it("should return public data for existing user", async () => {
            const res = await request(app).get("/api/v1/users/testuser");
            expect(res.status).toBe(200);
            expect(res.body.username).toBe("testuser");
            expect(res.body.self).toBe("/api/v1/users/testuser");
        });

        it("should return 404 if user not found", async () => {
            const res = await request(app).get("/api/v1/users/unknownuser");
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Utente non trovato");
        });

        it("should return 400 if username empty (direct controller test)", async () => {
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
    });

    describe("GET /api/v1/users", () => {
        it("should return all users", async () => {
            const res = await request(app).get("/api/v1/users");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it("should return only expert users when query expert=true", async () => {
            const res = await request(app).get("/api/v1/users?expert=true");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].username).toBe("expertuser");
        });

        it("should return only non-expert users when query expert=false", async () => {
            const res = await request(app).get("/api/v1/users?expert=false");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].username).toBe("testuser");
        });

        it("should handle server error gracefully", async () => {
            jest.spyOn(User, "find").mockRejectedValueOnce(
                new Error("DB error"),
            );

            const res = await request(app).get("/api/v1/users");
            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Errore del server");
        });
    });
});
