import { Router } from 'express';
import { 
    obtenerUsuariosAdmin, 
    cambiarBloqueoUsuario, 
    cambiarRolRunner, 
    obtenerKpisAdmin 
} from '../controllers/adminController.js';

const router = Router();

router.get('/admin/usuarios', obtenerUsuariosAdmin);
router.patch('/admin/usuarios/:codigo/bloquear', cambiarBloqueoUsuario);
router.patch('/admin/usuarios/:codigo/runner', cambiarRolRunner);
router.get('/admin/kpis', obtenerKpisAdmin);

export default router;