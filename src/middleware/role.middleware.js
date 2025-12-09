// src/middleware/role.middleware.js

// Middleware para verificar rol de usuario
// Uso: router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));

function requireRole(requiredRole) {
  return (req, res, next) => {
    // Si no hay usuario en el request, no está autenticado
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Asumimos que el campo del rol en el usuario es "rol"
    // ajusta si en tu JWT/DB se llama diferente (p.ej. req.user.rol, req.user.role, etc.)
    const userRole = req.user.rol || req.user.role;

    if (userRole !== requiredRole) {
      return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
    }

    next();
  };
}

module.exports = { requireRole };
