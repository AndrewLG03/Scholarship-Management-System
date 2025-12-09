// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

let authController;
    try {
    authController = require('../controllers/auth.controller');
    } catch (err) {
    // si no existe el controlador, proveemos respuestas de placeholder
    authController = {
        register: (req, res) => res.status(501).json({ message: 'Register endpoint not implemented' }),
        login: (req, res) => res.status(501).json({ message: 'Login endpoint not implemented' })
    };
}

// endpoints mínimos
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;