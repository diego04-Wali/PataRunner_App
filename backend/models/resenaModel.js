import pool from '../config/db.js';

export const obtenerResenasDB = async () => {
    const query = `
        SELECT r.id_resena, r.calificacion, r.comentario, r.fecha_creacion,
               u.nombre_completo, u.codigo_alumno AS codigo, u.carrera
        FROM resenas_app r
        JOIN usuarios u ON r.id_usuario = u.id_usuario
        ORDER BY r.id_resena DESC`;
    const result = await pool.query(query);
    return result.rows;
};

export const crearResenaDB = async (id_usuario, calificacion, comentario) => {
    const query = `
        INSERT INTO resenas_app (id_usuario, calificacion, comentario) 
        VALUES ($1, $2, $3) 
        RETURNING id_resena, id_usuario, calificacion, comentario, fecha_creacion`;
    const result = await pool.query(query, [id_usuario, parseInt(calificacion), comentario]);
    return result.rows[0];
};