const multer = require("multer");

// Guarda el archivo en MEMORIA (no en disco)
const storage = multer.memoryStorage();

module.exports = multer({ storage });