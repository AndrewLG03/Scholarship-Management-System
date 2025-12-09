// backend/server.js - entry point
require('dotenv').config();
const app = require('./app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        // Prueba de conexión MySQL
        const [rows] = await pool.query('SELECT 1 AS ok');
        console.log('MySQL pool OK.');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });

    } catch (err) {
        console.error('Error iniciando la app:', err);
        process.exit(1);
    }
})();