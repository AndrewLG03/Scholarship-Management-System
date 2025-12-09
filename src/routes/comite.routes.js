const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth.middleware");
const { onlyCommittee } = require("../middleware/role.middleware");

const {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme,
} = require("../controllers/comite.controller");

// Rutas protegidas SOLO para comité de becas
router.get("/pendientes", verifyToken, onlyCommittee, getSolicitudesPendientes);
router.get("/expediente/:id", verifyToken, onlyCommittee, getExpediente);
router.put("/aprobar/:id", verifyToken, onlyCommittee, aprobarSolicitud);
router.put("/denegar/:id", verifyToken, onlyCommittee, denegarSolicitud);
router.get("/informe", verifyToken, onlyCommittee, generarInforme);

module.exports = router;
