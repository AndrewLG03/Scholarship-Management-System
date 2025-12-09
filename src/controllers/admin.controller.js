// backend/src/controllers/admin.controller.js
const { pool } = require('../config');

/**
 * Panel de administración.
 * Devuelve contadores de registros en las principales tablas del sistema.
 */
exports.getDashboard = async (req, res, next) => {
    try {
        const [[{ count: aspirantesCount }]]   = await pool.query('SELECT COUNT(*) AS count FROM aspirantes');
        const [[{ count: estudiantesCount }]]  = await pool.query('SELECT COUNT(*) AS count FROM estudiantes');
        const [[{ count: solicitudesCount }]]  = await pool.query('SELECT COUNT(*) AS count FROM solicitudes');
        const [[{ count: becasCount }]]        = await pool.query('SELECT COUNT(*) AS count FROM becas');
        const [[{ count: resolucionesCount }]] = await pool.query('SELECT COUNT(*) AS count FROM resoluciones');
        const [[{ count: apelacionesCount }]]  = await pool.query('SELECT COUNT(*) AS count FROM apelaciones');
        const [[{ count: suspensionesCount }]] = await pool.query('SELECT COUNT(*) AS count FROM suspensiones');
        const [[{ count: renovacionesCount }]] = await pool.query('SELECT COUNT(*) AS count FROM renovaciones');

        return res.json({
        aspirantesCount,
        estudiantesCount,
        solicitudesCount,
        becasCount,
        resolucionesCount,
        apelacionesCount,
        suspensionesCount,
        renovacionesCount,
        });
    } catch (err) {
        return next(err);
    }
};
