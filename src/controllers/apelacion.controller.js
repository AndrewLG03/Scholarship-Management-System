const { pool } = require('../config/database');


/* ============================================================
   🔵 OBTENER TODAS LAS APELACIONES DE UN ASPIRANTE
   ============================================================ */
exports.obtenerApelaciones = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const idSolicitud = req.params.id; // FK id_solicitud

    const [rows] = await connection.query(
      `
      SELECT 
        id_apelacion,
        id_solicitud,
        motivo,
        estado,
        DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
        resolucion
      FROM apelaciones
      WHERE id_solicitud = ?
      ORDER BY fecha DESC
      `,
      [idSolicitud]
    );

    res.json({ ok: true, apelaciones: rows });

  } catch (err) {
    console.error("ERROR obtener apelaciones:", err);
    res.status(500).json({ ok: false, msg: "Error al obtener apelaciones." });
  } finally {
    connection.release();
  }
};


/* ============================================================
   🔵 CREAR UNA NUEVA APELACIÓN
   ============================================================ */
exports.crearApelacion = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const idSolicitud = req.params.id;
    const { motivo } = req.body;

    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        msg: "El motivo debe contener al menos 10 caracteres."
      });
    }

    await connection.query(
      `
      INSERT INTO apelaciones (id_solicitud, motivo, estado, fecha)
      VALUES (?, ?, 'PENDIENTE', NOW())
      `,
      [idSolicitud, motivo.trim()]
    );

    res.json({
      ok: true,
      msg: "Apelación enviada correctamente."
    });

  } catch (err) {
    console.error("ERROR crear apelación:", err);
    res.status(500).json({ ok: false, msg: "Error al crear la apelación." });
  } finally {
    connection.release();
  }
};
