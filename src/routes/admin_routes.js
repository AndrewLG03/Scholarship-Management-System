// src/routes/admin_routes.js
const express = require('express');
const adminController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

// Todas las rutas requieren TRABAJADORA SOCIAL
router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));

/* =====================================================
   PERIODOS
===================================================== */
router.get('/periodos', adminController.listPeriodos);
router.get('/periodos/:id', adminController.getPeriodo);
router.post('/periodos', adminController.createPeriodo);
router.put('/periodos/:id', adminController.updatePeriodo);
router.delete('/periodos/:id', adminController.deletePeriodo);

/* =====================================================
   CONVOCATORIAS
===================================================== */
router.get('/convocatorias', adminController.listConvocatorias);
router.post('/convocatorias', adminController.createConvocatoria);
router.put('/convocatorias/:id/estado', adminController.updateConvocatoriaEstado);
router.put('/convocatorias/:id/abrir', adminController.abrirConvocatoria);
router.put('/convocatorias/:id/cerrar', adminController.cerrarConvocatoria);

/* =====================================================
   TIPOS DE BECA
===================================================== */
router.get('/tipos-beca', adminController.listTiposBeca);
router.get('/tipos-beca/:id', adminController.getTipoBeca);
router.post('/tipos-beca', adminController.createTipoBeca);
router.put('/tipos-beca/:id', adminController.updateTipoBeca);
router.delete('/tipos-beca/:id', adminController.deleteTipoBeca);

/* =====================================================
   SOLICITUDES
===================================================== */
router.get('/solicitudes', adminController.listSolicitudes);
router.get('/solicitudes/:id', adminController.getSolicitud);
router.put('/solicitudes/:id/estado', adminController.updateSolicitudEstado);

/* =====================================================
   INFO SOCIOECONÓMICA
===================================================== */
router.get('/socioeconomico/casos', adminController.listCasosSocioeconomicos);

/* =====================================================
   EVALUACIÓN ACADÉMICA
===================================================== */
router.get('/academico/estudiantes', adminController.listEvaluacionAcademica);

module.exports = router;
