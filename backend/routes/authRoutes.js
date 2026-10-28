import { Router } from 'express';
import { registrarUsuario, verificarOtp, login } from '../controllers/authController.js';

const router = Router();

router.post('/usuarios/registro', registrarUsuario);
router.post('/usuarios/verificar-otp', verificarOtp);
router.post('/login', login);

export default router;