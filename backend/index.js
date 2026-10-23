import express from 'express';
import cors from 'cors';
import pool from './db.js';
import cron from 'node-cron';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

// --- IMPORTACIONES DE WHATSAPP ---
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// INICIALIZACIÓN DEL BOT DE WHATSAPP
// ==========================================
const wpClient = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
        executablePath: puppeteer.executablePath(),
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process',
            '--disable-extensions',
            '--renderer-process-limit=1'
        ]
    }
});

// Variable para almacenar la imagen del código QR
let qrImageBase64 = '';

wpClient.on('qr', async (qr) => {
    console.log('⚡ Nuevo código QR generado para WhatsApp.');
    try {
        // Convierte el código QR a una imagen Base64
        qrImageBase64 = await QRCode.toDataURL(qr);
    } catch (err) {
        console.error('Error al generar imagen QR:', err);
    }
});

// Ruta para ver el QR directamente en el navegador
app.get('/qr', (req, res) => {
    if (qrImageBase64) {
        res.send(`
            <html>
                <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background-color:#f4f4f9;">
                    <h2>Escanea este QR con el WhatsApp de PataRunner</h2>
                    <img src="${qrImageBase64}" style="width:300px; height:300px; border:10px solid white; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" />
                    <p>Refresca la página si el código expira.</p>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                    <h3>El bot se está iniciando o ya está conectado. Refresca en unos segundos...</h3>
                </body>
            </html>
        `);
    }
});

wpClient.on('ready', () => {
    console.log(' Bot de WhatsApp de PataRunner conectado y listo para enviar códigos OTP.');
});

wpClient.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación en WhatsApp:', msg);
});

console.log('⏳ Iniciando navegador Chromium para WhatsApp...');
wpClient.initialize().catch(err => {
    console.error('❌ Error al inicializar WhatsApp Web:', err);
});

// ==========================================
// CONFIGURACIÓN OPCIONAL FIREBASE ADMIN
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
        // En caso de tokens directos de PostgreSQL
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
    res.send('Servidor de PataRunner (WhatsApp OTP Ready) funcionando correctamente 🚀');
});

// ==========================================
// 1. RUTA DE REGISTRO CON ENVÍO OTP POR WHATSAPP
// ==========================================


// ==========================================
// 1. RUTA DE REGISTRO CON ENVÍO OTP POR WHATSAPP
// ==========================================
app.post(['/usuarios/registro', '/api/usuarios/registro'], async (req, res) => {
    try {
        console.log('BODY RECIBIDO:', req.body); // Permite verificar los datos en los logs de Render

        // Desestructurar todas las posibles variantes de nombres que envíe el frontend
        const { 
            codigoEstudiantil, codigo_estudiantil, codigoAlumno, codigo_alumno, codigo,
            nombres, apellidos, nombreCompleto, nombre_completo,
            carrera, 
            email, correo, correo_personal, 
            telefono, celular,
            password, contrasena, password_hash
        } = req.body;

        // Asignar el valor disponible para cada campo obligatorio
        const finalCodigo = codigoEstudiantil || codigo_estudiantil || codigoAlumno || codigo_alumno || codigo;
        const finalEmail = email || correo || correo_personal;
        const finalTelefono = telefono || celular;
        const finalPassword = password || contrasena || password_hash;
        const finalNombre = nombre_completo || nombreCompleto || `${nombres || ''} ${apellidos || ''}`.trim();

        // Validar que los datos requeridos no lleguen vacíos
        if (!finalCodigo || !finalEmail || !finalTelefono || !finalPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos obligatorios (código, correo, teléfono o contraseña).' 
            });
        }

        // Generar OTP de 6 dígitos
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 1. Guardar el OTP en la tabla codigos_otp
        await pool.query(
            `INSERT INTO codigos_otp (telefono, codigo, expira_en) 
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
            [finalTelefono, otp]
        );

        // 2. Guardar el registro temporal en la tabla registros_pendientes
        await pool.query(
            `INSERT INTO registros_pendientes 
            (codigo_alumno, correo_personal, nombre_completo, password_hash, carrera, token_verificacion, telefono, codigo_otp, expira_en) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '10 minutes')`,
            [finalCodigo, finalEmail, finalNombre, finalPassword, carrera || '', otp, finalTelefono, otp]
        );

        // 3. Enviar el mensaje por WhatsApp mediante Puppeteer
        // 3. Enviar el mensaje por WhatsApp de forma segura
        const cleanPhone = finalTelefono.replace(/\D/g, '');
        const chatId = `${cleanPhone}@c.us`;
        
        try {
            if (wpClient && wpClient.info) {
                await wpClient.sendMessage(chatId, `Tu código de verificación de PataRunner es: ${otp}`);
                console.log(`✅ Mensaje de OTP enviado a ${chatId}`);
            } else {
                console.warn('⚠️ WhatsApp Web no está listo aún o se está reconectando.');
            }
        } catch (wpError) {
            console.error('❌ Error al enviar mensaje por WhatsApp:', wpError);
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Registro completado y código OTP generado.' 
        });
});

// ==========================================
// 3. RUTA DE INICIO DE SESIÓN
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { identificador, password } = req.body;

        if (!identificador) {
            return res.status(400).json({ error: 'Ingresa tu código, correo personal o teléfono.' });
        }

        const idLimpio = identificador.trim().toLowerCase();

        // Buscar usuario en PostgreSQL
        const result = await pool.query(
            `SELECT * FROM usuarios 
             WHERE LOWER(codigo_alumno) = $1 
                OR LOWER(correo_personal) = $1 
                OR telefono = $1`,
            [idLimpio]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no registrado en PataRunner.' });
        }

        const usuario = result.rows[0];

        // Verificar si la cuenta está suspendida por Cliente Ausente
        if (usuario.is_blocked) {
            return res.status(403).json({ error: 'Tu cuenta ha sido suspendida preventivamente por un reporte no resuelto.' });
        }

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

// --- RUTA: Registrar un Pedido completo ---
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

        await client.query(
          `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) 
           VALUES ($1, $2, $3, $4, $5)`,
          [idPedido, item.id_producto, item.cantidad, precioUnitario, subtotal]
        );
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

        // Si el reporte es por cliente ausente, suspendemos preventivamente la cuenta del cliente
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

// Iniciar servidor Node.js
const PORT = process.env.PORT || port || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor PataRunner ejecutándose en el puerto ${PORT}`);
});