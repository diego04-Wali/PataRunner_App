import express from 'express';
import cors from 'cors';
import pool from './db.js';
import verificarToken from './auth.js';

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Ruta de prueba base
app.get('/', (req, res) => {
    res.send('Servidor de PataRunner funcionando correctamente 🚀');
});

// --- NUEVA RUTA: Registrar un Usuario ---
app.post('/api/usuarios', async (req, res) => {
    try {
        // Extraemos los datos que enviará el frontend
        const { nombre_completo, correo_institucional, telefono } = req.body;

        // 1. Validar que sea correo UTP
        if (!correo_institucional.endsWith('@utp.edu.pe')) {
            return res.status(400).json({ error: 'Por seguridad, solo se permiten correos institucionales de la UTP.' });
        }

        // 2. Guardar en la base de datos (Por defecto le asignamos el id_rol = 1 que es "Cliente")
        const nuevoUsuario = await pool.query(
            'INSERT INTO usuarios (id_rol, nombre_completo, correo_institucional, telefono) VALUES ($1, $2, $3, $4) RETURNING *',
            [1, nombre_completo, correo_institucional, telefono]
        );

        // 3. Responder con éxito
        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: nuevoUsuario.rows[0]
        });

    } catch (error) {
        console.error(error.message);
        // Error 23505 es el código interno de PostgreSQL cuando un dato UNIQUE (el correo) se repite
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este correo institucional ya está registrado en PataRunner.' });
        }
        res.status(500).json({ error: 'Error interno del servidor.' });
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
// --- RUTA: Obtener todos los Productos ---
app.get('/api/productos', async (req, res) => {
    try {
        // Consultamos toda la tabla de productos
        const todosLosProductos = await pool.query('SELECT * FROM productos');
        
        // Devolvemos la lista en formato JSON
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
app.post('/api/pedidos', async (req, res) => {
    try {
        // Ahora también esperamos recibir la descripcion y el costo aproximado
        const { id_cliente, ubicacion_entrega, tarifa_entrega, metodo_pago, descripcion_pedido, costo_aproximado, carrito } = req.body;

        // 1. Guardamos la cabecera del pedido (AHORA CON LAS NUEVAS COLUMNAS)
        const nuevoPedido = await pool.query(
            `INSERT INTO pedidos (id_cliente, ubicacion_entrega, estado, tarifa_entrega, metodo_pago, descripcion_pedido, costo_aproximado)
             VALUES ($1, $2, 'Pendiente', $3, $4, $5, $6) RETURNING *`,
            [id_cliente, ubicacion_entrega, tarifa_entrega, metodo_pago, descripcion_pedido, costo_aproximado]
        );

        const pedidoInsertado = nuevoPedido.rows[0];
        const nuevoIdPedido = pedidoInsertado.id_pedido; // Obtenemos el ID creado

        // 2. Si el frontend nos envió productos en el carrito, los guardamos uno por uno
        if (carrito && carrito.length > 0) {
            for (let item of carrito) {
                let productoIdSeguro = item.id_producto;

                // Si el ID es el de nuestro favor personalizado, lo dejamos nulo para PostgreSQL
                if (productoIdSeguro === 'favor_personalizado' || (typeof productoIdSeguro === 'string' && productoIdSeguro.startsWith('otro'))) {
                    productoIdSeguro = null;
                }

                await pool.query(
                    `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [nuevoIdPedido, productoIdSeguro, item.cantidad, item.precio_unitario, item.subtotal]
                );
            }
        }

        res.status(201).json({
            mensaje: '¡Pedido completo creado con éxito! Esperando a un Runner...',
            pedido: pedidoInsertado
        });

    } catch (error) {
        console.error("Error al guardar pedido:", error.message);
        res.status(500).json({ error: 'Error al registrar el pedido completo.' });
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
app.put('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params; 
        const { id_runner, estado } = req.body; 
        
        // 1. Actualizamos el estado y asignamos el ID del runner
        await pool.query(
            "UPDATE pedidos SET id_runner = $1, estado = $2 WHERE id_pedido = $3",
            [id_runner, estado, id]
        );
        
        // 2. Consultamos el pedido uniendo la tabla usuarios para obtener el nombre y teléfono
        const pedidoConRunner = await pool.query(`
            SELECT p.*, u.nombre_completo AS nombre_runner, u.telefono AS telefono_runner
            FROM pedidos p
            JOIN usuarios u ON p.id_runner = u.id_usuario
            WHERE p.id_pedido = $1
        `, [id]);
        
        res.status(200).json({
            mensaje: '¡Estado del pedido actualizado exitosamente!',
            pedido: pedidoConRunner.rows[0]
        });
    } catch (error) {
        console.error(error.message);
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
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            LEFT JOIN tiendas t ON pr.id_tienda = t.id_tienda
            WHERE p.estado = 'Pendiente'
            GROUP BY p.id_pedido
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
        
        // Hacemos un LEFT JOIN con usuarios para obtener el nombre del Runner (si es que ya aceptó el pedido)
        const misPedidos = await pool.query(`
            SELECT p.*, u.nombre_completo AS nombre_runner
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
        
        // Hacemos JOIN con usuarios para saber el nombre del cliente
        const entregas = await pool.query(`
            SELECT p.*, u.nombre_completo AS nombre_cliente
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

// --- RUTA: Actualizar estado de un Pedido (Ej: Aceptar o Entregar) ---
app.put('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params; // Capturamos el ID del pedido de la URL
        const { id_runner, estado } = req.body; // Capturamos los nuevos datos
        
        // Actualizamos al nuevo estado y le asignamos el ID del runner
        const pedidoActualizado = await pool.query(
            "UPDATE pedidos SET id_runner = $1, estado = $2 WHERE id_pedido = $3 RETURNING *",
            [id_runner, estado, id]
        );
        
        res.status(200).json({
            mensaje: '¡Estado del pedido actualizado exitosamente!',
            pedido: pedidoActualizado.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al actualizar el pedido.' });
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

// --- RUTA 1: Iniciar sesión y obtener Rol ---
app.post('/api/login', verificarToken, async (req, res) => {
    // Extraemos los datos que Firebase ya validó desde el frontend
const correo = req.usuarioFirebase.email.toLowerCase();
    try {
        // 1. Buscamos si el usuario ya existe en tu PostgreSQL
        let result = await pool.query('SELECT * FROM usuarios WHERE correo_institucional = $1', [correo]);

        // 2. Si no existe en la BD, rechazamos el login para que la ruta /api/registro haga su trabajo
if (result.rows.length === 0) {
    return res.status(404).json({ 
        error: 'Usuario no encontrado en la base de datos. Falta completar el registro.' 
    });
}
        // 3. Devolvemos los datos del usuario (sea recién creado o antiguo)
        const usuario = result.rows[0];
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso', usuario: usuario });

    } catch (error) {
        console.error('Error en el backend durante el login:', error);
        res.status(500).json({ error: 'Error en el servidor al procesar el usuario.' });
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

// --- RUTA 2: Activar perfil de Runner ---
app.put('/api/usuarios/activar-runner', verificarToken, async (req, res) => {
    try {
        const email = req.usuarioFirebase.email;
        
        // Actualizamos el id_rol a 2 (Runner) basado en el correo verificado
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
// --- NUEVA RUTA: Ascender de Alumno a Runner ---
app.put('/api/usuarios/rol', verificarToken, async (req, res) => {
    try {
        // Extraemos el correo del token validado por seguridad
        const correo = req.usuarioFirebase.email;
        
        // Actualizamos el rol a 2 (Runner)
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

// 1. Obtener los mensajes
app.get('/api/chat/:id_pedido', async (req, res) => {
    try {
        const { id_pedido } = req.params;
        console.log("---- GET CHAT ----");
        console.log("Buscando historial para el pedido ID:", id_pedido);
        
        const historial = await pool.query(
            "SELECT * FROM chat_pedido WHERE id_pedido = $1 ORDER BY fecha_envio ASC",
            [id_pedido]
        );
        
        console.log("Mensajes encontrados en la base de datos:", historial.rows.length);
        res.status(200).json(historial.rows);
    } catch (error) {
        console.error("Error crítico en GET /chat:", error.message);
        res.status(500).json({ error: 'Error al cargar el chat.' });
    }
});

// 2. Guardar un nuevo mensaje
app.post('/api/chat', async (req, res) => {
    try {
        console.log("---- POST CHAT ----");
        console.log("Datos exactos recibidos desde el Frontend:", req.body);
        
        const { id_pedido, id_remitente, id_rol, mensaje } = req.body;
        
        // El RETURNING * nos devuelve el mensaje recién creado para confirmar que se insertó
        const nuevoMensaje = await pool.query(
            "INSERT INTO chat_pedido (id_pedido, id_remitente, id_rol, mensaje) VALUES ($1, $2, $3, $4) RETURNING *",
            [id_pedido, id_remitente, id_rol, mensaje]
        );
        
        console.log("¡ÉXITO! Mensaje guardado en PostgreSQL:", nuevoMensaje.rows[0]);
        res.status(201).json({ mensaje: "Mensaje enviado correctamente." });
    } catch (error) {
        console.error("Error crítico en POST /chat:", error.message);
        res.status(500).json({ error: 'Error al enviar el mensaje.' });
    }
});

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

        // 2. Si sigue pendiente, actualizamos el estado a "Cancelado"
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
app.get('/api/admin/pedidos', async (req, res) => {
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
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        // Garantizar que la columna is_blocked exista en la tabla usuarios
        await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;');

        const query = `
            SELECT 
                id_usuario, 
                codigo_alumno AS codigo, 
                nombre_completo, 
                carrera, 
                id_rol, 
                COALESCE(is_blocked, false) AS is_blocked
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
app.patch('/api/admin/usuarios/:codigo/bloquear', async (req, res) => {
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

// 2. Quitar el rol de Runner (Cambia id_rol a 1 = Alumno)
app.patch('/api/admin/usuarios/:codigo/runner', async (req, res) => {
    const { codigo } = req.params;
    const { isRunner } = req.body;

    try {
        // Asignamos id_rol = 1 (Alumno) si isRunner es false
        const nuevoRol = isRunner ? 2 : 1;

        await pool.query(
            'UPDATE usuarios SET id_rol = $1 WHERE codigo_alumno = $2',
            [nuevoRol, codigo]
        );
        res.json({ success: true, message: 'Rol de usuario actualizado a Alumno correctamente.' });
    } catch (err) {
        console.error('Error al cambiar rol de Runner:', err);
        res.status(500).json({ error: 'Error interno al actualizar rol de Runner' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en el puerto ${port}`);
});

