import { 
    obtenerUsuariosAdminDB, 
    cambiarBloqueoUsuarioDB, 
    cambiarRolRunnerDB, 
    obtenerKpisAdminDB 
} from '../models/adminModel.js';

export const obtenerUsuariosAdmin = async (req, res) => {
    try {
        const usuarios = await obtenerUsuariosAdminDB();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error al obtener usuarios en admin:", error);
        res.status(500).json({ error: 'Error al consultar la base de datos.' });
    }
};

export const cambiarBloqueoUsuario = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { blocked } = req.body;
        await cambiarBloqueoUsuarioDB(codigo, blocked);
        res.status(200).json({ 
            success: true, 
            message: `Usuario ${blocked ? 'bloqueado' : 'desbloqueado'} con éxito.` 
        });
    } catch (error) {
        console.error("Error al cambiar estado de bloqueo:", error.message);
        res.status(500).json({ error: 'No se pudo actualizar el estado de bloqueo.' });
    }
};

export const cambiarRolRunner = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { isRunner } = req.body;
        await cambiarRolRunnerDB(codigo, isRunner);
        res.status(200).json({ 
            success: true, 
            message: isRunner 
                ? 'Rol actualizado a Runner correctamente.' 
                : 'Se le quitó el rol de Runner y se le restringieron futuras postulaciones.' 
        });
    } catch (error) {
        console.error("Error al actualizar rol de runner:", error.message);
        res.status(500).json({ error: 'No se pudo actualizar el rol.' });
    }
};

export const obtenerKpisAdmin = async (req, res) => {
    try {
        const kpis = await obtenerKpisAdminDB();
        res.status(200).json(kpis);
    } catch (error) {
        console.error("Error en GET /api/admin/kpis:", error.message);
        res.status(500).json({ error: 'Error al consultar métricas.' });
    }
};