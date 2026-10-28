import { Router } from 'express';
import { obtenerHistorialCliente, crearPedido, obtenerPedidosPendientes } from '../controllers/pedidoController.js';

const router = Router();

router.get('/pedidos/historial/:id_usuario', obtenerHistorialCliente);
router.post('/pedidos', crearPedido);
router.get('/pedidos', obtenerPedidosPendientes);

export default router;