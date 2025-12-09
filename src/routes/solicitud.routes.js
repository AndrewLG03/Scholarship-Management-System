// src/routes/solicitud.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/solicitud.controller');
const multer = require('multer');
const path = require('path');

// Configuración de multer para manejo de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Carpeta donde se guardan los archivos
    cb(null, path.join(__dirname, '../../uploads/documentos'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Guardar solicitud completa
router.post('/completa', controller.guardarSolicitudCompleta);

// Documentos de la solicitud
router.post('/:id/docs', upload.single('archivo'), controller.subirDocumento);
router.get('/:id/docs', controller.obtenerDocumentos);


module.exports = router;
