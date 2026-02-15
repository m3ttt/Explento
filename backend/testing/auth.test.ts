// tests/auth.test.ts
import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/User";
import jwt from "jsonwebtoken";
import { hash } from "bcrypt";

const createFreshUserMock = () => ({
  _id: "user123",
  username: "testuser",
  password: "$2b$10$hashedpassword",
  save: jest.fn().mockResolvedValue(true),
});

describe("Auth API", () => {
  let token: string;
  let userMock: ReturnType<typeof createFreshUserMock>;

  beforeAll(() => {
    token = jwt.sign(
      { id: "user123" },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "1h" }
    );
  });

  beforeEach(() => {
    userMock = createFreshUserMock();

    jest.spyOn(User, "findOne").mockImplementation(({ username }: any) => {
      if (username === "testuser") {
        return {
          exec: jest.fn().mockResolvedValue(userMock),
        } as any;
      }
      return { exec: jest.fn().mockResolvedValue(null) } as any;
    });

    jest.spyOn(User, "create").mockImplementation((data: any) => {
      return Promise.resolve({ ...data, _id: "newUser123" });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return token with valid credentials", async () => {
      // mock compare della password
      jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("should return 400 with wrong credentials", async () => {
      jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(false);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "wrongpass" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Username o password errati");
    });

    it("should return 400 if missing credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: "", password: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Credenziali non fornite");
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user with valid data", async () => {
      jest.spyOn(require("bcrypt"), "hash").mockResolvedValue("hashedpass");

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: "newuser",
          name: "New",
          surname: "User",
          email: "newuser@test.com",
          password: "password",
        });

      expect(res.status).toBe(200);
      expect(res.body._id).toBe("newUser123");
      expect(res.body.username).toBe("newuser");
    });

    it("should return 400 with missing data", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: "",
          name: "",
          surname: "",
          email: "",
          password: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Schema dati invalido");
    });

    it("should return 400 if creation fails", async () => {
      jest.spyOn(User, "create").mockRejectedValue(new Error("DB error"));
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: "failuser",
          name: "Fail",
          surname: "User",
          email: "fail@test.com",
          password: "password",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Errore nella creazione dell'utente");
    });
  });
});
