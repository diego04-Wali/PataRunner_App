import { Router } from 'express';
import { obtenerProductos, crearProducto, actualizarStock, eliminarProducto } from '../controllers/productoController.js';

const router = Router();

router.get('/productos', obtenerProductos);
router.post('/admin/productos', crearProducto);
router.patch('/admin/productos/:id/stock', actualizarStock);
router.delete('/admin/productos/:id', eliminarProducto);

export default router;