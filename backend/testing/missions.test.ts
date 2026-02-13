// tests/missions.test.ts
import request from "supertest";
import app from "../src/app";
import Mission from "../src/models/Mission";
import { User } from "../src/models/User";
import jwt from "jsonwebtoken";

type MissionProgress = { missionId: string };

const createFreshUserMock = () => ({
  _id: "123",
  missionsProgresses: [] as MissionProgress[],
  save: jest.fn().mockResolvedValue(true),
});

describe("Missions API", () => {
  let token: string;
  let userMock: ReturnType<typeof createFreshUserMock>;

  beforeAll(() => {
    token = jwt.sign(
      { id: "123" },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "1h" }
    );
  });

  beforeEach(() => {
    // Reset del mock utente
    userMock = createFreshUserMock();

    // Spy con funzione che restituisce uno userMock aggiornabile
    jest.spyOn(User, "findById").mockImplementation((id: any) => {
      return {
        // exec simula la Promise di mongoose
        exec: jest.fn().mockResolvedValue(userMock),
      } as any;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/v1/missions", () => {
    beforeAll(() => {
      jest.spyOn(Mission, "find").mockReturnValue({
        lean: jest.fn().mockReturnValue([
          { _id: "1", name: "Mission 1" },
          { _id: "2", name: "Mission 2" },
        ]),
      } as any);
    });

    it("should return all missions", async () => {
      const res = await request(app)
        .get("/api/v1/missions")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe("GET /api/v1/missions/available", () => {
    beforeAll(() => {
      jest.spyOn(Mission, "find").mockReturnValue({
        lean: jest.fn().mockReturnValue([{ _id: "2", name: "Mission 2" }]),
      } as any);
    });

    it("should return only missions not yet active for user", async () => {
      userMock.missionsProgresses = [{ missionId: "1" }];

      const res = await request(app)
        .get("/api/v1/missions/available")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]._id).toBe("2");
    });
  });

  describe("POST /api/v1/missions/activate", () => {
    beforeAll(() => {
      jest.spyOn(Mission, "findById").mockReturnValue({
        lean: jest.fn().mockReturnValue({ _id: "2" }),
      } as any);
    });

    it("should activate a mission for the user", async () => {
      const missionId = "2";

      userMock.missionsProgresses = [];

      const res = await request(app)
        .post("/api/v1/missions/activate")
        .set("Authorization", `Bearer ${token}`)
        .send({ missionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(userMock.missionsProgresses).toContainEqual(
        expect.objectContaining({ missionId })
      );
    });

    it("should return 400 if missionId missing", async () => {
      const res = await request(app)
        .post("/api/v1/missions/activate")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Mancante missionId");
    });
  });

  describe("DELETE /api/v1/missions/:missionId", () => {
    it("should remove a mission from the user", async () => {
      // assegna missione da rimuovere
      userMock.missionsProgresses = [{ missionId: "2" }];

      const res = await request(app)
        .delete("/api/v1/missions/2")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(userMock.missionsProgresses).toHaveLength(0);
    });

    it("should return 404 if mission not found", async () => {
      const res = await request(app)
        .delete("/api/v1/missions/999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Missione non trovata nell'account utente");
    });
  });

  describe("POST /api/v1/missions", () => {
    beforeAll(() => {
      jest.spyOn(Mission.prototype, "save").mockResolvedValue({
        _id: "3",
        name: "New Mission",
        rewardExp: 100,
        categories: ["test"],
      });
    });

    it("should create a new mission", async () => {
      const newMission = {
        name: "New Mission",
        rewardExp: 100,
        categories: ["test"],
      };

      const res = await request(app)
        .post("/api/v1/missions")
        .set("Authorization", `Bearer ${token}`)
        .send(newMission);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.mission.name).toBe("New Mission");
    });

    it("should return 400 if required fields missing", async () => {
      const res = await request(app)
        .post("/api/v1/missions")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Campi obbligatori mancanti");
    });
  });
});
