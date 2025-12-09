// src/routes/apelacion.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/apelacion.controller");

// OBTENER TODAS LAS APELACIONES DE UNA SOLICITUD
router.get("/:id", controller.obtenerApelaciones);

// CREAR UNA NUEVA APELACIÓN
router.post("/:id", controller.crearApelacion);

module.exports = router;