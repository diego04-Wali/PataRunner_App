import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

// 1. Cargamos las credenciales leyendo el archivo JSON 
const serviceAccount = JSON.parse(fs.readFileSync(new URL('./firebase-key.json', import.meta.url)));

// 2. Inicializamos Firebase Admin SDK con la nueva sintaxis modular
initializeApp({
  credential: cert(serviceAccount)
});

// 3. Creamos el Middleware de seguridad
const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Usamos getAuth() en lugar del antiguo admin.auth()
        const decodedToken = await getAuth().verifyIdToken(token);

        // --- CÓDIGO DE SEGURIDAD VIP (BACKEND) ---
        if (!decodedToken.email.endsWith('@utp.edu.pe') && decodedToken.email !== 'terronesdiego04@gmail.com') {
            return res.status(403).json({ error: 'Por seguridad, solo se permiten correos institucionales de la UTP.' });
        }
        // -----------------------------------------

        req.usuarioFirebase = decodedToken;
        next();
    } catch (error) {
        console.error('Error verificando token de Firebase:', error.message);
        res.status(403).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};

export default verificarToken;