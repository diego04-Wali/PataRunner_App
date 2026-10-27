# PataRunner

> **Plataforma web P2P de recados y entregas universitarias** desarrollada para la comunidad de la Universidad Tecnológica del Perú (UTP), Sede San Juan de Lurigancho.

---

## 🚀 Descripción del Proyecto
**PataRunner** es una Aplicación Web Progresiva (PWA) diseñada bajo un enfoque *mobile-first* que optimiza el tiempo de los estudiantes dentro del campus universitario. Conecta de manera colaborativa a **estudiantes solicitantes** con **estudiantes runners**, facilitando la gestión de recados, compras en cafeterías, entrega de materiales y pedidos rápidos sin perder horas de estudio ni saturar los espacios físicos.

---

## Arquitectura y Tecnologías Utilizadas

El sistema se encuentra desplegado en un entorno de producción real en la nube bajo una arquitectura distribuida:

* **Frontend (Interfaz de Usuario):**
  * HTML5, CSS3, JavaScript (Vanilla JS).
  * **Tailwind CSS** para un diseño responsivo y moderno.
  * **SweetAlert2** para alertas modales, confirmaciones interactivas y notificaciones visuales de usuario.
  * **Despliegue:** Alojado y optimizado en **Vercel**.

* **Backend (Lógica de Negocio):**
  * **Node.js** con **Express.js**.
  * Arquitectura modular organizada bajo el patrón de diseño **Modelo-Controlador (MVC)** para separar rutas, controladores y lógica transaccional.
  * **Despliegue:** En ejecución permanente en **Render**.

* **Base de Datos (Persistencia):**
  * **Neon (PostgreSQL)** como servicio de base de datos relacional en la nube administrado. Esquema optimizado con **12 tablas relacionales** (incluyendo control de usuarios, roles, tiendas, productos, pedidos, detalles, chat en tiempo real, reportes, reseñas y tablas transitorias de control OTP).

* **Seguridad, Identidad y Mensajería:**
  * **Firebase Authentication:** Gestión de cuentas, cifrado de contraseñas y emisión de tokens de seguridad (JWT).
  * **Brevo:** Infraestructura especializada para el envío de correos electrónicos transaccionales y validación por códigos de verificación (OTP de 6 dígitos) vinculados al correo personal.

---

## 📂 Estructura de la Base de Datos 
El modelo relacional en PostgreSQL está compuesto por las siguientes entidades:
1. `usuarios` (Gestión de cuentas, roles, estado y bloqueos)
2. `roles` (Definición de privilegios: Solicitante, Runner, Administrador)
3. `tiendas` (Establecimientos y cafeterías dentro o cerca del campus)
4. `productos` (Catálogo, precios, stock y disponibilidad)
5. `pedidos` (Cabecera de solicitudes, estados y tarifas de entrega)
6. `detalle_pedido` (Productos asociados a cada recado)
7. `chat_pedido` (Mensajería interna en tiempo real entre solicitante y runner)
8. `fotos_usuario` (Gestión de recursos visuales de perfil)
9. `reportes` (Control de incidencias y denuncias administrativas)
10. `resenas_app` (Valoraciones generales de la plataforma)
11. `codigos_otp` (Control transitorio para verificación de seguridad)
12. `registros_pendientes` (Almacenamiento temporal previo al alta del usuario)

---

## Roles del Sistema
* **Estudiante Solicitante (Alumno):** Puede navegar por el catálogo de tiendas, registrar pedidos, indicar puntos de entrega dentro de la sede, comunicarse mediante chat, calificar el servicio y emitir reseñas.
* **Estudiante Runner:** Visualiza la bolsa de solicitudes disponibles, acepta recados, actualiza el estado operativo del pedido y gestiona sus entregas.
* **Administrador:** Cuenta con un **Panel Web de Administración** exclusivo para gestionar catálogos, supervisar usuarios, bloquear cuentas ante incumplimientos, monitorear pedidos en curso y resolver reportes.

---

## Control de Versiones y Despliegue
* **Control de versiones:** Git y GitHub.
* **Ambientes:** 
  * Desarrollo local (`.env`, Node.js local).
  * Producción Cloud (**Vercel** + **Render** + **Neon**).

---

## 👨‍💻 Equipo de Desarrollo
Proyecto desarrollado en el marco del curso integrador de la **Universidad Tecnológica del Perú (UTP) - Sede San Juan de Lurigancho**.
* **Juan Diego Terrones Toccas** 
* **Máximo Aliaga** 
* **Jazmin Barrera** 
* **Edu Ramirez** 
