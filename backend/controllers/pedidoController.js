import { obtenerHistorialClienteDB, crearPedidoDB, obtenerPedidosPendientesDB } from '../models/pedidoModel.js';

export const obtenerHistorialCliente = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const historial = await obtenerHistorialClienteDB(id_usuario);
        res.json(historial);
    } catch (error) {
        console.error("Error al cargar historial:", error);
        res.status(500).json({ error: "Error al cargar el historial" });
    }
};

export const crearPedido = async (req, res) => {
    try {
        const idPedido = await crearPedidoDB(req.body);
        res.status(201).json({ ok: true, id_pedido: idPedido, mensaje: 'Pedido registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar pedido:', error.message);
        res.status(500).json({ error: 'Error al registrar el pedido: ' + error.message });
    }
};

export const obtenerPedidosPendientes = async (req, res) => {
    try {
        const pedidos = await obtenerPedidosPendientesDB();
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Error al obtener pedidos:", error.message);
        res.status(500).json({ error: 'Error al obtener los pedidos.' });
    }
};