import dotenv from "dotenv";
import { connectDatabase } from "./db.js";
import User from "./models/User.js";
import express from "express";

dotenv.config();
await connectDatabase();

const app = express();
const port = 3000;

app.get("/users", async (_, res) => {
    const usersDB = await User.find();
    const users = [];

    usersDB.forEach((u) => {
        users.push({
            self: `/users/${u._id}`,
            username: u.username,
            exp: u.exp,
        });
    });

    res.json(users);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
