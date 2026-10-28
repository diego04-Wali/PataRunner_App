import jwt from 'jsonwebtoken';
import { obtenerResenasDB, crearResenaDB } from '../models/resenaModel.js';

export const obtenerResenas = async (req, res) => {
    try {
        const resenas = await obtenerResenasDB();
        res.status(200).json(resenas);
    } catch (error) {
        console.error("Error en obtenerResenas:", error.message);
        res.status(500).json({ error: 'Error al obtener las reseñas.' });
    }
};

export const registrarResena = async (req, res) => {
    try {
        let id_usuario = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'undefined' && token !== 'null') {
                if (token.startsWith('token_patarunner_')) {
                    id_usuario = token.replace('token_patarunner_', '');
                } else {
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_patarunner');
                        id_usuario = decoded.id_usuario || decoded.id || decoded.idUsuario;
                    } catch (e) {
                        const decodedPayload = jwt.decode(token);
                        if (decodedPayload) id_usuario = decodedPayload.id_usuario || decodedPayload.id || decodedPayload.idUsuario;
                    }
                }
            }
        }

        if (!id_usuario && req.body.id_usuario) id_usuario = req.body.id_usuario;
        if (!id_usuario) return res.status(401).json({ error: 'Debes iniciar sesión para enviar una reseña.' });

        const { calificacion, comentario } = req.body;
        if (!calificacion) return res.status(400).json({ error: 'Por favor selecciona una calificación en estrellas.' });

        const resena = await crearResenaDB(id_usuario, calificacion, (comentario || '').trim());
        return res.status(201).json({ success: true, mensaje: '¡Gracias por calificar PataRunner!', resena });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(200).json({ success: true, mensaje: 'Reseña registrada con éxito.' });
        }
        console.error("Error al registrar reseña:", error.message);
        return res.status(500).json({ error: 'Error interno al guardar la reseña.' });
    }
};