import { obtenerProductosDB, crearProductoDB, actualizarStockDB, eliminarProductoDB } from '../models/productoModel.js';

async function validarImagenProducto(imagenEntrada) {
    try {
        const entradaLimpia = imagenEntrada.toLowerCase();
        const palabrasProhibidas = ['perro', 'dog', 'gato', 'cat', 'mascota', 'pet', 'animal'];
        if (palabrasProhibidas.some(p => entradaLimpia.includes(p))) {
            return { esValida: false, motivo: 'No se permiten imágenes de animales o mascotas en el catálogo.' };
        }

        const API_USER = process.env.SIGHTENGINE_USER;
        const API_SECRET = process.env.SIGHTENGINE_SECRET;
        if (!API_USER || !API_SECRET) return { esValida: true };

        const models = 'nudity-2.0,type';
        let response;

        if (imagenEntrada.startsWith('http://') || imagenEntrada.startsWith('https://')) {
            const apiUrl = `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(imagenEntrada)}&models=${models}&api_user=${API_USER}&api_secret=${API_SECRET}`;
            response = await fetch(apiUrl);
        } else if (imagenEntrada.startsWith('data:image')) {
            const formData = new FormData();
            formData.append('media', imagenEntrada);
            formData.append('models', models);
            formData.append('api_user', API_USER);
            formData.append('api_secret', API_SECRET);
            response = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: formData });
        } else {
            return { esValida: true };
        }

        const result = await response.json();
        if (result.status === 'failure') return { esValida: true };

        if (result.nudity?.sexual_activity > 0.3 || result.nudity?.sexual_display > 0.3) {
            return { esValida: false, motivo: 'Contenido no permitido o inapropiado detectado.' };
        }

        if (result.type && result.type.illustration > 0.6) {
            return { esValida: false, motivo: 'No se permiten imágenes de animales, ilustraciones no comerciales o contenido no apto para el catálogo.' };
        }

        return { esValida: true };
    } catch (error) {
        return { esValida: true };
    }
}

export const obtenerProductos = async (req, res) => {
    try {
        const productos = await obtenerProductosDB();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos.' });
    }
};

export const crearProducto = async (req, res) => {
    try {
        const { imagen } = req.body;
        if (imagen) {
            const validacionIA = await validarImagenProducto(imagen);
            if (!validacionIA.esValida) {
                return res.status(400).json({ error: validacionIA.motivo });
            }
        }

        const producto = await crearProductoDB(req.body);
        res.status(201).json({ success: true, message: 'Producto agregado al catálogo exitosamente.', producto });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el producto.' });
    }
};

export const actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        await actualizarStockDB(id, stock);
        res.status(200).json({ success: true, message: 'Stock actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el stock.' });
    }
};

export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        await eliminarProductoDB(id);
        res.status(200).json({ success: true, message: 'Producto eliminado.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
};