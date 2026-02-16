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

    describe("PUT /api/v1/places/:id", () => {
        const placeId = "123456789012345678901234"; // Mock ID valido
        const validUpdate = {
            name: "Monte Bianco Aggiornato",
            description: "Una descrizione molto più lunga e dettagliata per superare la validazione",
            categories: ["montagna", "rilassante", "outdoor"],
            location: { lat: 45.1, lon: 7.1 },
            isFree: false
        };

        beforeEach(() => {
            // Mock di Place.findById per la validazione interna al controller
            jest.spyOn(Place, "findById").mockResolvedValue({
                _id: placeId,
                name: "Monte Bianco"
            } as any);

            // Mock del salvataggio della richiesta di modifica
            jest.spyOn(PlaceEditRequest.prototype, "save").mockResolvedValue({
                _id: "editReq123"
            } as any);
        });

        it("should create an update request for an existing place", async () => {
            const res = await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(validUpdate);

            expect(res.status).toBe(201);
            expect(res.body.message).toMatch(/Richiesta di modifica inviata/);
            expect(PlaceEditRequest.prototype.save).toHaveBeenCalled();
        });

        it("should return 400 if place does not exist", async () => {
            jest.spyOn(Place, "findById").mockResolvedValue(null);

            const res = await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(validUpdate);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Luogo non trovato");
        });

        it("should return 400 if validation fails (e.g. name too short)", async () => {
            const res = await request(app)
                .put(`/api/v1/places/${placeId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ ...validUpdate, name: "Mo" }); // Nome troppo corto

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Nome troppo corto");
        });
    });

    describe("POST /api/v1/places/request - Additional Cases", () => {
        it("should return 409 if a place with the same name already exists", async () => {
            // Mock di findOne per simulare un duplicato
            jest.spyOn(Place, "findOne").mockResolvedValue({
                _id: "existing_id",
                name: "Città Fantastica"
            } as any);

            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Città Fantastica",
                    description: "Descrizione valida lunga il giusto",
                    categories: ["città", "cultura", "gusto"],
                    location: { lat: 44.5, lon: 11.3 },
                    isFree: true
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toBe("Questo luogo esiste già nell'applicazione");
        });

        it("should return 400 if categories are not exactly 3", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Nuovo Posto",
                    description: "Descrizione valida lunga il giusto",
                    categories: ["città"], // Solo 1 categoria
                    location: { lat: 44.5, lon: 11.3 },
                    isFree: true
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Categorie non valide");
        });
    });

    describe("Edge Cases & Server Errors", () => {
        it("should return 500 if getPlaces fails", async () => {
            jest.spyOn(Place, "find").mockImplementation(() => {
                throw new Error("DB Crash");
            });

            const res = await request(app)
                .get("/api/v1/places")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Errore del server");
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

    describe("Validation & Security", () => {
        it("should return 400 if image format is not valid base64", async () => {
            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Posto con Immagine Rotta",
                    description: "Descrizione valida lunga il giusto",
                    categories: ["città", "cultura", "gusto"],
                    location: { lat: 44, lon: 11 },
                    isFree: true,
                    images: ["url-normale-non-base64.jpg"] // Errore nell'immagine
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Formato immagine non valido");
        });

        it("should return 401 if user object is missing in request", async () => {
            // Simula fallimento dell'autenticazione che non interrompe il flusso ma svuota req.user
            jest.spyOn(User, "findById").mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue(null),
            }) as any);

            const res = await request(app)
                .post("/api/v1/places/request")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    describe("GET /api/v1/places - Advanced Filtering", () => {
        it("should call find with category filters based on user preferences", async () => {
            const spy = jest.spyOn(Place, "find");
            
            // Imposta preferenze specifiche
            userMock.preferences = { categories: ["lago"], alsoPaid: false };

            await request(app)
                .get("/api/v1/places")
                .set("Authorization", `Bearer ${token}`);

            // Verifica che la query Mongoose contenga i filtri corretti
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                categories: { $in: ["lago"] },
                isFree: true
            }));
        });
    });
});
