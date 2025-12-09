/*  src/server.js 
require('dotenv').config();
const app = require('./app');
const db = require('./config/database'); // ← IMPORTACIÓN DIRECTA

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Probar conexión a la base de datos
    const conn = await db.pool.getConnection(); // ← db.pool en lugar de db
    console.log('✅ Conectado a la base de datos MySQL');
    conn.release(); // liberamos la conexión

    app.listen(PORT, () => {
      console.log(`Server escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar la app. Error:', err);
    process.exit(1);
  }
})();
*/

// NO UTILIZAR ESTE ARCHIVO, USAR EL SERVER.JS EN LA RAÍZ DEL PROYECTO