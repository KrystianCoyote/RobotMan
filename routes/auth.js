const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: "El usuario ya existe" });
        user = new User({ username, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // --- LÓGICA DE ADMINS POR DEFECTO ---
        const admins = ["admin", "joel"];
        if (admins.includes(username.toLowerCase())) {
            user.role = "admin";
        }
        
        await user.save();
        const payload = { user: { id: user.id, username: user.username, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload.user });
        });
    } catch (err) {
        res.status(500).send("Error del servidor");
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: "Credenciales inválidas" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Credenciales inválidas" });
        const payload = { user: { id: user.id, username: user.username, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload.user });
        });
    } catch (err) {
        res.status(500).send("Error del servidor");
    }
});

module.exports = router;
