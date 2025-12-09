const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const uploadSolicitud = require("../middleware/uploadSolicitud.middleware"); // <-- IMPORT CORRECTO

// Controlador principal (panel, perfil, expediente…)
const studentController = require('../controllers/student.controller');

// Controlador para solicitudes / convocatorias / documentos
const studentSolicitudesCtrl = require('../controllers/studentSolicitudes.controller');

// ============================
//   PANEL / PERFIL / EXPEDIENTE
// ============================
router.get('/panel', authMiddleware, studentController.getDashboardPanel);

router.get('/perfil', authMiddleware, studentController.getPerfil);
router.put('/perfil', authMiddleware, studentController.updatePerfil);

router.get('/expediente', authMiddleware, studentController.getExpediente);
router.put('/expediente', authMiddleware, studentController.updateExpediente);

// ============================
//   C) SOLICITUD DE BECA
// ============================

// LISTA DE CONVOCATORIAS
router.get('/convocatorias', authMiddleware, studentSolicitudesCtrl.getConvocatorias);

// LISTA DE TIPOS DE BECA
router.get('/tipos-beca', authMiddleware, studentSolicitudesCtrl.getTiposBeca);

// ENVIAR SOLICITUD (solo si docs ok)
router.post('/solicitud/:id/enviar', authMiddleware, studentSolicitudesCtrl.enviarSolicitud);

// CREAR SOLICITUD
router.post('/solicitud', authMiddleware, studentSolicitudesCtrl.crearSolicitudBeca);

// LISTAR SOLICITUDES
router.get('/solicitudes', authMiddleware, studentSolicitudesCtrl.getMisSolicitudes);

// DOCUMENTOS DE UNA SOLICITUD
router.get(
  '/solicitudes/:id/documentos',
  authMiddleware,
  studentSolicitudesCtrl.getDocumentosSolicitud
);

// SUBIR DOCUMENTO
router.post(
  '/solicitudes/:id_solicitud_doc/subir',
  authMiddleware,
  uploadSolicitud.single("archivo"),
  studentSolicitudesCtrl.subirDocumentoSolicitud
);

// ============================
//  PLACEHOLDERS
// ============================
router.post('/documentos', authMiddleware, studentController.uploadDocument);
router.get('/resultados', authMiddleware, studentController.getResultados);
router.post('/apelaciones', authMiddleware, studentController.createAppeal);
router.post('/suspensiones', authMiddleware, studentController.createSuspension);

module.exports = router;