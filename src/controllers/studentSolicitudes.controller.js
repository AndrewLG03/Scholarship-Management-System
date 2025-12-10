// src/controllers/studentSolicitudes.controller.js
const { pool } = require('../config/database');

/**
 * GET /api/student/convocatorias
 * Devuelve las convocatorias (puedes filtrar por estado = 'Activa' si querés)
 */
exports.getConvocatorias = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_convocatoria,
        c.nombre,
        c.fecha_inicio,
        c.fecha_cierre,
        c.estado,
        p.anio,
        p.ciclo,
        CONCAT(p.anio, ' - ', p.ciclo) AS periodo
      FROM convocatorias c
      LEFT JOIN periodos p ON p.id_periodo = c.id_periodo
      ORDER BY c.fecha_inicio DESC
    `);

    return res.json(rows);
  } catch (err) {
    console.error("Error en getConvocatorias:", err);
    return res.status(500).json({ message: "Error obteniendo convocatorias" });
  }
};

/**
 * GET /api/student/tipos-beca
 * Devuelve TODOS los tipos de beca
 */
exports.getTiposBeca = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_tipo_beca,
        codigo,
        nombre,
        modalidad,
        tope_mensual
      FROM tipos_beca
      ORDER BY nombre
    `);

    return res.json(rows);
  } catch (err) {
    console.error("Error en getTiposBeca:", err);
    return res.status(500).json({ message: "Error obteniendo tipos de beca" });
  }
};

/**
 * POST /api/student/solicitud
 * body: { id_convocatoria, id_tipo_beca }
 */
exports.crearSolicitudBeca = async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();

    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // obtener id_estudiante real
    const [est] = await conn.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_usuario = ? LIMIT 1",
      [user.id]
    );

    if (est.length === 0) {
      return res.status(400).json({ message: "Estudiante no encontrado" });
    }

    const id_estudiante = est[0].id_estudiante;
    const { id_convocatoria, id_tipo_beca } = req.body;

    await conn.beginTransaction();

    // insertar solicitud
    const [result] = await conn.query(
      `
      INSERT INTO solicitudes
        (id_estudiante, id_convocatoria, id_tipo_beca, estado, creado)
      VALUES (?, ?, ?, 'BORRADOR', NOW())
    `,
      [id_estudiante, id_convocatoria, id_tipo_beca]
    );

    const id_solicitud = result.insertId;

    // insertar documentos requeridos
    await conn.query(
      `
      INSERT INTO solicitud_docs (id_solicitud, id_documento, url_archivo, valido)
      SELECT ?, d.id_documento, NULL, 'NO'
      FROM documentos d
    `,
      [id_solicitud]
    );

    await conn.commit();

    res.status(201).json({
      message: "Solicitud creada correctamente.",
      id_solicitud
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error crearSolicitudBeca:", err);
    res.status(500).json({ error: true, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * GET /api/student/solicitudes
 * Lista las solicitudes del estudiante logueado
 */
exports.getMisSolicitudes = async (req, res) => {
  const user = req.user;

  try {
    const [est] = await pool.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_usuario = ? LIMIT 1",
      [user.id]
    );

    if (est.length === 0) return res.json([]);

    const id_estudiante = est[0].id_estudiante;

    const [rows] = await pool.query(`
      SELECT
        s.id_solicitud,
        s.estado,
        s.creado AS fecha_creacion,
        c.nombre AS convocatoria,
        CONCAT(p.anio, ' - ', p.ciclo) AS convocatoria_periodo,
        tb.nombre AS tipo_beca,
        tb.modalidad AS tipo_modalidad
      FROM solicitudes s
      LEFT JOIN convocatorias c ON c.id_convocatoria = s.id_convocatoria
      LEFT JOIN periodos p ON p.id_periodo = c.id_periodo
      LEFT JOIN tipos_beca tb ON tb.id_tipo_beca = s.id_tipo_beca
      WHERE s.id_estudiante = ?
      ORDER BY s.creado DESC
    `, [id_estudiante]);

    return res.json(rows);

  } catch (err) {
    console.error("Error getMisSolicitudes:", err);
    return res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
};

/**
 * GET /api/student/solicitudes/:id/documentos
 * Devuelve la lista de documentos requeridos para una solicitud,
 * cruzando los documentos de la beca con los archivos subidos.
 */
exports.getDocumentosSolicitud = async (req, res) => {
  try {
    const id_solicitud = req.params.id;

    const [rows] = await pool.query(
      `
      SELECT 
        sd.id_solicitud_doc,
        d.id_documento,
        d.nombre AS nombre_documento,
        d.obligatorio,
        sd.url_archivo,
        sd.valido
      FROM solicitud_docs sd
      INNER JOIN documentos d ON d.id_documento = sd.id_documento
      WHERE sd.id_solicitud = ?
    `,
      [id_solicitud]
    );

    return res.json(rows);

  } catch (err) {
    console.error("Error en getDocumentosSolicitud:", err);
    return res.status(500).json({ message: "Error obteniendo documentos" });
  }
};

exports.subirDocumentoSolicitud = async (req, res) => {
  try {
    const id_solicitud_doc = req.params.id_solicitud_doc;

    if (!req.file) {
      return res.status(400).json({ message: "No se envió archivo" });
    }

    const buffer = req.file.buffer;       
    const nombre = req.file.originalname; 

    await pool.query(`
      UPDATE solicitud_docs
      SET archivo = ?, url_archivo = ?, valido = 'NO'
      WHERE id_solicitud_doc = ?
    `, [buffer, nombre, id_solicitud_doc]);

    return res.json({
      message: "Archivo guardado correctamente.",
      nombreArchivo: nombre
    });

  } catch (err) {
    console.error("Error subiendo documento:", err);
    return res.status(500).json({ message: "Error subiendo documento" });
  }
};

exports.enviarSolicitud = async (req, res) => {
  let conn;
  try {
    const id_solicitud = req.params.id;
    const user = req.user;

    conn = await pool.getConnection();

    // ===============================
    // VALIDACIÓN CRÍTICA (arregla 500)
    // ===============================
    const [est] = await conn.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_usuario = ? LIMIT 1",
      [user.id]
    );

    if (est.length === 0) {
      return res.status(400).json({ message: "Estudiante no encontrado" });
    }

    const id_estudiante = est[0].id_estudiante;

    // ===============================
    // Verificar solicitud
    // ===============================
    const [sol] = await conn.query(
      `SELECT estado FROM solicitudes
       WHERE id_solicitud = ? AND id_estudiante = ?`,
      [id_solicitud, id_estudiante]
    );

    if (sol.length === 0) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    if (sol[0].estado !== "BORRADOR") {
      return res.status(400).json({ message: "La solicitud ya fue enviada" });
    }

    // ===============================
    // Verificar documentos obligatorios
    // ===============================
    const [docs] = await conn.query(
      `
      SELECT d.nombre, d.obligatorio, sd.url_archivo
      FROM solicitud_docs sd
      JOIN documentos d ON d.id_documento = sd.id_documento
      WHERE sd.id_solicitud = ?
    `,
      [id_solicitud]
    );

    const faltantes = docs.filter(doc => {
      const ob = (doc.obligatorio || "").toString().trim().toUpperCase();
      return (ob === "SI" || ob === "SÍ") && !doc.url_archivo;
    });

    if (faltantes.length > 0) {
      return res.status(400).json({
        message: "Faltan documentos obligatorios",
        faltantes: faltantes.map(f => f.nombre)
      });
    }

    // ===============================
    // Enviar solicitud
    // ===============================
    await conn.query(
      `
      UPDATE solicitudes
      SET estado = 'ENVIADA'
      WHERE id_solicitud = ?
    `,
    [id_solicitud]);

    return res.json({ message: "Solicitud enviada correctamente." });

  } catch (err) {
    console.error("Error enviarSolicitud:", err);
    return res.status(500).json({ message: "Error enviando solicitud" });
  } finally {
    if (conn) conn.release();
  }
};

exports.descargarDocumento = async (req, res) => {
  try {
    const { id_solicitud_doc } = req.params;

    const [rows] = await pool.query(
      `SELECT archivo, url_archivo FROM solicitud_docs WHERE id_solicitud_doc = ?`,
      [id_solicitud_doc]
    );

    if (rows.length === 0 || !rows[0].archivo) {
      return res.status(404).send("Archivo no encontrado");
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${rows[0].url_archivo}"`
    );

    res.send(rows[0].archivo);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error descargando archivo");
  }
};