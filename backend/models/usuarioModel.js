import pool from '../config/db.js';

export const guardarOtpPendienteDB = async (telefono, codigo, datosRegistro) => {
    const { finalCodigo, finalEmail, finalNombre, finalPassword, carrera } = datosRegistro;

    await pool.query(
        `INSERT INTO codigos_otp (telefono, codigo, expira_en) 
         VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
        [telefono || '000000000', codigo]
    );

    await pool.query(
        `INSERT INTO registros_pendientes 
        (codigo_alumno, correo_personal, nombre_completo, password_hash, carrera, token_verificacion, telefono, codigo_otp, expira_en) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '10 minutes')`,
        [finalCodigo, finalEmail, finalNombre, finalPassword, carrera || '', codigo, telefono || '', codigo]
    );
};

export const verificarOtpDB = async (correo_personal, telefono, codigo) => {
    const otpResult = await pool.query(
        `SELECT * FROM registros_pendientes 
         WHERE (correo_personal = $1 OR telefono = $2) 
           AND codigo_otp = $3 
           AND expira_en > NOW()`,
        [correo_personal, telefono, codigo]
    );

    if (otpResult.rows.length === 0) return null;

    const pendiente = otpResult.rows[0];

    await pool.query(
        `INSERT INTO usuarios (
            codigo_alumno, correo_personal, nombre_completo, carrera, telefono, firebase_uid, id_rol, verificado, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, 1, true, $7)
        ON CONFLICT (codigo_alumno) DO UPDATE 
        SET verificado = true,
            correo_personal = EXCLUDED.correo_personal,
            telefono = EXCLUDED.telefono,
            nombre_completo = EXCLUDED.nombre_completo,
            carrera = EXCLUDED.carrera,
            password_hash = EXCLUDED.password_hash`,
        [
            pendiente.codigo_alumno, 
            pendiente.correo_personal, 
            pendiente.nombre_completo, 
            pendiente.carrera, 
            pendiente.telefono, 
            pendiente.token_verificacion || null,
            pendiente.password_hash
        ]
    );

    await pool.query('DELETE FROM registros_pendientes WHERE id_pendiente = $1', [pendiente.id_pendiente]);
    return pendiente;
};

export const buscarUsuarioPorIdentificadorDB = async (identificador) => {
    const result = await pool.query(
        `SELECT id_usuario, codigo_alumno, correo_personal, nombre_completo, carrera, telefono, id_rol, is_blocked, verificado, foto_perfil, password_hash 
         FROM usuarios 
         WHERE LOWER(codigo_alumno) = $1 
            OR LOWER(correo_personal) = $1 
            OR telefono = $1`,
        [identificador]
    );
    return result.rows[0];
};