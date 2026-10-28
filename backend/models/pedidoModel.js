import pool from '../config/db.js';

export const obtenerHistorialClienteDB = async (id_usuario) => {
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
        ORDER BY p.fecha_pedido DESC`;
    const result = await pool.query(query, [id_usuario]);
    return result.rows;
};

export const crearPedidoDB = async (datosPedido) => {
    const { id_cliente, direccion_entrega, ubicacion_entrega, tarifa_entrega, metodo_pago, descripcion_pedido, costo_aproximado, total, carrito } = datosPedido;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const ubicacionFinal = ubicacion_entrega || direccion_entrega || 'No especificada';
        const tarifaFinal = tarifa_entrega || 0;
        const metodoPagoFinal = metodo_pago || 'Efectivo';
        const costoAproxFinal = costo_aproximado || total || 0;

        const resPedido = await client.query(
            `INSERT INTO pedidos (id_cliente, ubicacion_entrega, tarifa_entrega, metodo_pago, descripcion_pedido, costo_aproximado, estado, fecha_pedido)
             VALUES ($1, $2, $3, $4, $5, $6, 'Pendiente', NOW()) RETURNING id_pedido`,
            [id_cliente, ubicacionFinal, tarifaFinal, metodoPagoFinal, descripcion_pedido || null, costoAproxFinal]
        );

        const idPedido = resPedido.rows[0].id_pedido;

        if (carrito && Array.isArray(carrito)) {
            for (const item of carrito) {
                const precioUnitario = item.precio_unitario || item.precio || 0;
                const subtotal = item.subtotal || (precioUnitario * item.cantidad);
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
        return idPedido;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const obtenerPedidosPendientesDB = async () => {
    const query = `
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
        ORDER BY p.id_pedido DESC`;
    const result = await pool.query(query);
    return result.rows;
};