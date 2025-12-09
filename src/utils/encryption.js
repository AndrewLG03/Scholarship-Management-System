const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Para datos sensibles como cédula y correo
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'tu-clave-secreta-muy-segura-cambiar-en-produccion';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encriptar datos sensibles (cédula, correo, teléfono)
 * @param {string} text - Texto a encriptar
 * @returns {string} Texto encriptado en formato: iv:encryptedData
 */
exports.encryptData = (text) => {
  try {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Error encriptando datos:', err);
    throw err;
  }
};

/**
 * Desencriptar datos sensibles
 * @param {string} encryptedText - Texto encriptado en formato: iv:encryptedData
 * @returns {string} Texto desencriptado
 */
exports.decryptData = (encryptedText) => {
  try {
    if (!encryptedText) return null;
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Error desencriptando datos:', err);
    throw err;
  }
};

/**
 * Hashear contraseñas (bcrypt)
 * @param {string} password - Contraseña a hashear
 * @returns {Promise<string>} Hash de la contraseña
 */
exports.hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.error('Error hasheando contraseña:', err);
    throw err;
  }
};

/**
 * Comparar contraseña con hash
 * @param {string} password - Contraseña ingresada
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>}
 */
exports.comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error('Error comparando contraseña:', err);
    throw err;
  }
};
