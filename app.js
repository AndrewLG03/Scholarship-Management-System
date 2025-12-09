// backend/app.js - VERSIÓN CORREGIDA
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config();

const routes = require('./src/routes/index.js');
const errorHandler = require('./src/utils/errorHandler');

const app = express();

// ===============================
// DEBUG COMPLETO - CORREGIDO
// ===============================

// Debug para TODAS las rutas /api
app.use('/api', (req, res, next) => {
  console.log('🔍 [DEBUG] Ruta recibida en /api:', req.method, req.originalUrl);
  console.log('🔍 [DEBUG] Headers auth:', req.headers.authorization ? 'SI' : 'NO');
  next();
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
});

const path = require('path');

app.use(limiter);

// mount API routes
app.use('/api', routes);

// servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// root health
app.get('/', (req, res) => res.json({ ok: true, message: 'API - backend (Express + MySQL)' }));

// ===============================
// DEBUG PARA RUTAS NO ENCONTRADAS - CORREGIDO
// ===============================
app.use((req, res, next) => {
  console.log(' [DEBUG 404] Ruta NO encontrada:', req.method, req.originalUrl);
  console.log(' [DEBUG 404] Esta ruta no coincide con ningún patrón definido');
  next(); // Esto pasará al errorHandler que enviará el 404
});

// global error handler
app.use(errorHandler);

module.exports = app;
