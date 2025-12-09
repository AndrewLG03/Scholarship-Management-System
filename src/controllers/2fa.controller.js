const nodemailer = require("nodemailer");
const { pool } = require("../config/database");
const otpStore = require("../utils/otpStore");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTP = async (req, res) => {
  const userId = req.user.id_usuario || req.user.id;
  const email = req.user.correo;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.setOTP(userId, code);

  await transporter.sendMail({
    from: "Sistema de Becas",
    to: email,
    subject: "Código de verificación – 2FA",
    text: `Tu código de verificación es: ${code}`
  });

  res.json({ message: "Código enviado al correo." });
};

exports.enable2FA = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id_usuario || req.user.id;

  if (!otpStore.verifyOTP(userId, code)) {
    return res.status(400).json({ message: "Código incorrecto o expirado" });
  }

  await pool.query(
    "UPDATE usuarios SET twofactor_enabled = 1 WHERE id_usuario = ?",
    [userId]
  );

  res.json({ message: "Autenticación de dos factores activada." });
};