import express from 'express';
import cors from 'cors';
import pool from './db.js';
import cron from 'node-cron';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';
import fs from 'fs';

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. Carga segura de credenciales de Firebase Service Account
let serviceAccount = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        // Corregir formateo de saltos de línea en la clave privada
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
    } else if (fs.existsSync('./firebase-service-account.json')) {
        serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
    }
} catch (error) {
    console.error("❌ Error al cargar credenciales de Firebase:", error.message);
}

// 2. Inicialización limpia de Firebase Admin (ES Modules)
if (serviceAccount && getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin inicializado con éxito.");
} else if (!serviceAccount) {
    console.warn("⚠️ Advertencia: FIREBASE_SERVICE_ACCOUNT no está configurado.");
}

// Middleware de verificación de token Firebase corregido
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
        console.error("Error al verificar token de Firebase:", error.message);
        return res.status(403).json({ error: `Token inválido o expirado: ${error.message}` });
    }
};

// Middleware para verificar si el usuario tiene rol de Administrador (id_rol === 3)
const verificarAdmin = async (req, res, next) => {
    try {
        const firebase_uid = req.user.uid || req.user.user_id;
        const result = await pool.query(
            'SELECT id_rol FROM usuarios WHERE firebase_uid = $1 OR correo_institucional = $2',
            [firebase_uid, req.user.email ? req.user.email.toLowerCase() : '']
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
// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Ruta de prueba base
app.get('/', (req, res) => {
    res.send('Servidor de PataRunner funcionando correctamente 🚀');
});

// ==========================================
// RUTA DE REGISTRO DE USUARIO (ROBUSTA CON NODEMAILER)
// ==========================================
app.post('/api/usuarios/registro', async (req, res) => {
    try {
        const { firebase_uid, codigo_alumno, correo_institucional, nombre_completo, carrera, verificado } = req.body;

        // 1. Guardar o actualizar en Neon PostgreSQL
        const query = `
            INSERT INTO usuarios (id_rol, firebase_uid, codigo_alumno, correo_institucional, nombre_completo, carrera, verificado)
            VALUES (1, $1, $2, $3, $4, $5, $6)
            ON CONFLICT (codigo_alumno) DO UPDATE 
            SET firebase_uid = EXCLUDED.firebase_uid,
                correo_institucional = EXCLUDED.correo_institucional,
                nombre_completo = EXCLUDED.nombre_completo,
                carrera = EXCLUDED.carrera,
                verificado = EXCLUDED.verificado
            RETURNING id_usuario, codigo_alumno, correo_institucional;
        `;

        const values = [
            firebase_uid, 
            codigo_alumno, 
            correo_institucional.toLowerCase(), 
            nombre_completo, 
            carrera, 
            verificado || false
        ];

       // 1. Asegurar que el correo tenga el dominio @utp.edu.pe
        const correoDestino = correo_institucional.includes('@') 
            ? correo_institucional.toLowerCase() 
            : `${correo_institucional.toLowerCase()}@utp.edu.pe`;

        // 2. Intentar generar el enlace con Firebase Admin
        let verificationLink = '';
        try {
            const actionCodeSettings = {
                url: 'https://patarunnerapp-frontend.vercel.app',
                handleCodeInApp: false
            };

            verificationLink = await getAuth().generateEmailVerificationLink(
                correoDestino,
                actionCodeSettings
            );
            console.log("Enlace de verificación generado con éxito.");
        } catch (firebaseErr) {
            console.error("Error específico de Firebase Admin al generar enlace:", firebaseErr);
            throw new Error(`Error en Firebase Auth: ${firebaseErr.message}`);
        }

        // 3. Despachar el correo mediante la API HTTP de EmailJS (Puerto 443)
        const responseEmailJS = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                template_params: {
                    to_email: correoDestino,
                    user_name: nombre_completo,
                    verification_link: verificationLink
                }
            })
        });

        if (!responseEmailJS.ok) {
            const errorText = await responseEmailJS.text();
            console.error("Error respuesta EmailJS:", errorText);
            throw new Error('No se pudo enviar el correo de verificación.');
        }

        console.log("✉️ Correo despachado con éxito mediante EmailJS API");

        res.status(201).json({
            success: true,
            message: 'Registro completado. Revisa tu correo institucional para verificar tu cuenta.',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error(" Error general en el endpoint de registro:", error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message || "Error interno al procesar el registro." 
        });
    }
});

// --- RUTA: Registrar una Tienda ---
app.post('/api/tiendas', async (req, res) => {
    try {
        const { nombre, ubicacion } = req.body;
        
        const nuevaTienda = await pool.query(
            'INSERT INTO tiendas (nombre, ubicacion) VALUES ($1, $2) RETURNING *',
            [nombre, ubicacion]
        );
        
        res.status(201).json({
            mensaje: 'Tienda registrada exitosamente',
            tienda: nuevaTienda.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al registrar la tienda.' });
    }
});
// --- RUTA: Registrar un Producto ---
app.post('/api/productos', async (req, res) => {
    try {
        const { id_tienda, nombre, descripcion, precio } = req.body;
        
        const nuevoProducto = await pool.query(
            'INSERT INTO productos (id_tienda, nombre, descripcion, precio) VALUES ($1, $2, $3, $4) RETURNING *',
            [id_tienda, nombre, descripcion, precio]
        );
        
        res.status(201).json({
            mensaje: 'Producto registrado exitosamente',
            producto: nuevoProducto.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al registrar el producto.' });
    }
});
// --- RUTA: Eliminar / Desactivar Producto ---
app.delete('/api/admin/productos/:id',verificarToken,verificarAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query(
            'UPDATE productos SET disponible = false WHERE id_producto = $1 RETURNING *',
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        res.json({ success: true, message: 'Producto eliminado del catálogo correctamente' });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ success: false, error: 'Error en la base de datos' });
    }
});
// --- RUTA: Obtener todos los Productos con el nombre de su Tienda ---
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

app.get('/api/pedidos/historial/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const query = `
            SELECT 
                p.id_pedido, p.estado, p.ubicacion_entrega, p.fecha_pedido, 
                p.id_runner, p.calificacion, -- NUEVO: Traemos datos para calificar
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

app.get('/api/pedidos/historial-runner/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const query = `
            SELECT 
                p.id_pedido,
                p.estado,
                p.ubicacion_entrega,
                p.fecha_pedido,
                p.tarifa_entrega AS ganancia,
                c.nombre_completo AS cliente_nombre,
                COALESCE(STRING_AGG(pr.nombre, ', '), p.descripcion_pedido) AS productos_resumen
            FROM pedidos p
            INNER JOIN usuarios c ON p.id_cliente = c.id_usuario
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE p.id_runner = $1
              AND p.estado IN ('Entregado', 'Cancelado')
            GROUP BY p.id_pedido, c.nombre_completo, p.descripcion_pedido, p.tarifa_entrega
            ORDER BY p.fecha_pedido DESC
        `;
        const result = await pool.query(query, [id_usuario]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al cargar historial del runner" });
    }
});

// --- RUTA: Registrar un Pedido completo (Cabecera + Productos) ---
app.post('/api/pedidos', verificarToken, async (req, res) => {
  const { 
    direccion_entrega, 
    ubicacion_entrega, 
    tarifa_entrega, 
    metodo_pago, 
    descripcion_pedido, 
    costo_aproximado, 
    total, 
    carrito 
  } = req.body;

  const firebase_uid = req.user.uid || req.user.user_id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener el id_usuario de PostgreSQL usando el UID de Firebase
    const userRes = await client.query(
      'SELECT id_usuario FROM usuarios WHERE firebase_uid = $1 OR correo_institucional = $2',
      [firebase_uid, req.user.email ? req.user.email.toLowerCase() : '']
    );

    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
    }

    const id_cliente = userRes.rows[0].id_usuario;

    // Asignación flexible de variables según lo enviado por el frontend
    const ubicacionFinal = ubicacion_entrega || direccion_entrega || 'No especificada';
    const tarifaFinal = tarifa_entrega || 0;
    const metodoPagoFinal = metodo_pago || 'Efectivo';
    const costoAproxFinal = costo_aproximado || total || 0;

    // 2. Insertar cabecera usando ÚNICAMENTE las columnas existentes en tu tabla 'pedidos'
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

    // 3. Insertar detalle de productos en la tabla 'detalle_pedido'
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

// --- RUTA: Registrar el Detalle de un Pedido (Los productos de la orden) ---
app.post('/api/detalle_pedido', async (req, res) => {
    try {
        const { id_pedido, id_producto, cantidad, precio_unitario, subtotal } = req.body;
        
        const nuevoDetalle = await pool.query(
            "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [id_pedido, id_producto, cantidad, precio_unitario, subtotal]
        );
        
        res.status(201).json({
            mensaje: '¡Producto agregado al pedido con éxito!',
            detalle: nuevoDetalle.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al registrar el detalle del pedido.' });
    }
});
// --- RUTA: Actualizar estado de un Pedido (Ej: Aceptar o Entregar) ---
app.put('/api/pedidos/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params; 
        let { id_runner, estado } = req.body; 

        // Si el frontend no envió id_runner, lo obtenemos con el token de Firebase
        if (!id_runner) {
            const firebase_uid = req.user.uid || req.user.user_id;
            const userRes = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE firebase_uid = $1 OR correo_institucional = $2',
                [firebase_uid, req.user.email ? req.user.email.toLowerCase() : '']
            );
            if (userRes.rows.length > 0) {
                id_runner = userRes.rows[0].id_usuario;
            }
        }
        
        // 1. Actualizamos el estado y asignamos el ID del runner
        await pool.query(
            "UPDATE pedidos SET id_runner = $1, estado = $2 WHERE id_pedido = $3",
            [id_runner, estado, id]
        );
        
        // 2. Consultamos el pedido con LEFT JOIN para evitar fallos si id_runner es nulo
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

// --- RUTA: Obtener el directorio de Tiendas ---
app.get('/api/tiendas', async (req, res) => {
    try {
        // Consultamos todas las tiendas ordenadas alfabéticamente
        const directorioTiendas = await pool.query('SELECT nombre, ubicacion FROM tiendas ORDER BY nombre ASC');
        res.status(200).json(directorioTiendas.rows);
    } catch (error) {
        console.error("Error al obtener las tiendas:", error.message);
        res.status(500).json({ error: 'Error al obtener el directorio de tiendas.' });
    }
});

// --- RUTA: Obtener pedidos Pendientes (Pantalla principal del Runner) ---
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

// --- NUEVA RUTA: Obtener los pedidos de un Alumno específico ---
app.get('/api/pedidos/cliente/:id_cliente', async (req, res) => {
    try {
        const { id_cliente } = req.params;
        
        // Hacemos LEFT JOIN con usuarios para obtener el nombre Y LA FOTO del Runner
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

// --- NUEVA RUTA: Obtener entregas en curso de un Runner ---
app.get('/api/pedidos/runner/:id_runner', async (req, res) => {
    try {
        const { id_runner } = req.params;
        
        // Hacemos JOIN con usuarios para saber el nombre y foto del cliente
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

// --- RUTA: Enviar un mensaje al chat del pedido ---
app.post('/api/chat',verificarToken, async (req, res) => {
    try {
        // Usamos los nombres exactos de tu diagrama
        const { id_pedido, id_remitente, id_rol, mensaje } = req.body;
        
        const nuevoMensaje = await pool.query(
            "INSERT INTO chat_pedido (id_pedido, id_remitente, id_rol, mensaje) VALUES ($1, $2, $3, $4) RETURNING *",
            [id_pedido, id_remitente, id_rol, mensaje]
        );
        
        res.status(201).json({
            exito: true,
            chat: nuevoMensaje.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al enviar el mensaje.' });
    }
});
// --- RUTA: Obtener los mensajes del chat de un pedido ---
app.get('/api/chat/:id_pedido', async (req, res) => {
    try {
        const { id_pedido } = req.params;
        
        // Buscamos los mensajes del pedido y los ordenamos por fecha (el más antiguo primero)
        // Además, hacemos JOIN con usuarios para obtener el nombre de quien lo envió
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

// Ruta de Login segura
app.post('/api/login', verificarToken, async (req, res) => {
    try {
        // Validación de seguridad para req.user
        if (!req.user) {
            return res.status(401).json({ error: 'No se pudo autenticar el token de usuario.' });
        }

        const firebase_uid = req.user.uid || req.user.user_id;
        const email = req.user.email ? req.user.email.toLowerCase() : '';

        // Buscar al usuario en PostgreSQL (Neon)
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE firebase_uid = $1 OR correo_institucional = $2',
            [firebase_uid, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos. Falta completar el registro.' });
        }

        const usuario = result.rows[0];

        // Sincronizar estado verificado
        if (!usuario.verificado) {
            await pool.query('UPDATE usuarios SET verificado = TRUE WHERE id_usuario = $1', [usuario.id_usuario]);
            usuario.verificado = true;
        }

        // Vincular firebase_uid en Neon si estaba nulo
        if (!usuario.firebase_uid) {
            await pool.query('UPDATE usuarios SET firebase_uid = $1 WHERE id_usuario = $2', [firebase_uid, usuario.id_usuario]);
            usuario.firebase_uid = firebase_uid;
        }

        res.json({
            message: 'Acceso concedido',
            usuario: usuario
        });

    } catch (error) {
        console.error("Error en POST /api/login:", error.message);
        res.status(500).json({ error: error.message || 'Error interno del servidor en el inicio de sesión.' });
    }
});

// ==========================================
// RUTA: REGISTRAR NUEVO ALUMNO EN POSTGRESQL (VERSIÓN COMPLETA)
// ==========================================
app.post('/api/registro', async (req, res) => {
    // 1. Extraemos todos los datos de la Fase 3 del frontend
    const { firebase_uid, codigo_alumno, nombres, apellidos, carrera, correo } = req.body;

    try {
        // 2. Unimos nombres y apellidos para mantener la compatibilidad con tu columna original
        const nombreCompleto = `${nombres} ${apellidos}`;

        // 3. Insertamos todos los datos (los antiguos y las 3 columnas nuevas)
        const query = `
            INSERT INTO usuarios (firebase_uid, codigo_alumno, carrera, nombre_completo, correo_institucional, id_rol) 
            VALUES ($1, $2, $3, $4, $5, 1) 
            RETURNING *;
        `;
        
        const correoMinuscula = correo.toLowerCase();
const values = [firebase_uid, codigo_alumno, carrera, nombreCompleto, correoMinuscula];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            mensaje: 'Alumno registrado con perfil completo exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error("Error al guardar el usuario completo en PostgreSQL:", error);
        
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este alumno ya está registrado en la base de datos.' });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// --- RUTA 2: Activar perfil de Runner (PROTEGIDA) ---
app.put('/api/usuarios/activar-runner', verificarToken, async (req, res) => {
    try {
        const email = req.usuarioFirebase.email;
        
        // 1. Verificamos si el usuario tiene la opción de Runner restringida
        const checkUser = await pool.query(
            'SELECT COALESCE(bloqueado_runner, false) AS bloqueado_runner FROM usuarios WHERE correo_institucional = $1',
            [email]
        );

        if (checkUser.rows.length > 0 && checkUser.rows[0].bloqueado_runner) {
            return res.status(403).json({ 
                error: 'Un administrador ha revocado y restringido tu acceso para ser Runner.' 
            });
        }

        // 2. Si no está restringido, actualizamos el id_rol a 2 (Runner)
        const usuarioActualizado = await pool.query(
            "UPDATE usuarios SET id_rol = 2 WHERE correo_institucional = $1 RETURNING *",
            [email]
        );

        if (usuarioActualizado.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            mensaje: '¡Insignia de Runner activada con éxito!',
            usuario: usuarioActualizado.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al actualizar el perfil a Runner.' });
    }
});

// --- NUEVA RUTA: Ascender de Alumno a Runner (PROTEGIDA) ---
app.put('/api/usuarios/rol', verificarToken, async (req, res) => {
    try {
        const correo = req.usuarioFirebase.email;
        
        // 1. Verificamos si el usuario tiene la opción de Runner restringida
        const checkUser = await pool.query(
            'SELECT COALESCE(bloqueado_runner, false) AS bloqueado_runner FROM usuarios WHERE correo_institucional = $1',
            [correo]
        );

        if (checkUser.rows.length > 0 && checkUser.rows[0].bloqueado_runner) {
            return res.status(403).json({ 
                error: 'Un administrador ha revocado y restringido tu acceso para ser Runner.' 
            });
        }

        // 2. Actualizamos el rol a 2 (Runner)
        const result = await pool.query(
            'UPDATE usuarios SET id_rol = 2 WHERE correo_institucional = $1 RETURNING *',
            [correo]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
        }

        res.status(200).json({ 
            mensaje: '¡Felicidades! Ahora eres un Runner.', 
            usuario: result.rows[0] 
        });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ error: 'Hubo un problema al actualizar tu rol en el servidor.' });
    }
});

// ================= RUTAS DEL CHAT (CON RADARES DE DEPURACIÓN) =================


// Ruta para anular un pedido
app.put('/api/pedidos/:id/anular', async (req, res) => {
    try {
        const idPedido = req.params.id;
        
        // Actualizamos el estado en PostgreSQL
        const resultado = await pool.query(
            "UPDATE pedidos SET estado = 'Cancelado' WHERE id_pedido = $1 RETURNING *",
            [idPedido]
        );
        
        res.json({ success: true, pedido: resultado.rows[0] });
    } catch (error) {
        console.error("Error al anular pedido:", error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Ruta para republicar un pedido (clonando también sus productos)
app.post('/api/pedidos/:id/republicar', async (req, res) => {
    try {
        const idAntiguo = req.params.id;
        
        // PASO 1: Clonar la cabecera del pedido
        const resultadoPedido = await pool.query(
            `INSERT INTO pedidos (id_cliente, ubicacion_entrega, tarifa_entrega, metodo_pago, estado) 
             SELECT id_cliente, ubicacion_entrega, tarifa_entrega, metodo_pago, 'Pendiente' 
             FROM pedidos WHERE id_pedido = $1 RETURNING *`,
            [idAntiguo]
        );
        
        const nuevoPedido = resultadoPedido.rows[0];
        const nuevoId = nuevoPedido.id_pedido; // Guardamos el nuevo ID generado

        // PASO 2: Clonar los productos (detalle_pedido) apuntando al nuevo ID
        await pool.query(
            `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
             SELECT $1, id_producto, cantidad, precio_unitario, subtotal 
             FROM detalle_pedido WHERE id_pedido = $2`,
            [nuevoId, idAntiguo]
        );
        
        // Enviamos el éxito al frontend
        res.json({ success: true, pedido: nuevoPedido });
    } catch (error) {
        console.error("Error al republicar pedido:", error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// --- NUEVA RUTA: Cancelar pedido del Alumno (Solo si está Pendiente) ---
app.put('/api/pedidos/:id/cancelar', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Verificamos el estado actual del pedido
        const chequeo = await pool.query('SELECT estado FROM pedidos WHERE id_pedido = $1', [id]);
        
        if (chequeo.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        if (chequeo.rows[0].estado !== 'Pendiente') {
            return res.status(400).json({ error: 'El pedido ya fue aceptado por un Runner y no se puede cancelar.' });
        }

       // 2. Devolver el stock de los productos del pedido
        const detalles = await pool.query(
            'SELECT id_producto, cantidad FROM detalle_pedido WHERE id_pedido = $1',
            [id]
        );

        for (let item of detalles.rows) {
            if (item.id_producto) {
                await pool.query(
                    'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2',
                    [item.cantidad || 1, item.id_producto]
                );
            }
        }

        // 3. Cambiar el estado a Cancelado
        await pool.query("UPDATE pedidos SET estado = 'Cancelado' WHERE id_pedido = $1", [id]);
        
        res.status(200).json({ mensaje: 'Pedido cancelado exitosamente.' });
    } catch (error) {
        console.error("Error al cancelar el pedido:", error.message);
        res.status(500).json({ error: 'Error interno al intentar cancelar el pedido.' });
    }
});

// ==========================================
// RUTA: CALIFICAR A UN RUNNER
// ==========================================
app.put('/api/pedidos/:id/calificar', async (req, res) => {
    const { id } = req.params;
    const { calificacion, id_runner } = req.body;

    try {
        // 1. Guardamos las estrellas (1 a 5) en el pedido específico
        await pool.query(
            'UPDATE pedidos SET calificacion = $1 WHERE id_pedido = $2',
            [calificacion, id]
        );

        // 2. Calculamos el nuevo promedio real de ese runner
        const resultPromedio = await pool.query(
            'SELECT AVG(calificacion) as promedio FROM pedidos WHERE id_runner = $1 AND calificacion IS NOT NULL',
            [id_runner]
        );
        
        // Formateamos para que tenga máximo 2 decimales
        const nuevoPromedio = parseFloat(resultPromedio.rows[0].promedio).toFixed(2);

        // 3. Actualizamos la tabla usuarios con su nuevo puntaje global
        await pool.query(
            'UPDATE usuarios SET calificacion_runner = $1 WHERE id_usuario = $2',
            [nuevoPromedio, id_runner]
        );

        res.status(200).json({ success: true, mensaje: '¡Calificación enviada!', nuevoPromedio });
    } catch (error) {
        console.error("Error al calificar:", error);
        res.status(500).json({ error: 'Error interno del servidor al calificar.' });
    }
});

// ==========================================
// RUTA ADMIN: OBTENER TODOS LOS PEDIDOS (OPERACIONES)
// ==========================================
app.get('/api/admin/pedidos', verificarToken,verificarAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_pedido, 
                p.estado, 
                p.fecha_pedido,
                p.descripcion_pedido,
                p.costo_aproximado,
                p.tarifa_entrega, 
                cliente.nombre_completo AS nombre_cliente,
                runner.nombre_completo AS nombre_runner,
                (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_pedido WHERE id_pedido = p.id_pedido) AS total_catalogo
            FROM pedidos p
            LEFT JOIN usuarios cliente ON p.id_cliente = cliente.id_usuario
            LEFT JOIN usuarios runner ON p.id_runner = runner.id_usuario
            ORDER BY p.fecha_pedido DESC
            LIMIT 50;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo pedidos de admin:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


/// ----------------------------------------
// RUTA ADMIN: OBTENER TODOS LOS USUARIOS
// ----------------------------------------
app.get('/api/admin/usuarios',verificarToken,verificarAdmin, async (req, res) => {
    try {
        await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;');
        await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;');

        const query = `
            SELECT 
                id_usuario, 
                codigo_alumno AS codigo, 
                nombre_completo, 
                carrera, 
                id_rol, 
                COALESCE(is_blocked, false) AS is_blocked,
                COALESCE(verificado, false) AS verificado
            FROM usuarios
            ORDER BY id_rol DESC, nombre_completo ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener usuarios para admin:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 1. Bloquear o Desbloquear un usuario
app.patch('/api/admin/usuarios/:codigo/bloquear',verificarToken,verificarAdmin, async (req, res) => {
    const { codigo } = req.params;
    const { blocked } = req.body;

    try {
        await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;');
        await pool.query(
            'UPDATE usuarios SET is_blocked = $1 WHERE codigo_alumno = $2',
            [blocked, codigo]
        );
        res.json({ success: true, message: `Usuario ${blocked ? 'bloqueado' : 'desbloqueado'} con éxito.` });
    } catch (err) {
        console.error('Error al cambiar estado de bloqueo:', err);
        res.status(500).json({ error: 'Error interno al actualizar usuario' });
    }
});

// 2. Quitar o Asignar el rol de Runner (Maneja bloqueo de reclasificación)
app.patch('/api/admin/usuarios/:codigo/runner',verificarToken,verificarAdmin, async (req, res) => {
    const { codigo } = req.params;
    const { isRunner } = req.body;

    try {
        // Garantizamos que la columna exista en la BD
        await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_runner BOOLEAN DEFAULT false;');

        if (!isRunner) {
            // Liberamos sus pedidos en curso pasando a 'Pendiente'
            await pool.query(
                `UPDATE pedidos 
                 SET estado = 'Pendiente', id_runner = NULL 
                 WHERE id_runner = (SELECT id_usuario FROM usuarios WHERE codigo_alumno = $1) 
                 AND estado = 'En Camino'`,
                [codigo]
            );

            // Cambiamos id_rol a 1 Y BLOQUEAMOS su capacidad de volver a postular a Runner ($1 en lugar de $2)
            await pool.query(
                'UPDATE usuarios SET id_rol = 1, bloqueado_runner = true WHERE codigo_alumno = $1',
                [codigo]
            );
        } else {
            // Si el admin le vuelve a dar el rol manualmente ($1 en lugar de $2)
            await pool.query(
                'UPDATE usuarios SET id_rol = 2, bloqueado_runner = false WHERE codigo_alumno = $1',
                [codigo]
            );
        }

        res.json({ 
            success: true, 
            message: isRunner 
                ? 'Rol de Runner asignado correctamente.' 
                : 'Rol de Runner revocado y restringido para este usuario.' 
        });
    } catch (err) {
        console.error('Error al cambiar rol de Runner:', err);
        res.status(500).json({ error: 'Error interno al actualizar rol de Runner' });
    }
});

// Verificar si la sesión del usuario está bloqueada, su rol o si tiene bloqueado volver a ser Runner
app.get('/api/usuarios/estado/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT COALESCE(is_blocked, false) AS is_blocked, id_rol, COALESCE(bloqueado_runner, false) AS bloqueado_runner FROM usuarios WHERE id_usuario = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.json({ blocked: false, id_rol: 1, bloqueado_runner: false });
        }
        res.json({ 
            blocked: result.rows[0].is_blocked,
            id_rol: result.rows[0].id_rol,
            bloqueado_runner: result.rows[0].bloqueado_runner
        });
    } catch (error) {
        console.error('Error al consultar estado de usuario:', error);
        res.status(500).json({ error: 'Error al consultar estado' });
    }
});

// ==========================================
// MÓDULO 3 ADMIN: AUDITORÍA Y REPORTES
// ==========================================

// 1. Obtener todos los reportes/incidencias
app.get('/api/admin/reportes',verificarToken,verificarAdmin, async (req, res) => {
    try {
        // Garantizamos que la tabla reportes exista
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reportes (
                id_reporte SERIAL PRIMARY KEY,
                id_pedido INT,
                id_usuario_reporta INT,
                motivo TEXT,
                estado VARCHAR(20) DEFAULT 'Pendiente', -- 'Pendiente', 'Resuelto', 'Desestimado'
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const result = await pool.query(`
            SELECT 
                r.id_reporte,
                r.id_pedido,
                r.motivo,
                r.estado,
                r.fecha_creacion,
                u.nombre_completo AS reportador,
                u.codigo_alumno AS codigo_reportador
            FROM reportes r
            LEFT JOIN usuarios u ON r.id_usuario_reporta = u.id_usuario
            ORDER BY 
                CASE WHEN r.estado = 'Pendiente' THEN 1 ELSE 2 END,
                r.fecha_creacion DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reportes:', err);
        res.status(500).json({ error: 'Error interno al consultar reportes' });
    }
});

// 2. Actualizar estado de un reporte (Resolver o Desestimar)
app.patch('/api/admin/reportes/:id/estado',verificarToken,verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'Resuelto' o 'Desestimado'

    try {
        await pool.query('UPDATE reportes SET estado = $1 WHERE id_reporte = $2', [estado, id]);
        res.json({ success: true, message: `Reporte marcado como ${estado}.` });
    } catch (err) {
        console.error('Error al actualizar reporte:', err);
        res.status(500).json({ error: 'Error al actualizar estado del reporte' });
    }
});

// ==========================================
// MÓDULO 4 ADMIN: KPIS Y ESTADÍSTICAS DEL DÍA
app.get('/api/admin/kpis',verificarToken,verificarAdmin, async (req, res) => {
    try {
        // 1. Conteo de pedidos por estado ajustado a la hora de Perú (-05:00)
        const resPedidos = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE (fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date) AS total_hoy,
                COUNT(*) FILTER (WHERE (fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date AND estado = 'Entregado') AS entregados_hoy,
                COUNT(*) FILTER (WHERE (fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date AND estado = 'En Camino') AS en_camino_hoy,
                COUNT(*) FILTER (WHERE (fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date AND estado = 'Pendiente') AS pendientes_hoy,
                COUNT(*) FILTER (WHERE (fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date AND estado = 'Cancelado') AS cancelados_hoy,
                COALESCE(SUM(tarifa_entrega) FILTER (WHERE (fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date AND estado = 'Entregado'), 0) AS ganancias_runners_hoy
            FROM pedidos;
        `);

        // 2. Conteo de usuarios por rol (1: Alumno, 2: Runner)
        const resUsuarios = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE id_rol = 1) AS total_alumnos,
                COUNT(*) FILTER (WHERE id_rol = 2) AS total_runners
            FROM usuarios;
        `);

        // 3. Tienda con más ventas hoy
        let topTiendaNombre = 'Sin ventas aún';
        try {
            const resTopTienda = await pool.query(`
                SELECT t.nombre, COUNT(dp.id_pedido) AS total_ventas
                FROM detalle_pedido dp
                JOIN productos p ON dp.id_producto = p.id_producto
                JOIN tiendas t ON p.id_tienda = t.id_tienda
                JOIN pedidos ped ON dp.id_pedido = ped.id_pedido
                WHERE (ped.fecha_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date
                GROUP BY t.nombre
                ORDER BY total_ventas DESC
                LIMIT 1;
            `);
            if (resTopTienda.rows.length > 0) {
                topTiendaNombre = resTopTienda.rows[0].nombre;
            }
        } catch (e) {
            console.log("Aviso sobre Tienda Top:", e.message);
        }

        res.json({
            pedidos: resPedidos.rows[0] || {},
            usuarios: resUsuarios.rows[0] || {},
            topTienda: topTiendaNombre
        });

    } catch (err) {
        console.error('Error crítico al calcular KPIs:', err);
        res.status(500).json({ error: 'Error al consultar estadísticas' });
    }
});

// ==========================================
// MÓDULO 5 ADMIN: TIENDAS Y PRODUCTOS
// ==========================================

// 1. Obtener todas las tiendas
app.get('/api/admin/tiendas',verificarToken,verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tiendas ORDER BY id_tienda ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener tiendas:', err);
        res.status(500).json({ error: 'Error al consultar tiendas' });
    }
});

// 2. Crear una nueva tienda
app.post('/api/admin/tiendas',verificarToken,verificarAdmin, async (req, res) => {
    const { nombre, ubicacion } = req.body;

    if (!nombre || !ubicacion) {
        return res.status(400).json({ error: 'Nombre y ubicación son obligatorios.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tiendas (nombre, ubicacion) VALUES ($1, $2) RETURNING *',
            [nombre, ubicacion]
        );
        res.json({ success: true, message: 'Tienda registrada con éxito.', tienda: result.rows[0] });
    } catch (err) {
        console.error('Error al registrar tienda:', err);
        res.status(500).json({ error: 'Error al guardar la tienda' });
    }
});

app.post('/api/admin/productos',verificarToken,verificarAdmin, async (req, res) => {
    const { id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock } = req.body;
    try {
        await pool.query(
            'INSERT INTO productos (id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock || 0]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- RUTA ADMIN: Actualizar solo el stock de un producto ---
app.patch('/api/admin/productos/:id/stock',verificarToken,verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    try {
        await pool.query(
            'UPDATE productos SET stock = $1 WHERE id_producto = $2',
            [parseInt(stock) || 0, id]
        );

        res.json({ success: true, message: 'Stock actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar el stock:', error.message);
        res.status(500).json({ error: 'Error interno al actualizar el stock.' });
    }
});
// --- RUTA: Crear un Reporte / Incidencia (Usuario) ---
app.post('/api/reportes', async (req, res) => {
    const { id_pedido, id_usuario, motivo } = req.body;
    try {
        const nuevoReporte = await pool.query(
            'INSERT INTO reportes (id_pedido, id_usuario_reporta, motivo) VALUES ($1, $2, $3) RETURNING *',
            [id_pedido || null, id_usuario, motivo]
        );
        res.status(201).json({ success: true, mensaje: 'Reporte enviado con éxito', reporte: nuevoReporte.rows[0] });
    } catch (error) {
        console.error("Error al registrar reporte:", error);
        res.status(500).json({ success: false, error: 'Error al enviar el reporte' });
    }
});

// --- RUTAS DE PERFIL Y GALERÍA DE USUARIO ---

// Actualizar Datos del Perfil en PostgreSQL
app.put('/api/usuarios/perfil', async (req, res) => {
    const { id_usuario, nombre_completo, carrera, foto_perfil } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ error: 'ID de usuario requerido.' });
    }

    try {
        const fotoFinal = (foto_perfil !== undefined && foto_perfil !== null) ? foto_perfil : null;

        await pool.query(
            `UPDATE usuarios 
             SET nombre_completo = $1, 
                 carrera = $2, 
                 foto_perfil = COALESCE($3, foto_perfil)
             WHERE id_usuario = $4`,
            [nombre_completo, carrera, fotoFinal, id_usuario]
        );

        res.json({ success: true, message: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar perfil en backend:', error);
        res.status(500).json({ error: 'Error interno al actualizar perfil: ' + error.message });
    }
});

// 3. Subir Nueva Foto a la Galería
app.post('/api/usuarios/fotos', async (req, res) => {
    const { id_usuario, url_foto } = req.body;
    if (!id_usuario || !url_foto) {
        return res.status(400).json({ error: 'Usuario y foto requeridos.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO fotos_usuario (id_usuario, url_foto) VALUES ($1, $2) RETURNING *',
            [id_usuario, url_foto]
        );
        res.json({ success: true, foto: result.rows[0] });
    } catch (error) {
        console.error('Error al subir foto:', error.message);
        res.status(500).json({ error: 'Error al guardar la foto.' });
    }
});

// 4. Eliminar Foto de la Galería
app.delete('/api/usuarios/fotos/:id_foto', async (req, res) => {
    const { id_foto } = req.params;
    try {
        await pool.query('DELETE FROM fotos_usuario WHERE id_foto = $1', [id_foto]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar foto:', error.message);
        res.status(500).json({ error: 'Error al eliminar la foto.' });
    }
});
// ==========================================
// RUTAS DE RESEÑAS DE LA APLICACIÓN
// ==========================================

// 1. Guardar nueva reseña enviada por el usuario
app.post('/api/resenas-app', async (req, res) => {
    try {
        const { id_usuario, calificacion, comentario } = req.body;

        if (!id_usuario || !calificacion) {
            return res.status(400).json({ error: 'Faltan datos obligatorios.' });
        }

        await pool.query(
            'INSERT INTO resenas_app (id_usuario, calificacion, comentario) VALUES ($1, $2, $3)',
            [id_usuario, calificacion, comentario]
        );

        res.json({ success: true, message: 'Reseña guardada correctamente.' });
    } catch (err) {
        console.error('Error al guardar reseña:', err);
        res.status(500).json({ error: 'Error al registrar la reseña.' });
    }
});

// 2. Obtener todas las reseñas para la vista del Administrador
app.get('/api/admin/resenas-app',verificarToken,verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id_resena, 
                r.calificacion, 
                r.comentario, 
                r.fecha_creacion,
                u.nombre_completo, 
                u.carrera, 
                u.codigo_alumno AS codigo
            FROM resenas_app r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            ORDER BY r.fecha_creacion DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reseñas admin:', err);
        res.status(500).json({ error: 'Error al consultar las reseñas.' });
    }
});
// ==========================================
// TAREA PROGRAMADA: LIMPIEZA AUTOMÁTICA DE REGISTROS EXPIRADOS (24h)
// ==========================================
cron.schedule('0 * * * *', async () => {
    try {
        const resultado = await pool.query(
            `DELETE FROM registros_pendientes 
             WHERE fecha_creacion < NOW() - INTERVAL '24 hours'`
        );
        if (resultado.rowCount > 0) {
            console.log(`🧹 Limpieza automática: Se eliminaron ${resultado.rowCount} registros no verificados expirados.`);
        }
    } catch (error) {
        console.error("Error en la tarea de limpieza automática:", error);
    }
});

// --- RUTA ADMIN: ELIMINAR USUARIO DEFINITIVAMENTE ---
app.delete('/api/admin/usuarios/:codigo',verificarToken,verificarAdmin, async (req, res) => {
    try {
        const { codigo } = req.params;

        // 1. Obtener id_usuario
        const userRes = await pool.query('SELECT id_usuario FROM usuarios WHERE codigo_alumno = $1', [codigo]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }
        const idUsuario = userRes.rows[0].id_usuario;

        // 2. Limpiar dependencias en el orden correcto
        await pool.query('DELETE FROM chat_pedido WHERE id_remitente = $1', [idUsuario]).catch(() => {});
        await pool.query('DELETE FROM reportes WHERE id_usuario_reporta = $1', [idUsuario]).catch(() => {});
        await pool.query('DELETE FROM pedidos WHERE id_cliente = $1 OR id_runner = $1', [idUsuario]).catch(() => {});

        // 3. Eliminar usuario (fotos_usuario, detalle_pedido y chats vinculados caen por CASCADE)
        await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [idUsuario]);

        res.json({ success: true, message: `El usuario ${codigo} ha sido eliminado correctamente.` });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ success: false, error: "Error interno al eliminar el usuario." });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || port || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

