import express from 'express';
import cors from 'cors';
import pool from './db.js';
import cron from 'node-cron';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// CONFIGURACIÓN FIREBASE ADMIN SDK
// ==========================================
let serviceAccount = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim() !== '') {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
    } else if (fs.existsSync('./firebase-service-account.json')) {
        const fileData = fs.readFileSync('./firebase-service-account.json', 'utf8').trim();
        if (fileData) {
            serviceAccount = JSON.parse(fileData);
        }
    }
} catch (error) {
    console.warn("⚠️ Credenciales de Firebase omitidas (autenticación local activada).");
}

if (serviceAccount && getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin inicializado.");
}

// Middleware opcional de verificación de token
const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado o formato inválido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        req.user = decodedToken;
        req.usuarioFirebase = decodedToken;
        next();
    } catch (error) {
        req.user = { uid: token };
        next();
    }
};

const verificarAdmin = async (req, res, next) => {
    try {
        const identificador = req.user.uid || req.user.user_id;
        const result = await pool.query(
            'SELECT id_rol FROM usuarios WHERE firebase_uid = $1 OR codigo_alumno = $2 OR correo_personal = $3',
            [identificador, identificador, identificador]
        );

        if (result.rows.length === 0 || result.rows[0].id_rol !== 3) {
            return res.status(403).json({ error: 'Acceso denegado: Se requieren privilegios de administrador.' });
        }

        next();
    } catch (error) {
        console.error("Error al verificar rol de administrador:", error);
        return res.status(500).json({ error: 'Error interno al validar permisos.' });
    }
};

// Ruta de prueba base
app.get('/', (req, res) => {
    res.send('Servidor de PataRunner (Firebase & Email Ready) funcionando correctamente 🚀');
});

// ==========================================
// RUTA DE REGISTRO CON ENVÍO OTP
// ==========================================
app.post(['/usuarios/registro', '/api/usuarios/registro'], async (req, res) => {
    try {
        console.log('BODY RECIBIDO:', req.body);

        const { 
            codigoEstudiantil, codigo_estudiantil, codigoAlumno, codigo_alumno, codigo,
            nombres, apellidos, nombreCompleto, nombre_completo,
            carrera, 
            email, correo, correo_personal, 
            telefono, celular,
            password, contrasena, password_hash
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

        // 1. Generar OTP de 6 dígitos
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Guardar OTP y registro pendiente en Neon DB
        await pool.query(
            `INSERT INTO codigos_otp (telefono, codigo, expira_en) 
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
            [finalTelefono || '000000000', otp]
        );

        await pool.query(
            `INSERT INTO registros_pendientes 
            (codigo_alumno, correo_personal, nombre_completo, password_hash, carrera, token_verificacion, telefono, codigo_otp, expira_en) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '10 minutes')`,
            [finalCodigo, finalEmail, finalNombre, finalPassword, carrera || '', otp, finalTelefono || '', otp]
        );

        // 3. Responder de inmediato al cliente
        res.status(200).json({ 
            success: true, 
            message: 'Código de verificación enviado a tu correo personal.' 
        });

        // 4. Enviar correo OTP vía API HTTP con Brevo (fetch nativo en puerto 443)
        fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY || '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',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "PataRunner UTP", email: "terronesdiego04@gmail.com" },
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
                    </div>
                `
            })
        })
        .then(async response => {
            const result = await response.json();
            if (response.ok) {
                console.log(`✅ OTP enviado exitosamente por Brevo a ${finalEmail}:`, result);
            } else {
                console.error('❌ Error devuelto por la API de Brevo:', result);
            }
        })
        .catch(err => console.error('❌ Error enviando correo por Brevo:', err.message));

    } catch (error) {
        console.error('❌ Error general en /usuarios/registro:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// RUTA DE VERIFICACIÓN DE OTP POR CORREO
// ==========================================
app.post('/api/usuarios/verificar-otp', async (req, res) => {
    try {
        const { correo_personal, telefono, codigo } = req.body;

        if (!codigo) {
            return res.status(400).json({ error: 'Ingresa el código OTP.' });
        }

        // 1. Buscar OTP activo en registros_pendientes
        const otpResult = await pool.query(
            `SELECT * FROM registros_pendientes 
             WHERE (correo_personal = $1 OR telefono = $2) 
               AND codigo_otp = $3 
               AND expira_en > NOW()`,
            [correo_personal, telefono, codigo]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ error: 'Código incorrecto o expirado.' });
        }

        const pendiente = otpResult.rows[0];

        // 2. Mover registro a la tabla usuarios (usando solo las columnas existentes)
       // 2. Mover registro a la tabla usuarios (asegurando correo personal y teléfono)
        await pool.query(
            `INSERT INTO usuarios (
                codigo_alumno, 
                correo_personal, 
                nombre_completo, 
                carrera, 
                telefono, 
                firebase_uid, 
                id_rol, 
                verificado
            ) VALUES ($1, $2, $3, $4, $5, $6, 1, true)
            ON CONFLICT (codigo_alumno) DO UPDATE 
            SET verificado = true,
                correo_personal = EXCLUDED.correo_personal,
                telefono = EXCLUDED.telefono,
                nombre_completo = EXCLUDED.nombre_completo,
                carrera = EXCLUDED.carrera`,
            [
                pendiente.codigo_alumno, 
                pendiente.correo_personal, 
                pendiente.nombre_completo, 
                pendiente.carrera, 
                pendiente.telefono, 
                pendiente.token_verificacion || null
            ]
        );

        // 3. Limpiar el registro pendiente usando "id_pendiente"
        await pool.query('DELETE FROM registros_pendientes WHERE id_pendiente = $1', [pendiente.id_pendiente]);

        return res.status(200).json({ success: true, message: 'Cuenta verificada correctamente.' });

    } catch (error) {
        console.error('Error al verificar OTP:', error);
        return res.status(500).json({ error: 'Error interno al validar el código.' });
    }
});
// ==========================================
// RUTA: ACTIVAR MODO RUNNER
// ==========================================
app.put('/api/usuarios/activar-runner', verificarToken, async (req, res) => {
    try {
        const identificador = req.user?.uid || req.user?.user_id;

        const result = await pool.query(
            `UPDATE usuarios 
             SET id_rol = 2 
             WHERE firebase_uid = $1 OR codigo_alumno = $2 OR correo_personal = $3
             RETURNING id_usuario, id_rol`,
            [identificador, identificador, identificador]
        );

        res.status(200).json({ 
            success: true, 
            message: '¡Ahora eres un Runner oficial!' 
        });
    } catch (error) {
        console.error('Error al activar rol de runner:', error);
        res.status(500).json({ error: 'No se pudo actualizar el perfil en el servidor.' });
    }
});

// ==========================================
// RUTA: VERIFICAR ESTADO DEL USUARIO (ROL Y BLOQUEOS)
// ==========================================
app.get('/api/usuarios/estado/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id_usuario, id_rol, is_blocked, bloqueado_runner FROM usuarios WHERE id_usuario = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = result.rows[0];
        res.status(200).json({
            id_usuario: user.id_usuario,
            id_rol: user.id_rol,
            blocked: user.is_blocked || false,
            bloqueado_runner: user.bloqueado_runner || false
        });
    } catch (error) {
        console.error('Error al consultar estado de usuario:', error);
        res.status(500).json({ error: 'Error del servidor al consultar estado.' });
    }
});

// ==========================================
// RUTA DE INICIO DE SESIÓN (PERSISTENCIA DE FOTO)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { identificador, password } = req.body;

        if (!identificador) {
            return res.status(400).json({ error: 'Ingresa tu código, correo personal o teléfono.' });
        }

        const idLimpio = identificador.trim().toLowerCase();

        // 1. Buscar al usuario en la base de datos (incluyendo foto_perfil)
        const result = await pool.query(
            `SELECT id_usuario, codigo_alumno, correo_personal, nombre_completo, carrera, telefono, id_rol, is_blocked, verificado, foto_perfil 
             FROM usuarios 
             WHERE LOWER(codigo_alumno) = $1 
                OR LOWER(correo_personal) = $1 
                OR telefono = $1`,
            [idLimpio]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no registrado en PataRunner.' });
        }

        const usuario = result.rows[0];

        if (usuario.is_blocked) {
            return res.status(403).json({ error: 'Tu cuenta ha sido suspendida preventivamente.' });
        }

        // 2. Validación de contraseña para Administrador
        if (usuario.id_rol === 3 || idLimpio === 'admin01') {
            const ADMIN_PASSWORD_CORRECTA = '@dm1nPataRunner2026';

            if (!password || password !== ADMIN_PASSWORD_CORRECTA) {
                return res.status(401).json({ error: 'Contraseña de administrador incorrecta.' });
            }
        }

        // 3. Respuesta exitosa con datos de sesión completos
        res.json({
            message: 'Acceso concedido',
            token: `token_patarunner_${usuario.id_usuario}`,
            usuario: usuario
        });

    } catch (error) {
        console.error("Error en POST /api/login:", error.message);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
});

// --- RUTA: Obtener productos del catálogo ---
app.get('/api/productos', async (req, res) => {
    try {
        const todosLosProductos = await pool.query(`
            SELECT p.*, t.nombre AS nombre_tienda, t.ubicacion AS ubicacion_tienda
            FROM productos p
            LEFT JOIN tiendas t ON p.id_tienda = t.id_tienda
            WHERE p.disponible = true 
            ORDER BY p.id_producto ASC
        `);
        res.status(200).json(todosLosProductos.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al obtener los productos.' });
    }
});

// --- RUTA: Historial de pedidos cliente ---
app.get('/api/pedidos/historial/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const query = `
            SELECT 
                p.id_pedido, p.estado, p.ubicacion_entrega, p.fecha_pedido, 
                p.id_runner, p.calificacion,
                u.nombre_completo AS runner_nombre,
                COALESCE(STRING_AGG(pr.nombre, ', '), p.descripcion_pedido) AS productos_resumen
            FROM pedidos p
            LEFT JOIN usuarios u ON p.id_runner = u.id_usuario
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE p.id_cliente = $1
              AND p.estado IN ('Finalizado', 'Entregado', 'Cancelado')
              AND p.fecha_pedido >= CURRENT_DATE - INTERVAL '5 days'
            GROUP BY p.id_pedido, p.estado, p.ubicacion_entrega, p.fecha_pedido, p.id_runner, p.calificacion, u.nombre_completo, p.descripcion_pedido
            ORDER BY p.fecha_pedido DESC
        `;
        const result = await pool.query(query, [id_usuario]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al cargar el historial" });
    }
});

// --- RUTA: Registrar un Pedido completo (Soporte para "Otro" / Favor personalizado) ---
app.post('/api/pedidos', async (req, res) => {
  const { 
    id_cliente,
    direccion_entrega, 
    ubicacion_entrega, 
    tarifa_entrega, 
    metodo_pago, 
    descripcion_pedido, 
    costo_aproximado, 
    total, 
    carrito 
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ubicacionFinal = ubicacion_entrega || direccion_entrega || 'No especificada';
    const tarifaFinal = tarifa_entrega || 0;
    const metodoPagoFinal = metodo_pago || 'Efectivo';
    const costoAproxFinal = costo_aproximado || total || 0;

    const resPedido = await client.query(
      `INSERT INTO pedidos (
        id_cliente, 
        ubicacion_entrega, 
        tarifa_entrega, 
        metodo_pago, 
        descripcion_pedido, 
        costo_aproximado, 
        estado, 
        fecha_pedido
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Pendiente', NOW()) 
      RETURNING id_pedido`,
      [id_cliente, ubicacionFinal, tarifaFinal, metodoPagoFinal, descripcion_pedido || null, costoAproxFinal]
    );
    
    const idPedido = resPedido.rows[0].id_pedido;

    if (carrito && Array.isArray(carrito)) {
      for (const item of carrito) {
        const precioUnitario = item.precio_unitario || item.precio || 0;
        const subtotal = item.subtotal || (precioUnitario * item.cantidad);

        // Si id_producto es numérico válido se guarda en detalle_pedido
        const isNumericId = !isNaN(parseInt(item.id_producto)) && isFinite(item.id_producto);

        if (isNumericId) {
          await client.query(
            `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) 
             VALUES ($1, $2, $3, $4, $5)`,
            [idPedido, parseInt(item.id_producto), item.cantidad, precioUnitario, subtotal]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ok: true, id_pedido: idPedido, mensaje: 'Pedido registrado exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar el pedido:', error.message);
    res.status(500).json({ error: 'Error al registrar el pedido: ' + error.message });
  } finally {
    client.release();
  }
});

// --- RUTA: Actualizar estado de un Pedido (Aceptar o Entregar) ---
app.put('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params; 
        const { id_runner, estado } = req.body; 

        await pool.query(
            "UPDATE pedidos SET id_runner = $1, estado = $2 WHERE id_pedido = $3",
            [id_runner, estado, id]
        );
        
        const pedidoConRunner = await pool.query(`
            SELECT p.*, u.nombre_completo AS nombre_runner, u.telefono AS telefono_runner
            FROM pedidos p
            LEFT JOIN usuarios u ON p.id_runner = u.id_usuario
            WHERE p.id_pedido = $1
        `, [id]);
        
        res.status(200).json({
            mensaje: '¡Estado del pedido actualizado exitosamente!',
            pedido: pedidoConRunner.rows[0]
        });
    } catch (error) {
        console.error("Error al actualizar pedido:", error.message);
        res.status(500).json({ error: 'Error al actualizar el pedido.' });
    }
});

// --- RUTA: Directorio de Tiendas ---
app.get('/api/tiendas', async (req, res) => {
    try {
        const directorioTiendas = await pool.query('SELECT nombre, ubicacion FROM tiendas ORDER BY nombre ASC');
        res.status(200).json(directorioTiendas.rows);
    } catch (error) {
        console.error("Error al obtener las tiendas:", error.message);
        res.status(500).json({ error: 'Error al obtener el directorio de tiendas.' });
    }
});

// --- RUTA: Obtener pedidos Pendientes ---
app.get('/api/pedidos', async (req, res) => {
    try {
        const pedidosPendientes = await pool.query(`
            SELECT 
                p.*,
                u.nombre_completo AS alumno_nombre,
                u.foto_perfil AS alumno_foto,
                MAX(t.nombre) as tienda, 
                COALESCE(
                    json_agg(
                        json_build_object(
                            'nombre_producto', pr.nombre,
                            'cantidad', dp.cantidad,
                            'subtotal', dp.subtotal,
                            'tienda', t.nombre
                        )
                    ) FILTER (WHERE pr.nombre IS NOT NULL), 
                    '[]'
                ) as productos
            FROM pedidos p
            LEFT JOIN usuarios u ON p.id_cliente = u.id_usuario
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            LEFT JOIN tiendas t ON pr.id_tienda = t.id_tienda
            WHERE p.estado = 'Pendiente'
            GROUP BY p.id_pedido, u.nombre_completo, u.foto_perfil
            ORDER BY p.id_pedido DESC
        `);

        res.status(200).json(pedidosPendientes.rows);
    } catch (error) {
        console.error("Error al obtener los pedidos:", error.message);
        res.status(500).json({ error: 'Error al obtener los pedidos.' });
    }
});

// --- RUTA: Obtener pedidos de un Alumno específico ---
app.get('/api/pedidos/cliente/:id_cliente', async (req, res) => {
    try {
        const { id_cliente } = req.params;
        const misPedidos = await pool.query(`
            SELECT p.*, 
                   u.nombre_completo AS nombre_runner,
                   u.foto_perfil AS runner_foto
            FROM pedidos p
            LEFT JOIN usuarios u ON p.id_runner = u.id_usuario
            WHERE p.id_cliente = $1
            ORDER BY p.id_pedido DESC
        `, [id_cliente]);
        
        res.status(200).json(misPedidos.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al obtener los pedidos del cliente.' });
    }
});

// --- RUTA: Obtener entregas en curso de un Runner ---
app.get('/api/pedidos/runner/:id_runner', async (req, res) => {
    try {
        const { id_runner } = req.params;
        const entregas = await pool.query(`
            SELECT p.*, 
                   u.nombre_completo AS nombre_cliente,
                   u.foto_perfil AS alumno_foto
            FROM pedidos p
            JOIN usuarios u ON p.id_cliente = u.id_usuario
            WHERE p.id_runner = $1 AND p.estado = 'En Camino'
            ORDER BY p.id_pedido DESC
        `, [id_runner]);
        
        res.status(200).json(entregas.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al obtener las entregas.' });
    }
});

// --- RUTA: Enviar un mensaje al chat ---
app.post('/api/chat', async (req, res) => {
    try {
        const { id_pedido, id_remitente, id_rol, mensaje } = req.body;
        
        const nuevoMensaje = await pool.query(
            "INSERT INTO chat_pedido (id_pedido, id_remitente, id_rol, mensaje) VALUES ($1, $2, $3, $4) RETURNING *",
            [id_pedido, id_remitente, id_rol, mensaje]
        );
        
        res.status(201).json({ exito: true, chat: nuevoMensaje.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al enviar el mensaje.' });
    }
});

// --- RUTA: Obtener los mensajes del chat ---
app.get('/api/chat/:id_pedido', async (req, res) => {
    try {
        const { id_pedido } = req.params;
        const historialChat = await pool.query(`
            SELECT c.*, u.nombre_completo AS nombre_remitente
            FROM chat_pedido c
            JOIN usuarios u ON c.id_remitente = u.id_usuario
            WHERE c.id_pedido = $1
            ORDER BY c.fecha_envio ASC
        `, [id_pedido]);
        
        res.status(200).json(historialChat.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al obtener el chat.' });
    }
});

// --- RUTA: Calificar a un Runner ---
app.put('/api/pedidos/:id/calificar', async (req, res) => {
    const { id } = req.params;
    const { calificacion, id_runner } = req.body;

    try {
        await pool.query('UPDATE pedidos SET calificacion = $1 WHERE id_pedido = $2', [calificacion, id]);

        const resultPromedio = await pool.query(
            'SELECT AVG(calificacion) as promedio FROM pedidos WHERE id_runner = $1 AND calificacion IS NOT NULL',
            [id_runner]
        );
        
        const nuevoPromedio = parseFloat(resultPromedio.rows[0].promedio).toFixed(2);

        await pool.query('UPDATE usuarios SET calificacion_runner = $1 WHERE id_usuario = $2', [nuevoPromedio, id_runner]);

        res.status(200).json({ success: true, mensaje: '¡Calificación enviada!', nuevoPromedio });
    } catch (error) {
        console.error("Error al calificar:", error);
        res.status(500).json({ error: 'Error interno del servidor al calificar.' });
    }
});

// --- RUTA: Crear un Reporte / Incidencia (Cliente Ausente) ---
app.post('/api/reportes', async (req, res) => {
    const { id_pedido, id_usuario, motivo } = req.body;
    try {
        const nuevoReporte = await pool.query(
            'INSERT INTO reportes (id_pedido, id_usuario_reporta, motivo) VALUES ($1, $2, $3) RETURNING *',
            [id_pedido || null, id_usuario, motivo]
        );

        if (motivo && motivo.toLowerCase().includes('ausente') && id_pedido) {
            await pool.query(
                `UPDATE usuarios 
                 SET is_blocked = true 
                 WHERE id_usuario = (SELECT id_cliente FROM pedidos WHERE id_pedido = $1)`,
                [id_pedido]
            );
        }

        res.status(201).json({ success: true, mensaje: 'Reporte enviado con éxito', reporte: nuevoReporte.rows[0] });
    } catch (error) {
        console.error("Error al registrar reporte:", error);
        res.status(500).json({ success: false, error: 'Error al enviar el reporte' });
    }
});

// --- TAREA PROGRAMADA: Limpieza de registros y OTPs expirados cada hora ---
cron.schedule('0 * * * *', async () => {
    try {
        const resOTP = await pool.query('DELETE FROM codigos_otp WHERE expira_en < NOW()');
        const resReg = await pool.query("DELETE FROM registros_pendientes WHERE expira_en < NOW() - INTERVAL '24 hours'");
        
        if (resOTP.rowCount > 0 || resReg.rowCount > 0) {
            console.log(`🧹 Limpieza automática: ${resOTP.rowCount} OTPs y ${resReg.rowCount} registros expirados eliminados.`);
        }
    } catch (error) {
        console.error("Error en limpieza automática:", error);
    }
});

// ==========================================
// RUTAS DEL PANEL DE ADMINISTRACIÓN
// ==========================================

// 1. Obtener lista completa de usuarios
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id_usuario, codigo_alumno AS codigo, nombre_completo, carrera, id_rol, is_blocked, verificado 
            FROM usuarios 
            ORDER BY id_usuario DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error en GET /api/admin/usuarios:", error.message);
        res.status(500).json({ error: 'Error al obtener la lista de usuarios.' });
    }
});

// 2. Bloquear / Desbloquear cuenta de usuario
app.patch('/api/admin/usuarios/:codigo/bloquear', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { blocked } = req.body;

        await pool.query(
            'UPDATE usuarios SET is_blocked = $1 WHERE codigo_alumno = $2',
            [blocked, codigo]
        );

        res.status(200).json({ 
            success: true, 
            message: `Usuario ${blocked ? 'bloqueado' : 'desbloqueado'} con éxito.` 
        });
    } catch (error) {
        console.error("Error al cambiar estado de bloqueo:", error.message);
        res.status(500).json({ error: 'No se pudo actualizar el estado de bloqueo.' });
    }
});

// 3. Asignar o quitar el rol de Runner
app.patch('/api/admin/usuarios/:codigo/runner', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { isRunner } = req.body;
        const nuevoRol = isRunner ? 2 : 1;

        await pool.query(
            'UPDATE usuarios SET id_rol = $1 WHERE codigo_alumno = $2',
            [nuevoRol, codigo]
        );

        res.status(200).json({ 
            success: true, 
            message: `Rol actualizado a ${isRunner ? 'Runner' : 'Alumno'}.` 
        });
    } catch (error) {
        console.error("Error al actualizar rol de runner:", error.message);
        res.status(500).json({ error: 'No se pudo actualizar el rol.' });
    }
});

// 4. Eliminar un usuario permanentemente
app.delete('/api/admin/usuarios/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;

        await pool.query('DELETE FROM usuarios WHERE codigo_alumno = $1', [codigo]);

        res.status(200).json({ 
            success: true, 
            message: `Usuario ${codigo} eliminado de la base de datos.` 
        });
    } catch (error) {
        console.error("Error al eliminar usuario:", error.message);
        res.status(500).json({ error: 'No se pudo eliminar el usuario.' });
    }
});

// ==========================================
// MÓDULO ADMIN: MONITOREO DE OPERACIONES
// ==========================================
app.get('/api/admin/pedidos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.id_pedido,
                p.estado,
                p.ubicacion_entrega,
                p.tarifa_entrega,
                p.descripcion_pedido,
                p.costo_aproximado,
                p.fecha_pedido,
                u1.nombre_completo AS nombre_cliente,
                u2.nombre_completo AS nombre_runner,
                COALESCE(SUM(dp.subtotal), 0) AS total_catalogo
            FROM pedidos p
            LEFT JOIN usuarios u1 ON p.id_cliente = u1.id_usuario
            LEFT JOIN usuarios u2 ON p.id_runner = u2.id_usuario
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            GROUP BY p.id_pedido, u1.nombre_completo, u2.nombre_completo
            ORDER BY p.id_pedido DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error en GET /api/admin/pedidos:", error.message);
        res.status(500).json({ error: 'Error al consultar operaciones.' });
    }
});

// ==========================================
// MÓDULO ADMIN: GESTIÓN DE REPORTES
// ==========================================
app.get('/api/admin/reportes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id_reporte,
                r.id_pedido,
                r.motivo,
                r.estado,
                r.fecha_creacion,
                u.codigo_alumno AS codigo_reportador,
                u.nombre_completo AS reportador
            FROM reportes r
            LEFT JOIN usuarios u ON r.id_usuario_reporta = u.id_usuario
            ORDER BY r.id_reporte DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error en GET /api/admin/reportes:", error.message);
        res.status(500).json({ error: 'Error al obtener reportes.' });
    }
});

app.patch('/api/admin/reportes/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        await pool.query(
            'UPDATE reportes SET estado = $1 WHERE id_reporte = $2',
            [estado, id]
        );

        res.status(200).json({ success: true, message: `Reporte #${id} actualizado a ${estado}.` });
    } catch (error) {
        console.error("Error al actualizar estado del reporte:", error.message);
        res.status(500).json({ error: 'No se pudo actualizar el reporte.' });
    }
});

// ==========================================
// MÓDULO ADMIN: KPIS Y ESTADÍSTICAS
// ==========================================
app.get('/api/admin/kpis', async (req, res) => {
    try {
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

        res.status(200).json({
            pedidos: pedidosHoy.rows[0],
            usuarios: usuariosTotales.rows[0],
            topTienda: 'Frago Gourmet'
        });
    } catch (error) {
        console.error("Error en GET /api/admin/kpis:", error.message);
        res.status(500).json({ error: 'Error al consultar métricas.' });
    }
});

// ==========================================
// MÓDULO ADMIN: TIENDAS Y CATÁLOGO
// ==========================================
app.get('/api/admin/tiendas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tiendas ORDER BY id_tienda ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error en GET /api/admin/tiendas:", error.message);
        res.status(500).json({ error: 'Error al consultar tiendas.' });
    }
});

app.post('/api/admin/tiendas', async (req, res) => {
    try {
        const { nombre, ubicacion } = req.body;
        await pool.query('INSERT INTO tiendas (nombre, ubicacion) VALUES ($1, $2)', [nombre, ubicacion]);
        res.status(201).json({ success: true, message: 'Tienda registrada con éxito.' });
    } catch (error) {
        console.error("Error en POST /api/admin/tiendas:", error.message);
        res.status(500).json({ error: 'Error al guardar la tienda.' });
    }
});

app.post('/api/admin/productos', async (req, res) => {
    try {
        const { id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock } = req.body;
        await pool.query(
            `INSERT INTO productos (id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock, disponible) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [id_tienda, nombre, precio, categoria || 'Snacks', subcategoria || 'General', descripcion || '', imagen || 'placeholder.jpg', stock || 10]
        );
        res.status(201).json({ success: true, message: 'Producto agregado al catálogo.' });
    } catch (error) {
        console.error("Error en POST /api/admin/productos:", error.message);
        res.status(500).json({ error: 'Error al guardar el producto.' });
    }
});

app.patch('/api/admin/productos/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        await pool.query('UPDATE productos SET stock = $1 WHERE id_producto = $2', [stock, id]);
        res.status(200).json({ success: true, message: 'Stock actualizado correctamente.' });
    } catch (error) {
        console.error("Error al actualizar stock:", error.message);
        res.status(500).json({ error: 'Error al actualizar el stock.' });
    }
});

app.delete('/api/admin/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM productos WHERE id_producto = $1', [id]);
        res.status(200).json({ success: true, message: 'Producto eliminado.' });
    } catch (error) {
        console.error("Error al eliminar producto:", error.message);
        res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
});

// ==========================================
// MÓDULO ADMIN: RESEÑAS DE LA APLICACIÓN
// ==========================================
app.get('/api/admin/resenas-app', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id_resena,
                r.calificacion,
                r.comentario,
                r.fecha_creacion,
                u.nombre_completo,
                u.codigo_alumno AS codigo,
                u.carrera
            FROM resenas_app r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            ORDER BY r.id_resena DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error en GET /api/admin/resenas-app:", error.message);
        res.status(500).json({ error: 'Error al obtener las reseñas.' });
    }
});

// ==========================================
// ACTUALIZAR PERFIL DE USUARIO (FALLBACK DE ID)
// ==========================================
app.put('/api/usuarios/perfil', async (req, res) => {
    try {
        let id_usuario = null;

        // 1. Intentar obtener el ID desde el Header Authorization
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'undefined' && token !== 'null') {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_patarunner');
                    id_usuario = decoded.id_usuario || decoded.id || decoded.idUsuario;
                } catch (e) {
                    try {
                        const decodedPayload = jwt.decode(token);
                        if (decodedPayload) {
                            id_usuario = decodedPayload.id_usuario || decodedPayload.id || decodedPayload.idUsuario;
                        }
                    } catch (err) {}
                }
            }
        }

        // 2. Fallback: Si el token falló o no vino, tomar id_usuario enviado en el body
        if (!id_usuario && req.body.id_usuario) {
            id_usuario = req.body.id_usuario;
        }

        if (!id_usuario) {
            return res.status(401).json({ error: 'Sesión no válida o usuario no identificado.' });
        }

        const nombre = req.body.nombre_completo || req.body.nombre;
        const carrera = req.body.carrera;

        if (!nombre || !carrera) {
            return res.status(400).json({ error: 'El nombre y la carrera son obligatorios.' });
        }

        const result = await pool.query(
            `UPDATE usuarios 
             SET nombre_completo = $1, carrera = $2 
             WHERE id_usuario = $3 
             RETURNING id_usuario, nombre_completo, carrera, codigo_alumno`,
            [nombre, carrera, id_usuario]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
        }

        res.status(200).json({
            mensaje: 'Perfil actualizado correctamente.',
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error("Error en PUT /api/usuarios/perfil:", error);
        res.status(500).json({ error: 'Error interno al actualizar el perfil.' });
    }
});

// ==========================================
// REGISTRAR RESEÑA DE LA APLICACIÓN
// ==========================================
app.post('/api/resenas-app', async (req, res) => {
    try {
        let id_usuario = null;

        // Extract ID from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'undefined' && token !== 'null') {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_patarunner');
                    id_usuario = decoded.id_usuario || decoded.id || decoded.idUsuario;
                } catch (e) {
                    try {
                        const decodedPayload = jwt.decode(token);
                        if (decodedPayload) {
                            id_usuario = decodedPayload.id_usuario || decodedPayload.id || decodedPayload.idUsuario;
                        }
                    } catch (err) {}
                }
            }
        }

        // Fallback to body
        if (!id_usuario && req.body.id_usuario) {
            id_usuario = req.body.id_usuario;
        }

        if (!id_usuario) {
            return res.status(401).json({ error: 'Debes iniciar sesión para enviar una reseña.' });
        }

        const { calificacion, comentario } = req.body;

        if (!calificacion) {
            return res.status(400).json({ error: 'Por favor selecciona una calificación en estrellas.' });
        }

        const result = await pool.query(
            `INSERT INTO resenas_app (id_usuario, calificacion, comentario) 
             VALUES ($1, $2, $3) 
             RETURNING id_resena, id_usuario, calificacion, comentario, fecha_creacion`,
            [id_usuario, parseInt(calificacion), comentario || '']
        );

        res.status(201).json({
            mensaje: '¡Gracias por calificar PataRunner!',
            resena: result.rows[0]
        });
    } catch (error) {
        console.error("Error en POST /api/resenas-app:", error);
        res.status(500).json({ error: 'Error interno al guardar la reseña.' });
    }
});
// ==========================================
// ACTUALIZAR FOTO DE PERFIL (BASE64)
// ==========================================
app.put('/api/usuarios/foto', async (req, res) => {
    try {
        let id_usuario = null;

        // Intentar extraer el ID desde el header Authorization
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'undefined' && token !== 'null') {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_patarunner');
                    id_usuario = decoded.id_usuario || decoded.id || decoded.idUsuario;
                } catch (e) {
                    try {
                        const decodedPayload = jwt.decode(token);
                        if (decodedPayload) id_usuario = decodedPayload.id_usuario || decodedPayload.id || decodedPayload.idUsuario;
                    } catch (err) {}
                }
            }
        }

        // Fallback al body si no vino en el token
        if (!id_usuario && req.body.id_usuario) {
            id_usuario = req.body.id_usuario;
        }

        if (!id_usuario) {
            return res.status(401).json({ error: 'Sesión no válida o usuario no identificado.' });
        }

        const { foto_perfil } = req.body;
        if (!foto_perfil) {
            return res.status(400).json({ error: 'No se envió ninguna imagen.' });
        }

        const result = await pool.query(
            `UPDATE usuarios 
             SET foto_perfil = $1 
             WHERE id_usuario = $2 
             RETURNING id_usuario, foto_perfil`,
            [foto_perfil, id_usuario]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            mensaje: 'Foto de perfil actualizada correctamente.',
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error("Error en PUT /api/usuarios/foto:", error);
        res.status(500).json({ error: 'Error interno al guardar la foto de perfil.' });
    }
});
// ==========================================
// ANULAR / CANCELAR PEDIDO POR PARTE DEL RUNNER
// ==========================================
app.put('/api/pedidos/:id/anular', async (req, res) => {
    try {
        const { id } = req.params;

        // Marcamos el pedido como 'Cancelado' para que el cliente reciba la alerta
        const result = await pool.query(
            `UPDATE pedidos 
             SET estado = 'Cancelado' 
             WHERE id_pedido = $1 
             RETURNING id_pedido, estado`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        res.status(200).json({
            success: true,
            mensaje: 'El pedido fue cancelado y el cliente ha sido notificado.',
            pedido: result.rows[0]
        });
    } catch (error) {
        console.error("Error en PUT /api/pedidos/:id/anular:", error.message);
        res.status(500).json({ error: 'Error interno al anular la entrega.' });
    }
});
// ==========================================
// OPCIÓN 1: VOLVER A PEDIR (REPUBLICAR PEDIDO)
// ==========================================
app.put('/api/pedidos/:id/republicar', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE pedidos 
             SET estado = 'Pendiente', id_runner = NULL 
             WHERE id_pedido = $1`,
            [id]
        );
        res.status(200).json({ success: true, mensaje: 'Pedido vuelto a publicar correctamente.' });
    } catch (error) {
        console.error("Error al republicar pedido:", error);
        res.status(500).json({ error: 'Error al volver a publicar el pedido.' });
    }
});

// ==========================================
// OPCIÓN 2: NO, GRACIAS (CANCELAR DEFINITIVAMENTE)
// ==========================================
app.put('/api/pedidos/:id/cancelar-definitivo', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE pedidos 
             SET estado = 'Cancelado' 
             WHERE id_pedido = $1`,
            [id]
        );
        res.status(200).json({ success: true, mensaje: 'Pedido cancelado definitivamente.' });
    } catch (error) {
        console.error("Error al cancelar pedido definitivamente:", error);
        res.status(500).json({ error: 'Error al cancelar el pedido.' });
    }
});
// ==========================================
// CANCELAR PEDIDO DIRECTAMENTE POR EL ALUMNO
// ==========================================
app.put('/api/pedidos/:id/cancelar', async (req, res) => {
    try {
        const { id } = req.params;

        // Cambiamos el estado a 'Cancelado' solo si aún no ha sido entregado
        const result = await pool.query(
            `UPDATE pedidos 
             SET estado = 'Cancelado' 
             WHERE id_pedido = $1 AND estado = 'Pendiente'
             RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ 
                error: 'El pedido no se puede cancelar porque ya fue tomado por un Runner o no existe.' 
            });
        }

        res.status(200).json({ 
            success: true, 
            mensaje: 'Pedido cancelado con éxito por el alumno.' 
        });
    } catch (error) {
        console.error("Error al cancelar pedido por el alumno:", error);
        res.status(500).json({ error: 'Error al procesar la cancelación.' });
    }
});
// Iniciar servidor Node.js
const PORT = process.env.PORT || port || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor PataRunner ejecutándose en el puerto ${PORT}`);
});