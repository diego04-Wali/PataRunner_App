import pg from 'pg';
import dotenv from 'dotenv';

// Cargar las variables del archivo .env
dotenv.config();

const { Pool } = pg;

// Configurar la conexión usando las credenciales ocultas
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Probar la conexión
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error al conectar con PostgreSQL ❌', err.stack);
    }
    console.log('Conexión exitosa a la base de datos PostgreSQL 🐘');
    release();
});

export default pool;