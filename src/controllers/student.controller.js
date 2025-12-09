// src/controllers/student.controller.js
const { pool } = require('../config/database');

// ======================================
// DASHBOARD DEL ESTUDIANTE BECADO
// ======================================
exports.getDashboardPanel = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Solo estudiantes pueden usar este panel
    const allowedRoles = ['estudiante', 'ESTUDIANTE', 'Estudiante'];
    if (!allowedRoles.includes(roleRaw) && role !== 'estudiante') {
      return res
        .status(403)
        .json({ message: 'Acceso restringido al panel de estudiante' });
    }

    // 1) Datos básicos del estudiante (usuarios + estudiantes)
    const [studentRows] = await pool.query(
      `
      SELECT 
        u.id_usuario,
        u.nombre AS nombre_usuario,
        u.correo,
        u.rol,
        e.id_estudiante,
        e.carnet,
        e.carrera,
        e.promedio
      FROM usuarios u
      LEFT JOIN estudiantes e ON e.id_usuario = u.id_usuario
      WHERE u.id_usuario = ?
      LIMIT 1
      `,
      [userId]
    );

    if (studentRows.length === 0) {
      return res
        .status(404)
        .json({ message: 'No se encontró información de estudiante para este usuario' });
    }

    const student = studentRows[0];

    // 2) Beca actual
    const [becaRows] = await pool.query(
      `
      SELECT 
        b.id_beca,
        b.valor,
        b.fecha_inicio,
        b.fecha_fin,
        b.estado,
        tb.nombre       AS tipo_beca,
        tb.modalidad    AS modalidad_beca,
        tb.codigo       AS codigo_beca,
        c.nombre        AS convocatoria,
        p.anio,
        p.ciclo
      FROM becas b
      JOIN solicitudes s        ON b.id_solicitud = s.id_solicitud
      LEFT JOIN tipos_beca tb   ON b.id_tipo_beca = tb.id_tipo_beca
      LEFT JOIN convocatorias c ON s.id_convocatoria = c.id_convocatoria
      LEFT JOIN periodos p      ON c.id_periodo = p.id_periodo
      WHERE s.id_estudiante = ?
      ORDER BY 
        CASE WHEN b.estado = 'ACTIVA' THEN 0 ELSE 1 END,
        b.fecha_inicio DESC
      LIMIT 1
      `,
      [student.id_estudiante]
    );

    const becaActual = becaRows[0] || null;

    // 3) Resumen de solicitudes del estudiante
    const [solicitudesStatsRows] = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'EN_EVALUACION' THEN 1 ELSE 0 END) AS enEvaluacion,
        SUM(CASE WHEN estado = 'APROBADA'       THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado = 'RECHAZADA'      THEN 1 ELSE 0 END) AS rechazadas
      FROM solicitudes
      WHERE id_estudiante = ?
      `,
      [student.id_estudiante]
    );

    const solicitudesStats =
      solicitudesStatsRows[0] || {
        total: 0,
        enEvaluacion: 0,
        aprobadas: 0,
        rechazadas: 0,
      };

    // 4) Documentos de solicitudes (cantidad total y válidos)
    const [docsStatsRows] = await pool.query(
      `
      SELECT 
        COUNT(*) AS total_docs,
        SUM(CASE WHEN sd.valido = 'SI' THEN 1 ELSE 0 END) AS docs_validos
      FROM solicitud_docs sd
      JOIN solicitudes s ON sd.id_solicitud = s.id_solicitud
      WHERE s.id_estudiante = ?
      `,
      [student.id_estudiante]
    );

    const docsStats =
      docsStatsRows[0] || {
        total_docs: 0,
        docs_validos: 0,
      };

    // 5) Notificaciones recientes
    const [notificacionesRows] = await pool.query(
      `
      SELECT 
        id_notificacion,
        tipo,
        mensaje,
        fecha_envio,
        leido
      FROM notificaciones
      WHERE id_usuario = ?
      ORDER BY fecha_envio DESC
      LIMIT 10
      `,
      [userId]
    );

    // 6) Seguimiento de desempeño por periodo
    const [seguimientoRows] = await pool.query(
      `
      SELECT 
        se.id_seguimiento,
        se.promedio_verif,
        se.cumple,
        se.nota,
        p.anio,
        p.ciclo
      FROM seguimientos se
      JOIN becas b        ON se.id_beca = b.id_beca
      JOIN solicitudes s  ON b.id_solicitud = s.id_solicitud
      LEFT JOIN periodos p ON se.id_periodo = p.id_periodo
      WHERE s.id_estudiante = ?
      ORDER BY p.anio DESC, p.ciclo DESC
      `,
      [student.id_estudiante]
    );

    // 7) Renovaciones
    const [renovacionesRows] = await pool.query(
      `
      SELECT 
        r.id_renovacion,
        r.fecha,
        r.estado
      FROM renovaciones r
      JOIN becas b       ON r.id_beca = b.id_beca
      JOIN solicitudes s ON b.id_solicitud = s.id_solicitud
      WHERE s.id_estudiante = ?
      ORDER BY r.fecha DESC
      `,
      [student.id_estudiante]
    );

    // Respuesta
    return res.json({
      user: {
        id: student.id_usuario,
        nombre: student.nombre_usuario,
        correo: student.correo,
        rol: student.rol,
        carnet: student.carnet,
        carrera: student.carrera,
        promedio: student.promedio,
      },
      becaActual: becaActual
        ? {
            id: becaActual.id_beca,
            tipo: becaActual.tipo_beca,
            modalidad: becaActual.modalidad_beca,
            codigo: becaActual.codigo_beca,
            valor: becaActual.valor,
            estado: becaActual.estado,
            periodo:
              becaActual.anio && becaActual.ciclo
                ? `${becaActual.anio}-${becaActual.ciclo}`
                : null,
            convocatoria: becaActual.convocatoria,
            fechaInicio: becaActual.fecha_inicio,
            fechaFin: becaActual.fecha_fin,
          }
        : null,
      stats: {
        solicitudes: solicitudesStats,
        documentos: {
          total: docsStats.total_docs || 0,
          aprobados: docsStats.docs_validos || 0,
          pendientes:
            (docsStats.total_docs || 0) - (docsStats.docs_validos || 0),
        },
      },
      notificaciones: notificacionesRows,
      seguimiento: seguimientoRows,
      renovaciones: renovacionesRows,
    });
  } catch (err) {
    next(err);
  }
};

// =========================
// HELPER: estudiante + última solicitud
// =========================
async function getEstudianteYUltimaSolicitud(userId) {
  // 1) buscar estudiante ligado al usuario
  const [estRows] = await pool.query(
    `
    SELECT e.id_estudiante
    FROM estudiantes e
    WHERE e.id_usuario = ?
    LIMIT 1
    `,
    [userId]
  );

  if (estRows.length === 0) {
    throw new Error('NO_ESTUDIANTE');
  }

  const idEstudiante = estRows[0].id_estudiante;

  // 2) buscar la solicitud más reciente del estudiante
  const [solRows] = await pool.query(
    `
    SELECT id_solicitud
    FROM solicitudes
    WHERE id_estudiante = ?
    ORDER BY fecha_creacion DESC
    LIMIT 1
    `,
    [idEstudiante]
  );

  if (solRows.length === 0) {
    throw new Error('NO_SOLICITUD');
  }

  return {
    idEstudiante,
    idSolicitud: solRows[0].id_solicitud,
  };
}

// =========================
// GET /api/student/expediente
// =========================
exports.getExpediente = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (role !== 'estudiante') {
      return res
        .status(403)
        .json({ message: 'Acceso restringido al expediente de estudiante' });
    }

    let idSolicitud;
    try {
      const infoBase = await getEstudianteYUltimaSolicitud(userId);
      idSolicitud = infoBase.idSolicitud;
    } catch (e) {
      if (e.message === 'NO_ESTUDIANTE') {
        return res
          .status(404)
          .json({ message: 'No se encontró estudiante asociado al usuario' });
      }
      if (e.message === 'NO_SOLICITUD') {
        // Sin solicitud todavía: devolver expediente vacío para que el front pinte el formulario
        return res.json({
          socioeconomica: null,
          familiares: [],
        });
      }
      throw e;
    }

    // 1) info_socioeconomica ligada a la última solicitud
    const [infoRows] = await pool.query(
      `
      SELECT 
        id_info,
        ocupacion_padre,
        ocupacion_madre,
        ingreso_total,
        egreso_total,
        tipo_vivienda,
        condicion_vivienda,
        servicios_basicos,
        observaciones
      FROM info_socioeconomica
      WHERE id_solicitud = ?
      LIMIT 1
      `,
      [idSolicitud]
    );

    if (infoRows.length === 0) {
      // Sin registro socioeconómico todavía
      return res.json({
        socioeconomica: null,
        familiares: [],
      });
    }

    const info = infoRows[0];

    // 2) familiares ligados a esa info_socioeconomica
    const [famRows] = await pool.query(
      `
      SELECT 
        id_familiar,
        id_info,
        nombre,
        parentesco,
        edad,
        ocupacion,
        ingreso_mensual,
        nivel_educativo
      FROM familiares
      WHERE id_info = ?
      `,
      [info.id_info]
    );

    return res.json({
      socioeconomica: {
        ocupacion_padre: info.ocupacion_padre,
        ocupacion_madre: info.ocupacion_madre,
        ingreso_total: info.ingreso_total,
        egreso_total: info.egreso_total,
        tipo_vivienda: info.tipo_vivienda,
        condicion_vivienda: info.condicion_vivienda,
        servicios_basicos: info.servicios_basicos,
        observaciones: info.observaciones,
      },
      familiares: famRows.map((f) => ({
        id_familiar: f.id_familiar,
        nombre: f.nombre,
        parentesco: f.parentesco,
        edad: f.edad,
        ocupacion: f.ocupacion,
        ingreso_mensual: f.ingreso_mensual,
        nivel_educativo: f.nivel_educativo,
      })),
    });
  } catch (err) {
    console.error('Error GET expediente:', err);
    return res.status(500).json({
      error: true,
      message: err.message,
    });
  }
};

// =========================
// PUT /api/student/expediente
// =========================
exports.updateExpediente = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();

    if (!userId) {
      conn.release();
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (role !== 'estudiante') {
      conn.release();
      return res
        .status(403)
        .json({ message: 'Acceso restringido al expediente de estudiante' });
    }

    let idSolicitud;
    try {
      const infoBase = await getEstudianteYUltimaSolicitud(userId);
      idSolicitud = infoBase.idSolicitud;
    } catch (e) {
      if (e.message === 'NO_ESTUDIANTE') {
        conn.release();
        return res
          .status(404)
          .json({ message: 'No se encontró estudiante asociado al usuario' });
      }
      if (e.message === 'NO_SOLICITUD') {
        conn.release();
        return res.status(400).json({
          message:
            'El estudiante no tiene solicitudes registradas para asociar el expediente',
        });
      }
      throw e;
    }

    const socio = req.body.socioeconomica || {};
    const familiares = Array.isArray(req.body.familiares)
      ? req.body.familiares
      : [];

    const toNumber = (val) => {
      if (val === undefined || val === null || val === '') return null;
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    };

    await conn.beginTransaction();

    // 1) buscar/crear info_socioeconomica por id_solicitud
    const [infoRows] = await conn.query(
      'SELECT id_info FROM info_socioeconomica WHERE id_solicitud = ? LIMIT 1',
      [idSolicitud]
    );

    let idInfo;

    const socioParams = [
      socio.ocupacion_padre || null,
      socio.ocupacion_madre || null,
      socio.ingreso_total || null, // son VARCHAR en la BD
      socio.egreso_total || null,
      socio.tipo_vivienda || null,
      socio.condicion_vivienda || null,
      socio.servicios_basicos || null,
      socio.observaciones || null,
    ];

    if (infoRows.length === 0) {
      const [ins] = await conn.query(
        `
        INSERT INTO info_socioeconomica (
          id_solicitud,
          ocupacion_padre,
          ocupacion_madre,
          ingreso_total,
          egreso_total,
          tipo_vivienda,
          condicion_vivienda,
          servicios_basicos,
          observaciones
        ) VALUES (?,?,?,?,?,?,?,?,?)
        `,
        [idSolicitud, ...socioParams]
      );
      idInfo = ins.insertId;
    } else {
      idInfo = infoRows[0].id_info;
      await conn.query(
        `
        UPDATE info_socioeconomica SET
          ocupacion_padre   = ?,
          ocupacion_madre   = ?,
          ingreso_total     = ?,
          egreso_total      = ?,
          tipo_vivienda     = ?,
          condicion_vivienda= ?,
          servicios_basicos = ?,
          observaciones     = ?
        WHERE id_info = ?
        `,
        [...socioParams, idInfo]
      );
    }

    // 2) familiares -> reemplazamos todos los registros del id_info
    await conn.query('DELETE FROM familiares WHERE id_info = ?', [idInfo]);

    for (const fam of familiares) {
      await conn.query(
        `
        INSERT INTO familiares (
          id_info,
          nombre,
          parentesco,
          edad,
          ocupacion,
          ingreso_mensual,
          nivel_educativo
        ) VALUES (?,?,?,?,?,?,?)
        `,
        [
          idInfo,
          fam.nombre || null,
          fam.parentesco || null,
          toNumber(fam.edad),
          fam.ocupacion || null,
          toNumber(fam.ingreso_mensual),
          fam.nivel_educativo || null,
        ]
      );
    }

    await conn.commit();

    return res.json({ message: 'Expediente actualizado correctamente' });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    console.error('Error PUT expediente:', err);
    return res.status(500).json({
      error: true,
      message: err.message,
    });
  } finally {
    conn.release();
  }
};

// ======================================
// PERFIL DEL ESTUDIANTE
// ======================================

// Helper para normalizar fecha en el backend
function normalizarFecha(fecha) {
  if (!fecha) return null;
  let value = String(fecha).trim();
  if (value === '') return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // DD/MM/YYYY
  if (value.includes('/')) {
    const [d, m, y] = value.split('/');
    if (y && m && d) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // DD-MM-YYYY
  if (value.includes('-')) {
    const [a, b, c] = value.split('-');
    if (a.length !== 4) {
      return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    }
  }

  return value;
}

// ===============================
// GET /api/student/perfil
// ===============================
exports.getPerfil = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1) Usuario básico
    const [uRows] = await pool.query(
      `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.correo,
        u.rol
      FROM usuarios u
      WHERE u.id_usuario = ?
      LIMIT 1
      `,
      [userId]
    );

    if (uRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = uRows[0];

    // 2) Datos académicos del estudiante
    const [eRows] = await pool.query(
      `
      SELECT 
        carnet,
        carrera,
        promedio
      FROM estudiantes
      WHERE id_usuario = ?
      LIMIT 1
      `,
      [userId]
    );

    const estudiante = eRows.length ? eRows[0] : {};

    // 3) Información personal adicional del info_usuario
    const [infoRows] = await pool.query(
      `
      SELECT 
        fecha_nacimiento,
        telefono,
        direccion,
        provincia,
        canton,
        distrito,
        genero,
        estado_civil,
        curp
      FROM info_usuario
      WHERE id_usuario = ?
      LIMIT 1
      `,
      [userId]
    );

    const info = infoRows.length ? infoRows[0] : {};

    return res.json({
      // Datos básicos
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,

      // Académico
      carnet: estudiante.carnet || null,
      carrera: estudiante.carrera || null,
      promedio: estudiante.promedio || null,

      // Información adicional
      telefono: info.telefono || null,
      direccion: info.direccion || null,
      fecha_nacimiento: info.fecha_nacimiento || null,
      genero: info.genero || null,
      estado_civil: info.estado_civil || null,
      curp: info.curp || null,
      provincia: info.provincia || null,
      canton: info.canton || null,
      distrito: info.distrito || null,
    });
  } catch (err) {
    console.error('Error en GET perfil:', err);
    res.status(500).json({ error: true, message: err.message });
  }
};

// ===============================
// PUT /api/student/perfil
// ===============================
exports.updatePerfil = async (req, res) => {
  try {
    const idUsuario = req.user.id;
    const {
      nombre,
      correo,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      estado_civil,
      curp,
      provincia,
      canton,
      distrito,
    } = req.body;

    const fNacimiento = normalizarFecha(fecha_nacimiento);

    // Actualizar tabla USUARIOS
    await pool.query(
      `
      UPDATE usuarios 
      SET nombre = ?, correo = ?
      WHERE id_usuario = ?
      `,
      [nombre || null, correo || null, idUsuario]
    );

    // Verificar info_usuario
    const [infoRows] = await pool.query(
      `
      SELECT id_info_usuario 
      FROM info_usuario 
      WHERE id_usuario = ? 
      LIMIT 1
      `,
      [idUsuario]
    );

    const params = [
      fNacimiento,
      telefono || null,
      direccion || null,
      provincia || null,
      canton || null,
      distrito || null,
      genero || null,
      estado_civil || null,
      curp || null,
    ];

    if (infoRows.length === 0) {
      await pool.query(
        `
        INSERT INTO info_usuario (
          id_usuario, fecha_nacimiento, telefono, direccion,
          provincia, canton, distrito, genero, estado_civil, curp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [idUsuario, ...params]
      );
    } else {
      await pool.query(
        `
        UPDATE info_usuario SET
          fecha_nacimiento = ?,
          telefono = ?,
          direccion = ?,
          provincia = ?,
          canton = ?,
          distrito = ?,
          genero = ?,
          estado_civil = ?,
          curp = ?
        WHERE id_usuario = ?
        `,
        [...params, idUsuario]
      );
    }

    return res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('Error UPDATE perfil:', err);
    return res.status(400).json({
      error: true,
      message:
        'Hay un error en los datos ingresados. Revisá el formato de la fecha u otros campos.',
    });
  }
};

// =====================================================
// GET /api/student/convocatorias
// =====================================================
exports.getConvocatoriasActivas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id_convocatoria,
        c.nombre,
        c.descripcion,
        c.fecha_inicio,
        c.fecha_fin,
        p.anio,
        p.ciclo
      FROM convocatorias c
      JOIN periodos p ON c.id_periodo = p.id_periodo
      WHERE c.estado = 'ACTIVA'
      ORDER BY c.fecha_inicio ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error GET convocatorias:", err);
    res.status(500).json({ message: "Error obteniendo convocatorias" });
  }
};

// =====================================================
// GET /api/student/tipos-beca/:id_convocatoria
// =====================================================
exports.getTiposBecaPorConvocatoria = async (req, res) => {
  try {
    const { id_convocatoria } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        tb.id_tipo_beca,
        tb.nombre,
        tb.modalidad,
        tb.descripcion,
        tb.codigo
      FROM convocatoria_tipos ct
      JOIN tipos_beca tb ON ct.id_tipo_beca = tb.id_tipo_beca
      WHERE ct.id_convocatoria = ?
    `, [id_convocatoria]);

    res.json(rows);
  } catch (err) {
    console.error("Error GET tipos beca:", err);
    res.status(500).json({ message: "Error obteniendo tipos de beca" });
  }
};

// =====================================================
// POST /api/student/solicitud (CREAR SOLICITUD DE BECA)
// =====================================================
exports.crearSolicitudBeca = async (req, res) => {
  try {
    const idUsuario = req.user.id;
    const { id_convocatoria, id_tipo_beca } = req.body;

    // 1) Obtener id_estudiante real
    const [estRows] = await pool.query(`
      SELECT id_estudiante
      FROM estudiantes
      WHERE id_usuario = ?
      LIMIT 1
    `, [idUsuario]);

    if (estRows.length === 0) {
      return res.status(404).json({ message: "No se encontró estudiante asociado" });
    }

    const idEstudiante = estRows[0].id_estudiante;

    // 2) Verifica si ya existe solicitud activa
    const [solRows] = await pool.query(`
      SELECT *
      FROM solicitudes
      WHERE id_estudiante = ?
      AND id_convocatoria = ?
      LIMIT 1
    `, [idEstudiante, id_convocatoria]);

    if (solRows.length > 0) {
      return res.status(400).json({ message: "Ya tienes una solicitud registrada para esta convocatoria" });
    }

    // 3) Crear solicitud
    const [insert] = await pool.query(`
      INSERT INTO solicitudes (
        id_estudiante,
        id_convocatoria,
        id_tipo_beca,
        fecha_creacion,
        estado
      ) VALUES (?, ?, ?, NOW(), 'EN_EVALUACION')
    `, [idEstudiante, id_convocatoria, id_tipo_beca]);

    res.json({
      message: "Solicitud creada correctamente",
      id_solicitud: insert.insertId
    });

  } catch (err) {
    console.error("Error POST solicitud:", err);
    res.status(500).json({ message: "Error al crear la solicitud" });
  }
};

// =====================================================
// GET /api/student/mis-solicitudes
// =====================================================
exports.getMisSolicitudes = async (req, res) => {
  try {
    const idUsuario = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        s.id_solicitud,
        s.fecha_creacion,
        s.estado,
        c.nombre AS convocatoria,
        tb.nombre AS tipo_beca,
        tb.modalidad
      FROM solicitudes s
      JOIN estudiantes e ON s.id_estudiante = e.id_estudiante
      JOIN convocatorias c ON s.id_convocatoria = c.id_convocatoria
      JOIN tipos_beca tb ON s.id_tipo_beca = tb.id_tipo_beca
      WHERE e.id_usuario = ?
      ORDER BY s.fecha_creacion DESC
    `, [idUsuario]);

    res.json(rows);

  } catch (err) {
    console.error("Error GET mis solicitudes:", err);
    res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
};



// =====================================================
// PLACEHOLDERS para otras funcionalidades
// =====================================================
exports.createSolicitudEstudiante = async (req, res) => {
  return res.json({
    message: 'createSolicitudEstudiante pendiente de implementar',
  });
};

exports.createSolicitudAspirante = async (req, res) => {
  return res.json({
    message: 'createSolicitudAspirante pendiente de implementar',
  });
};

exports.uploadDocument = async (req, res) => {
  return res.json({ message: 'uploadDocument pendiente de implementar' });
};

exports.getResultados = async (req, res) => {
  return res.json({ message: 'getResultados pendiente de implementar' });
};

exports.createAppeal = async (req, res) => {
  return res.json({ message: 'createAppeal pendiente de implementar' });
};

exports.createSuspension = async (req, res) => {
  return res.json({ message: 'createSuspension pendiente de implementar' });
};
