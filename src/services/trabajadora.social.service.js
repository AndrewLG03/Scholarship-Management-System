const db = require('../config/database');

// FIX PARA QUE FUNCIONE SIN ALTERAR ARCHIVOS DEL GRUPO
const query = (...args) => db.pool.query(...args);

/* =====================================================
   TIPOS DE BECA  (tabla: tipos_beca)
===================================================== */

exports.listTiposBeca = async () => {
  const [rows] = await query(
    `SELECT id_tipo_beca, codigo, nombre, modalidad, tope_mensual
     FROM tipos_beca
     ORDER BY nombre`
  );
  return rows;
};

exports.getTipoBeca = async (id) => {
  const [rows] = await query(
    `SELECT id_tipo_beca, codigo, nombre, modalidad, tope_mensual
     FROM tipos_beca
     WHERE id_tipo_beca = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createTipoBeca = async ({ codigo, nombre, modalidad, tope_mensual }) => {
  const [result] = await query(
    `INSERT INTO tipos_beca (codigo, nombre, modalidad, tope_mensual)
     VALUES (?, ?, ?, ?)`,
    [codigo, nombre, modalidad, tope_mensual]
  );
  return { id: result.insertId };
};

exports.updateTipoBeca = async (id, { codigo, nombre, modalidad, tope_mensual }) => {
  await query(
    `UPDATE tipos_beca
     SET codigo = ?, nombre = ?, modalidad = ?, tope_mensual = ?
     WHERE id_tipo_beca = ?`,
    [codigo, nombre, modalidad, tope_mensual, id]
  );
  return true;
};

exports.deleteTipoBeca = async (id) => {
  await query(
    `DELETE FROM tipos_beca WHERE id_tipo_beca = ?`,
    [id]
  );
  return true;
};

/* =====================================================
   SOLICITUDES (tabla: solicitudes)
===================================================== */

exports.listSolicitudes = async ({ estado, fecha } = {}) => {
  let sql = `
    SELECT *
    FROM solicitudes
    WHERE 1=1
  `;
  const params = [];

  if (estado) {
    sql += ' AND estado = ?';
    params.push(estado);
  }

  if (fecha) {
    sql += ' AND DATE(fecha_creacion) = ?';
    params.push(fecha);
  }

  sql += ' ORDER BY fecha_creacion DESC, id_solicitud DESC';

  const [rows] = await query(sql, params);
  return rows;
};

exports.getSolicitud = async (id) => {
  const [rows] = await query(
    `SELECT *
     FROM solicitudes
     WHERE id_solicitud = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.updateSolicitudEstado = async (id, { estado }) => {
  await query(
    `UPDATE solicitudes
     SET estado = ?
     WHERE id_solicitud = ?`,
    [estado, id]
  );
  return true;
};

/* =====================================================
   CONVOCATORIAS (tabla: convocatorias)
===================================================== */

exports.listConvocatorias = async () => {
  const [rows] = await query(
    `SELECT *
     FROM convocatorias
     ORDER BY fecha_inicio DESC`
  );
  return rows;
};

exports.updateConvocatoriaEstado = async (id, estado) => {
  await query(
    `UPDATE convocatorias
     SET estado = ?
     WHERE id_convocatoria = ?`,
    [estado, id]
  );
  return true;
};

/* =====================================================
   INFO SOCIOECONÓMICA (tabla: info_socioeconomica)
===================================================== */

exports.listCasosSocioeconomicos = async () => {
  const [rows] = await query(`
    SELECT *
    FROM info_socioeconomica
    ORDER BY id_info DESC
  `);
  return rows;
};

/* =====================================================
   EVALUACIONES ACADÉMICAS (tabla: evaluaciones)
===================================================== */

exports.listEvaluacionAcademica = async () => {
  const [rows] = await query(`
    SELECT *
    FROM evaluaciones
    ORDER BY fecha_eval DESC
  `);
  return rows;
};

/* =====================================================
   PERIODOS (tabla: periodos)
===================================================== */

exports.listPeriodos = async () => {
  const [rows] = await query(`
    SELECT id_periodo, anio, ciclo, fecha_ini, fecha_fin
    FROM periodos
    ORDER BY fecha_ini DESC, id_periodo DESC
  `);
  return rows;
};

exports.getPeriodo = async (id) => {
  const [rows] = await query(
    `SELECT id_periodo, anio, ciclo, fecha_ini, fecha_fin
     FROM periodos
     WHERE id_periodo = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.updatePeriodo = async (id, { anio, ciclo, fecha_ini, fecha_fin }) => {
  await query(
    `UPDATE periodos 
     SET anio = ?, ciclo = ?, fecha_ini = ?, fecha_fin = ?
     WHERE id_periodo = ?`,
    [anio, ciclo, fecha_ini, fecha_fin, id]
  );
  return true;
};
