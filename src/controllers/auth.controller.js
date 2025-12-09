// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

exports.register = async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !role)
            return res.status(400).json({ message: 'Email, password y role requeridos' });

        // Verificar si el correo ya existe
        const [exists] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1',
            [email]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: 'El correo ya está registrado' });
        }

        const hashed = await bcrypt.hash(password, 10);

        // Insertar usuario
        await pool.query(
            `INSERT INTO usuarios (nombre, correo, password, rol)
             VALUES (?, ?, ?, ?)`,
            [name || null, email, hashed, role]
        );

        res.status(201).json({ message: 'Usuario creado correctamente' });

    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: 'Email y password requeridos' });

        // Buscar usuario
        const [rows] = await pool.query(
            'SELECT id_usuario, correo, password, nombre, rol FROM usuarios WHERE correo = ? LIMIT 1',
            [email]
        );

        const user = rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear JWT
        const token = jwt.sign(
            { id: user.id_usuario, role: user.rol },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Respuesta ajustada para frontend
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id_usuario,
                name: user.nombre,
                email: user.correo,
                role: user.rol
            }
        });

    } catch (err) {
        next(err);
    }
};

// ====================================================
// GET /me
// ====================================================
exports.getMe = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "No autenticado" });

        const conn = await pool.getConnection();

        // buscar en usuarios primero
        let [rows] = await conn.query(
            `
            SELECT 
                id_usuario AS id,
                correo,
                nombre,
                rol
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [userId]
        );

        let user = rows[0];

        if (!user) {
            [rows] = await conn.query(
                `
                SELECT 
                    id_usuario AS id,
                    correo,
                    CONCAT(nombre, ' ', apellido1) AS nombre,
                    'aspirante' AS rol
                FROM aspirantes
                WHERE id_usuario = ?
                LIMIT 1
                `,
                [userId]
            );
            user = rows[0];
        }

        conn.release();

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        return res.json({ user });

    } catch (err) {
        next(err);
    }
};