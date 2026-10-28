import pool from '../config/db.js';

export const obtenerProductosDB = async () => {
    const query = `
        SELECT p.*, t.nombre AS nombre_tienda, t.ubicacion AS ubicacion_tienda
        FROM productos p
        LEFT JOIN tiendas t ON p.id_tienda = t.id_tienda
        WHERE p.disponible = true 
        ORDER BY p.id_producto ASC`;
    const result = await pool.query(query);
    return result.rows;
};

export const crearProductoDB = async (productoData) => {
    const { id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock } = productoData;
    const query = `
        INSERT INTO productos (id_tienda, nombre, precio, categoria, subcategoria, descripcion, imagen, stock, disponible) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING *`;
    const values = [id_tienda, nombre, precio, categoria || 'Snacks', subcategoria || 'General', descripcion || '', imagen || 'placeholder.jpg', stock || 10];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const actualizarStockDB = async (id_producto, stock) => {
    await pool.query('UPDATE productos SET stock = $1 WHERE id_producto = $2', [stock, id_producto]);
};

export const eliminarProductoDB = async (id_producto) => {
    await pool.query('DELETE FROM productos WHERE id_producto = $1', [id_producto]);
};