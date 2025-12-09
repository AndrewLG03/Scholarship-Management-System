// backend/src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');
const solicitudRoutes = require('./solicitud.routes');
const resultadoRoutes = require('./resultado.routes');

const router = express.Router();

// Ruta de autenticación
router.use('/auth', authRoutes);

// Rutas de estudiantes, aspirantes, solicitudes, etc. se montan en la raíz de /api
router.use('/student', studentRoutes); //** Andres
router.use('/solicitudes', solicitudRoutes);
router.use('/resultados', resultadoRoutes);

// Rutas de administración (panel)
router.use('/admin', adminRoutes);

// Endpoint de salud
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;