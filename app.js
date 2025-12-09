// backend/app.js - VERSIÓN FINAL PRODUCCIÓN
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const path = require('path');

const apiRoutes = require('./src/routes/index.js');
const errorHandler = require('./src/utils/errorHandler');

const app = express();

// ===============================
// DEBUG GENERAL PARA /api
// ===============================
app.use('/api', (req, res, next) => {
  console.log('🔍 [DEBUG] Ruta recibida:', req.method, req.originalUrl);
  console.log('🔍 [DEBUG] Auth header:', req.headers.authorization ? 'PRESENTE' : 'AUSENTE');
  next();
});

// ===============================
// SEGURIDAD Y CONFIGURACIONES
// ===============================
app.use(helmet());

app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));

// ===============================
// RATE LIMIT
// ===============================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
});
app.use(limiter);

// ===============================
// RUTAS ESPECIALES 2FA (ANTES DE LAS GENERALES)
// ===============================
app.use('/api/2fa', require('./src/routes/2fa.routes'));

// ===============================
// RUTAS PRINCIPALES /api
// ===============================
app.use('/api', apiRoutes);

// ===============================
// ARCHIVOS ESTÁTICOS (descarga de PDFs, imágenes, docs)
// ===============================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================
// RUTA BASE (HEALTH CHECK)
// ===============================
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API backend corriendo correctamente (Express + MySQL)'
  });
});

// ===============================
// CAPTURA DE 404
// ===============================
app.use((req, res, next) => {
  console.log('⚠️ [DEBUG 404] Ruta NO encontrada:', req.method, req.originalUrl);
  next();
});

// ===============================
// HANDLER GLOBAL DE ERRORES
// ===============================
app.use(errorHandler);

module.exports = app;