const { pool } = require("../config/database");

// Solicitudes pendientes
async function getSolicitudesPendientes(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, fecha, estado
      FROM solicitudes
      WHERE estado = 'pendiente'
    `);

    res.json(rows);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
}

// Expediente
async function getExpediente(req, res) {
  try {
    const { id } = req.params;

    const [[estudiante]] = await pool.query(
      `
      SELECT nombre, carrera, promedio, ingreso
      FROM estudiantes
      WHERE id = ?
      `,
      [id]
    );

    const [documentos] = await pool.query(
      `
      SELECT archivo
      FROM documentos
      WHERE estudiante_id = ?
      `,
      [id]
    );

    res.json({
      ...estudiante,
      documentos: documentos.map((d) => d.archivo),
    });
  } catch (error) {
    console.error("Error en getExpediente:", error);
    res.status(500).json({ message: "Error obteniendo expediente" });
  }
}

// Aprobar
async function aprobarSolicitud(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE solicitudes SET estado = 'aprobada' WHERE id = ?`,
      [id]
    );

    res.json({ message: "Solicitud aprobada" });
  } catch (error) {
    console.error("Error en aprobarSolicitud:", error);
    res.status(500).json({ message: "Error aprobando solicitud" });
  }
}

// Denegar
async function denegarSolicitud(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE solicitudes SET estado = 'denegada' WHERE id = ?`,
      [id]
    );

    res.json({ message: "Solicitud denegada" });
  } catch (error) {
    console.error("Error en denegarSolicitud:", error);
    res.status(500).json({ message: "Error denegando solicitud" });
  }
}

// Informe
async function generarInforme(req, res) {
  try {
    const [rows] = await pool.query(`SELECT * FROM solicitudes`);
    res.json(rows);
  } catch (error) {
    console.error("Error en generarInforme:", error);
    res.status(500).json({ message: "Error generando informe" });
  }
}

module.exports = {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme,
};
