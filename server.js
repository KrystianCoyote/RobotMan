const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/comments", require("./routes/comments"));

// Opciones de conexión para mejorar compatibilidad
const dbOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI, dbOptions)
    .then(() => console.log("? Conectado a MongoDB Atlas"))
    .catch(err => {
        console.error("? Error de conexión detallado:");
        console.error("Código:", err.code);
        console.error("Mensaje:", err.message);
        if (err.message.includes("ECONNREFUSED")) {
            console.log("\n?? SUGERENCIA: Tu proveedor de internet está bloqueando la conexión DNS SRV.");
            console.log("Intenta cambiar los DNS de tu computadora a 8.8.8.8 y 8.8.4.4 (Google)");
            console.log("o usa una conexión de datos móviles para probar.");
        }
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`?? Servidor en puerto ${PORT}`));
