import request from "supertest";
import app from "../src/app";
import Mission from "../src/models/Mission";
import { User } from "../src/models/User";
import jwt from "jsonwebtoken";

const createFreshUserMock = () => ({
    _id: "123",
    missionsProgresses: [] as any[],
    save: jest.fn().mockResolvedValue(true),
});

describe("Missions API", () => {
    let token: string;
    let userMock: ReturnType<typeof createFreshUserMock>;

    beforeAll(() => {
        process.env.JWT_SECRET = "supersecret";
        token = jwt.sign({ id: "123" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    });

    beforeEach(() => {
        userMock = createFreshUserMock();

        jest.spyOn(User, "findById").mockImplementation((id: any) => {
            return {
                exec: jest.fn().mockResolvedValue(userMock),
            } as any;
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("GET /api/v1/missions", () => {
        it("should return all missions", async () => {
            jest.spyOn(Mission, "find").mockReturnValue({
                lean: jest.fn().mockReturnValue([
                    { _id: "1", name: "Mission 1" },
                    { _id: "2", name: "Mission 2" },
                ]),
            } as any);

            const res = await request(app)
                .get("/api/v1/missions")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it("should return 500 on server error", async () => {
            jest.spyOn(Mission, "find").mockImplementation(() => {
                throw new Error("DB Error");
            });

            const res = await request(app)
                .get("/api/v1/missions")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Errore server");
        });
    });

    describe("GET /api/v1/missions/available", () => {
        it("should return only missions not yet active for user", async () => {
            userMock.missionsProgresses = [{ missionId: "1" }];

            const findSpy = jest.spyOn(Mission, "find").mockReturnValue({
                lean: jest.fn().mockReturnValue([{ _id: "2", name: "Mission 2" }]),
            } as any);

            const res = await request(app)
                .get("/api/v1/missions/available")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]._id).toBe("2");
            expect(findSpy).toHaveBeenCalledWith({ _id: { $nin: ["1"] } });
        });
    });

    describe("POST /api/v1/missions/activate", () => {
        it("should activate a mission for the user", async () => {
            const missionId = "2";
            jest.spyOn(Mission, "findById").mockResolvedValue({ _id: missionId } as any);

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

        it("should return 400 if mission already active", async () => {
            const missionId = "1";
            userMock.missionsProgresses = [{ missionId: "1" }];
            jest.spyOn(Mission, "findById").mockResolvedValue({ _id: missionId } as any);

            const res = await request(app)
                .post("/api/v1/missions/activate")
                .set("Authorization", `Bearer ${token}`)
                .send({ missionId });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missione già attiva per l'utente");
        });

        it("should return 404 if mission does not exist", async () => {
            jest.spyOn(Mission, "findById").mockResolvedValue(null);

            const res = await request(app)
                .post("/api/v1/missions/activate")
                .set("Authorization", `Bearer ${token}`)
                .send({ missionId: "ghost" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Missione non trovata");
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
            userMock.missionsProgresses = [{ missionId: "2" }];

            const res = await request(app)
                .delete("/api/v1/missions/2")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(userMock.missionsProgresses).toHaveLength(0);
        });

        it("should return 404 if mission not found in user account", async () => {
            userMock.missionsProgresses = [{ missionId: "1" }];

            const res = await request(app)
                .delete("/api/v1/missions/999")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Missione non trovata nell'account utente");
        });
    });

    describe("POST /api/v1/missions", () => {
        it("should create a new mission", async () => {
            const saveSpy = jest.spyOn(Mission.prototype, "save").mockResolvedValue({
                _id: "3",
                name: "New Mission",
                rewardExp: 100,
                categories: ["test"],
            });

            const newMission = {
                name: "New Mission",
                rewardExp: 100,
                categories: ["test"],
                description: "Test description",
                minLevel: 5
            };

            const res = await request(app)
                .post("/api/v1/missions")
                .set("Authorization", `Bearer ${token}`)
                .send(newMission);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.mission.name).toBe("New Mission");
            expect(saveSpy).toHaveBeenCalled();
        });

        it("should return 400 if required fields missing", async () => {
            const res = await request(app)
                .post("/api/v1/missions")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Incomplete" });
            
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Campi obbligatori mancanti");
        });

        it("should handle server error during creation", async () => {
            jest.spyOn(Mission.prototype, "save").mockRejectedValue(new Error("Save failed"));

            const res = await request(app)
                .post("/api/v1/missions")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Fail", rewardExp: 10, categories: ["fail"] });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Errore server");
        });
    });
});
