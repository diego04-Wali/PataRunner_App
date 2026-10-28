import pool from '../config/db.js';

export const obtenerUsuariosAdminDB = async () => {
    const result = await pool.query(`
        SELECT id_usuario, codigo_alumno AS codigo, nombre_completo, carrera, id_rol, is_blocked, verificado 
        FROM usuarios 
        ORDER BY CASE WHEN id_rol = 3 THEN 0 ELSE 1 END, id_usuario ASC
    `);
    return result.rows;
};

export const cambiarBloqueoUsuarioDB = async (codigo, blocked) => {
    await pool.query(
        'UPDATE usuarios SET is_blocked = $1 WHERE codigo_alumno = $2',
        [blocked, codigo]
    );
};

export const cambiarRolRunnerDB = async (codigo, isRunner) => {
    const nuevoRol = isRunner ? 2 : 1;
    const bloqueadoRunner = !isRunner;

    await pool.query(
        `UPDATE usuarios 
         SET id_rol = $1, bloqueado_runner = $2 
         WHERE codigo_alumno = $3`,
        [nuevoRol, bloqueadoRunner, codigo]
    );
};

export const obtenerKpisAdminDB = async () => {
    const pedidosHoy = await pool.query(`
        SELECT 
            COUNT(*) AS total_hoy,
            COUNT(*) FILTER (WHERE estado = 'Entregado' OR estado = 'Finalizado') AS entregados_hoy,
            COUNT(*) FILTER (WHERE estado = 'Pendiente') AS pendientes_hoy,
            COUNT(*) FILTER (WHERE estado = 'En Camino') AS en_camino_hoy,
            COUNT(*) FILTER (WHERE estado = 'Cancelado') AS cancelados_hoy,
            COALESCE(SUM(tarifa_entrega) FILTER (WHERE estado = 'Entregado' OR estado = 'Finalizado'), 0) AS ganancias_runners_hoy
        FROM pedidos 
        WHERE DATE(fecha_pedido) = CURRENT_DATE
    `);

    const usuariosTotales = await pool.query(`
        SELECT 
            COUNT(*) FILTER (WHERE id_rol = 1) AS total_alumnos,
            COUNT(*) FILTER (WHERE id_rol = 2) AS total_runners
        FROM usuarios
    `);

    return {
        pedidos: pedidosHoy.rows[0],
        usuarios: usuariosTotales.rows[0],
        topTienda: 'Frago Gourmet'
    };
};