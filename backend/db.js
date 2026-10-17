import pg from 'pg';
import dotenv from 'dotenv';

// Cargar las variables del archivo .env
dotenv.config();

const { Pool } = pg;

// Configurar la conexión usando la Connection String de Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Exigido por Neon para conexiones seguras en la nube
  }
});

// Probar la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar con la BD de Neon en la nube ❌', err.stack);
  }
  console.log('¡Conexión exitosa a la base de datos de Neon en la nube! 🚀');
  release();
});

export default pool;