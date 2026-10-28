import { Router } from 'express';
import { obtenerResenas, registrarResena } from '../controllers/resenaController.js';

const router = Router();

router.get('/admin/resenas-app', obtenerResenas);
router.post('/resenas-app', registrarResena);

export default router;