// backend/server.js - entry point
require('dotenv').config();
const app = require('./app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        // probar conexión simple al pool
        if (pool) {
        // una consulta liviana para validar conexión
        const [rows] = await pool.query('SELECT 1 AS ok');
        if (!rows) console.warn('Warning: prueba de conexión MySQL devolvió sin rows');
        console.log('MySQL pool OK.');
        } else {
        console.warn('Pool MySQL no encontrado, saltando verificación.');
        }

        app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error iniciando la app:', err);
        process.exit(1);
    }
    })
();
