// --- INTERCEPTADOR NGROK GLOBAL ---
const originalFetch = window.fetch.bind(window);
window.fetch = function(...args) {
    let [url, config] = args;
    config = config || {};
    
    if (url && url.toString().includes('ngrok-free.dev')) {
        config.headers = Object.assign({ 'ngrok-skip-browser-warning': 'true' }, config.headers || {});
    }
    
    return originalFetch(url, config);
};

// --- AUTO-LOGIN: RESTAURAR SESIÓN AL REFRESCAR ---
(function sincronizarSesionInmediata() {
    const tokenPersistente = localStorage.getItem('token');
    const usuarioPersistente = localStorage.getItem('usuario');

    if (tokenPersistente && usuarioPersistente) {
        sessionStorage.setItem('token', tokenPersistente);
        sessionStorage.setItem('usuario', usuarioPersistente);
        
        const userId = localStorage.getItem('userId');
        const isRunnerStatus = localStorage.getItem('isRunnerStatus');
        if (userId) sessionStorage.setItem('userId', userId);
        if (isRunnerStatus) sessionStorage.setItem('isRunnerStatus', isRunnerStatus);
    }
})();

// --- LÓGICA AL CARGAR EL DOM ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Restaurar sesión si existe
    restaurarSesionInterfaz();

    // 2. Configurar eventos de botones de inicio/registro y OTP
    configurarEventosAuth();

    // 3. Configurar navegabilidad automática entre las 6 cajas OTP
    configurarEntradaOTP();
});

// ==========================================
// 1. LÓGICA DE INICIO DE SESIÓN
// ==========================================
function configurarEventosAuth() {
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const identificador = document.getElementById("login-codigo").value.trim();
            const passwordInput = document.getElementById("login-password").value;

            if (!identificador || !passwordInput) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Por favor, ingresa tu código de alumno, correo personal o teléfono y tu contraseña.',
                    icon: 'warning',
                    confirmButtonColor: '#2563eb'
                });
                return;
            }

            try {
                loginBtn.textContent = "Iniciando...";
                loginBtn.disabled = true;

                // Consulta directa a nuestro backend en Express/PostgreSQL
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identificador, password: passwordInput })
                });

                const data = await response.json();

                if (response.ok) {
                    guardarSesion(data.token, data.usuario);
                    aplicarPermisosRol(data.usuario);
                } else {
                    Swal.fire({
                        title: 'Acceso denegado',
                        text: data.error || 'Ocurrió un error al ingresar.',
                        icon: 'error',
                        confirmButtonColor: '#2563eb'
                    });
                }

            } catch (error) {
                console.error("Error en el login:", error);
                Swal.fire({
                    title: 'Error de servidor',
                    text: 'No se pudo conectar con el servidor. Inténtalo más tarde.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
            } finally {
                loginBtn.textContent = "Iniciar sesión";
                loginBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE REGISTRO (Paso 1: Datos + WhatsApp OTP)
    // ==========================================
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const codigo = document.getElementById('register-codigo').value.trim().toUpperCase();
            const nombres = document.getElementById('register-nombres').value.trim();
            const apellidos = document.getElementById('register-apellidos').value.trim();
            const carrera = document.getElementById('register-carrera').value;
            const correoPersonal = document.getElementById('register-correo').value.trim();
            const telefono = document.getElementById('register-telefono').value.trim();
            const password = document.getElementById('register-password').value;
            const terms = document.getElementById('register-terms').checked;

            if (!codigo || !nombres || !apellidos || !carrera || !correoPersonal || !telefono || !password) {
                Swal.fire({ title: 'Atención', text: 'Por favor, completa todos los campos.', icon: 'warning' });
                return;
            }

            if (!terms) {
                Swal.fire({ title: 'Atención', text: 'Debes aceptar los términos y el uso de datos.', icon: 'warning' });
                return;
            }

            const regexTelefono = /^9\d{8}$/;
            if (!regexTelefono.test(telefono)) {
                Swal.fire({ title: 'Teléfono inválido', text: 'Ingresa un número de celular válido de 9 dígitos que empiece con 9.', icon: 'warning' });
                return;
            }

            const nombreCompleto = `${nombres} ${apellidos}`;

            try {
                btnRegister.textContent = "Enviando código...";
                btnRegister.disabled = true;

                const respuesta = await fetch('/api/usuarios/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        codigo_alumno: codigo,
                        nombre_completo: nombreCompleto,
                        carrera: carrera,
                        correo_personal: correoPersonal,
                        telefono: telefono,
                        password: password
                    })
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    // Guardar el número en memoria para la validación del modal
                    window.telefonoEnRegistro = telefono;
                    
                    const phoneDisplay = document.getElementById('otp-display-phone');
                    if (phoneDisplay) phoneDisplay.textContent = `+51 ${telefono}`;

                    // Mostrar modal OTP
                    const modalOTP = document.getElementById('modal-otp-whatsapp');
                    if (modalOTP) modalOTP.classList.remove('hidden');

                    Swal.fire({
                        title: '¡Código enviado!',
                        text: `Hemos enviado un código de 6 dígitos a tu WhatsApp (+51 ${telefono}).`,
                        icon: 'success',
                        timer: 3000,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({ title: 'Error', text: data.error || 'No se pudo enviar el código.', icon: 'error' });
                }

            } catch (error) {
                console.error("Error al registrar:", error);
                Swal.fire({ title: 'Error', text: 'Error de conexión con el servidor.', icon: 'error' });
            } finally {
                btnRegister.textContent = "Enviar código a WhatsApp";
                btnRegister.disabled = false;
            }
        });
    }

    // Botón de Confirmación OTP
    const btnConfirmOTP = document.getElementById('btn-confirm-otp');
    if (btnConfirmOTP) {
        btnConfirmOTP.addEventListener('click', async () => {
            let codigoIngresado = "";
            document.querySelectorAll('.otp-field').forEach(input => {
                codigoIngresado += input.value.trim();
            });

            if (codigoIngresado.length !== 6) {
                Swal.fire({ title: 'Código incompleto', text: 'Ingresa los 6 dígitos que recibiste por WhatsApp.', icon: 'warning' });
                return;
            }

            try {
                btnConfirmOTP.textContent = "Validando...";
                btnConfirmOTP.disabled = true;

                const response = await fetch('/api/usuarios/verificar-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefono: window.telefonoEnRegistro,
                        codigo: codigoIngresado
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    cerrarModalOTP();
                    
                    Swal.fire({
                        title: '¡Cuenta verificada!',
                        text: 'Tu registro ha sido exitoso. Ya puedes iniciar sesión en PataRunner.',
                        icon: 'success'
                    });

                    // Limpiar campos y alternar vistas
                    document.getElementById('register-form').classList.add('hidden');
                    document.getElementById('login-form').classList.remove('hidden');

                } else {
                    Swal.fire({ title: 'Error', text: data.error || 'Código incorrecto o expirado.', icon: 'error' });
                }

            } catch (error) {
                console.error("Error al validar OTP:", error);
                Swal.fire({ title: 'Error', text: 'Ocurrió un problema al validar el código.', icon: 'error' });
            } finally {
                btnConfirmOTP.textContent = "Validar y Crear Cuenta";
                btnConfirmOTP.disabled = false;
            }
        });
    }
}

// ==========================================
// 3. AUTONAVEGACIÓN EN CAJAS DE TEXTO OTP
// ==========================================
function configurarEntradaOTP() {
    const otpFields = document.querySelectorAll('.otp-field');
    
    otpFields.forEach((field, index) => {
        field.addEventListener('keyup', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                if (index < otpFields.length - 1) {
                    otpFields[index + 1].focus();
                }
            } else if (e.key === 'Backspace') {
                if (index > 0) {
                    otpFields[index - 1].focus();
                }
            }
        });
    });
}

// ==========================================
// FUNCIONES DE SOPORTE Y NAVEGACIÓN
// ==========================================
window.cerrarModalOTP = function() {
    const modalOTP = document.getElementById('modal-otp-whatsapp');
    if (modalOTP) modalOTP.classList.add('hidden');
    document.querySelectorAll('.otp-field').forEach(input => input.value = '');
};

function guardarSesion(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('userId', usuario.id_usuario);
    localStorage.setItem('isRunnerStatus', usuario.id_rol === 2 ? 'true' : 'false');

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
    sessionStorage.setItem('userId', usuario.id_usuario);
    sessionStorage.setItem('isRunnerStatus', usuario.id_rol === 2 ? 'true' : 'false');
}

function aplicarPermisosRol(usuario) {
    const screenLogin = document.getElementById("screen-login");
    if (screenLogin) screenLogin.classList.add("hidden");

    if (usuario && usuario.id_rol === 3) {
        const bottomNav = document.getElementById('bottom-nav-bar');
        if (bottomNav) bottomNav.classList.add('hidden');
        
        const topBar = document.getElementById('role-switcher-bar');
        if (topBar) topBar.classList.add('hidden');

        document.querySelectorAll('div[id^="tab-"]').forEach(tab => tab.classList.add('hidden'));

        const tabAdmin = document.getElementById('tab-admin');
        if (tabAdmin) {
            tabAdmin.classList.remove('hidden', 'pb-24');
            tabAdmin.classList.add('pb-6');
        }
        if (typeof cargarUsuariosAdmin === 'function') cargarUsuariosAdmin();

    } else {
        if (typeof window.aplicarEstadoRunner === 'function') window.aplicarEstadoRunner();
        if (typeof cargarMisPedidos === 'function') cargarMisPedidos();
    }
}

function restaurarSesionInterfaz() {
    const usuarioGuardado = sessionStorage.getItem('usuario');
    const tokenGuardado = sessionStorage.getItem('token');

    if (usuarioGuardado && tokenGuardado) {
        try {
            const usuario = JSON.parse(usuarioGuardado);
            aplicarPermisosRol(usuario);
        } catch (e) {
            console.error("Error al restaurar sesión activa:", e);
        }
    }
}