import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Mock di bcrypt
jest.mock("bcrypt", () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));

const createFreshUserMock = () => ({
    _id: "user123",
    username: "testuser",
    password: "$2b$10$hashedpassword",
    save: jest.fn().mockResolvedValue(true),
});

describe("Auth API", () => {
    let userMock: any;

    beforeAll(() => {
        process.env.JWT_SECRET = "supersecret";
    });

    beforeEach(() => {
        userMock = createFreshUserMock();

        jest.spyOn(User, "findOne").mockImplementation(({ username }: any) => {
            if (username === "testuser") return Promise.resolve(userMock) as any;
            return Promise.resolve(null) as any;
        });

        jest.spyOn(User, "findById").mockImplementation((id: any) => {
            return {
                exec: jest.fn().mockResolvedValue(id === "user123" ? userMock : null),
            } as any;
        });

        jest.spyOn(User, "create").mockImplementation((data: any) => {
            return Promise.resolve({ ...data, _id: "newUser123" }) as any;
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("POST /api/v1/auth/login", () => {
        it("should return token with valid credentials", async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ username: "testuser", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
        });

        it("should return 400 with wrong password", async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ username: "testuser", password: "wrongpassword" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Username o password errati");
        });
    });

    describe("POST /api/v1/auth/register", () => {
        it("should register a new user successfully", async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_pass");

            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    username: "newuser",
                    name: "Mario",
                    surname: "Rossi",
                    email: "mario@example.com",
                    password: "securepassword"
                });

            expect(res.status).toBe(200);
            expect(res.body._id).toBe("newUser123");
        });

        it("should return 400 if any field is missing", async () => {
            // Invia stringhe vuote per attivare il controllo del controller
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({ 
                    username: "", 
                    name: "", 
                    surname: "", 
                    email: "", 
                    password: "" 
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Schema dati invalido");
        });
    });

    describe("Middleware: authenticate", () => {
        it("should return 401 if Authorization header is missing", async () => {
            const res = await request(app).get("/api/v1/missions");
            expect(res.status).toBe(401);
        });

        it("should return 401 for invalid token", async () => {
            const res = await request(app)
                .get("/api/v1/missions")
                .set("Authorization", "Bearer invalidtoken");
            
            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Token non valido o scaduto");
        });
    });
});
