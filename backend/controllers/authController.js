import { guardarOtpPendienteDB, verificarOtpDB, buscarUsuarioPorIdentificadorDB } from '../models/usuarioModel.js';

export const registrarUsuario = async (req, res) => {
    try {
        const { 
            codigoEstudiantil, codigo_estudiantil, codigoAlumno, codigo_alumno, codigo,
            nombres, apellidos, nombreCompleto, nombre_completo,
            carrera, email, correo, correo_personal, 
            telefono, celular, password, contrasena, password_hash
        } = req.body;

        const finalCodigo = codigoEstudiantil || codigo_estudiantil || codigoAlumno || codigo_alumno || codigo;
        const finalEmail = correo_personal || correo || email;
        const finalTelefono = telefono || celular;
        const finalPassword = password || contrasena || password_hash;
        const finalNombre = nombre_completo || nombreCompleto || `${nombres || ''} ${apellidos || ''}`.trim();

        if (!finalCodigo || !finalEmail || !finalPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos obligatorios (código, correo personal o contraseña).' 
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await guardarOtpPendienteDB(finalTelefono, otp, {
            finalCodigo, finalEmail, finalNombre, finalPassword, carrera
        });

        res.status(200).json({ 
            success: true, 
            message: 'Código de verificación enviado a tu correo personal.' 
        });

        fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY || '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',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "PataRunner UTP", email: process.env.EMAIL_USER || "u23244283@utp.edu.pe" },
                to: [{ email: finalEmail, name: finalNombre }],
                subject: "Tu código de verificación de PataRunner 🏃‍♂️",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: auto;">
                        <h2 style="color: #4f46e5; text-align: center;">PataRunner</h2>
                        <p>Hola <strong>${finalNombre}</strong>,</p>
                        <p>Ingresa el siguiente código de 6 dígitos para verificar tu cuenta:</p>
                        <div style="font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 6px; padding: 15px 0; text-align: center; background-color: #f3f4f6; border-radius: 6px; margin: 15px 0;">
                            ${otp}
                        </div>
                        <p style="color: #666; font-size: 12px; text-align: center;">Este código expira en 10 minutos.</p>
                    </div>`
            })
        }).catch(err => console.error('Error enviando correo por Brevo:', err.message));

    } catch (error) {
        console.error('Error general en registro:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const verificarOtp = async (req, res) => {
    try {
        const { correo_personal, telefono, codigo } = req.body;
        if (!codigo) return res.status(400).json({ error: 'Ingresa el código OTP.' });

        const pendiente = await verificarOtpDB(correo_personal, telefono, codigo);
        if (!pendiente) return res.status(400).json({ error: 'Código incorrecto o expirado.' });

        return res.status(200).json({ success: true, message: 'Cuenta verificada correctamente.' });
    } catch (error) {
        console.error('Error al verificar OTP:', error);
        return res.status(500).json({ error: 'Error interno al validar el código.' });
    }
};

export const login = async (req, res) => {
    try {
        const { identificador, password } = req.body;
        if (!identificador) return res.status(400).json({ error: 'Ingresa tu código, correo personal o teléfono.' });

        const idLimpio = identificador.trim().toLowerCase();
        const usuario = await buscarUsuarioPorIdentificadorDB(idLimpio);

        if (!usuario) return res.status(404).json({ error: 'Usuario no registrado en PataRunner.' });
        if (usuario.is_blocked) return res.status(403).json({ error: 'Tu cuenta ha sido suspendida por un administrador.' });

        if (usuario.id_rol === 3 || idLimpio === 'admin01') {
            const ADMIN_PASSWORD_CORRECTA = '@dm1nPataRunner2026';
            if (!password || password !== ADMIN_PASSWORD_CORRECTA) {
                return res.status(401).json({ error: 'Contraseña de administrador incorrecta.' });
            }
        } else {
            if (!password || usuario.password_hash !== password) {
                return res.status(401).json({ error: 'Contraseña incorrecta.' });
            }
        }

        res.json({
            message: 'Acceso concedido',
            token: `token_patarunner_${usuario.id_usuario}`,
            usuario: {
                id_usuario: usuario.id_usuario,
                codigo_alumno: usuario.codigo_alumno,
                correo_personal: usuario.correo_personal,
                nombre_completo: usuario.nombre_completo,
                carrera: usuario.carrera,
                telefono: usuario.telefono,
                id_rol: usuario.id_rol,
                verificado: usuario.verificado,
                foto_perfil: usuario.foto_perfil
            }
        });
    } catch (error) {
        console.error("Error en POST /api/login:", error.message);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
};