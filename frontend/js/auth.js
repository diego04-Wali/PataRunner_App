// --- INTERCEPTADOR NGROK GLOBAL ---
const originalFetch = window.fetch.bind(window);
window.fetch = function(...args) {
    let [url, config] = args;
    config = config || {};
    
    // Solo agregar la cabecera si la petición va hacia Ngrok
    if (url && url.toString().includes('ngrok-free.dev')) {
        config.headers = Object.assign({ 'ngrok-skip-browser-warning': 'true' }, config.headers || {});
    }
    
    return originalFetch(url, config);
};
  // Importamos Firebase desde su CDN oficial
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
  const firebaseConfig = {
    apiKey: "AIzaSyBzWJYQIzZMkE_TzfgUtRRhh9t_ycIorIk",
    authDomain: "patarunner-1b348.firebaseapp.com",
    projectId: "patarunner-1b348",
    storageBucket: "patarunner-1b348.firebasestorage.app",
    messagingSenderId: "1052394949698",
    appId: "1:1052394949698:web:9bd4e443b00b424a4931db",
    measurementId: "G-DL5H5ZBGEH"
  };

  // Inicializamos la app
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
// --- Lógica para el botón de mostrar/ocultar contraseña ---
const btnTogglePassword = document.getElementById("btn-toggle-password");
const campoPassword = document.getElementById("password-input"); 
const iconEye = document.getElementById("icon-eye");
const iconEyeOff = document.getElementById("icon-eye-off");

if (btnTogglePassword) {
    btnTogglePassword.addEventListener("click", () => {
        if (campoPassword.type === "password") {
            campoPassword.type = "text";
            iconEye.classList.add("hidden");
            iconEyeOff.classList.remove("hidden");
        } else {
            campoPassword.type = "password";
            iconEyeOff.classList.add("hidden");
            iconEye.classList.remove("hidden");
        }
    });
}
// -----------------------------------------------------------

const loginBtn = document.getElementById("login-btn");
const screenLogin = document.getElementById("screen-login");

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        // 1. Capturamos el código (Fase 1 y 4) y forzamos mayúsculas
        const codigo = document.getElementById("login-codigo").value.trim().toUpperCase();
        const passwordInput = document.getElementById("login-password").value;

        // 2. Validaciones estrictas
        if (!codigo || !passwordInput) {
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Por favor, ingresa tu código y contraseña.',
                icon: 'warning',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // 3. Generación de correo
        let emailInput = "";

        if (codigo === "ADMIN01") {
            emailInput = "terronesdiego04@gmail.com";
        } else {
            if (!codigo.startsWith('U') || codigo.length !== 9) {
                Swal.fire({
                    title: 'Código inválido',
                    text: 'El código de alumno debe empezar con "U" y tener 8 números.',
                    icon: 'warning',
                    confirmButtonColor: '#2563eb'
                });
                return;
            }
            emailInput = `${codigo}@utp.edu.pe`;
        }

        try {
            loginBtn.textContent = "Iniciando...";
            loginBtn.disabled = true;

            // 4. Intentamos iniciar sesión con Firebase Auth
            // 🟢 CÓDIGO CORREGIDO:
// 1. Iniciar sesión en Firebase
            const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);

            // 2. Forzar la recarga de datos desde los servidores de Firebase
            await userCredential.user.reload();

            // 3. Obtener la referencia del usuario activo tras la recarga
            const user = auth.currentUser;

            // 🔍 IMPRIMIR EN CONSOLA EL ESTADO REAL
            console.log("ID de usuario:", user.uid);
            console.log("¿Email verificado en Firebase?:", user.emailVerified);

            // 4. Evaluar la verificación
            if (!user.emailVerified && codigo !== "ADMIN01") {
                Swal.fire({
                    title: 'Correo no verificado',
                    text: 'Debes verificar tu correo institucional en tu bandeja de entrada antes de ingresar a PataRunner.',
                    icon: 'warning',
                    confirmButtonColor: '#2563eb'
                });
                await auth.signOut();
                return;
            }

            // 5. ¡CLAVE!: 'true' fuerza la renovación del token con la verificación de Firebase
            const token = await user.getIdToken(true);
            sessionStorage.setItem('token', token);

            // 6. Enviamos el token al backend en Render
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            // 7. Procesamos la respuesta de la base de datos (Neon)
if (response.ok) {
    console.log("Acceso concedido:", data);

    // Guardado persistente (localStorage) y de pestaña (sessionStorage)
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    localStorage.setItem('userId', data.usuario.id_usuario);
    localStorage.setItem('isRunnerStatus', data.usuario.id_rol === 2 ? 'true' : 'false');

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
    sessionStorage.setItem('userId', data.usuario.id_usuario);
    sessionStorage.setItem('isRunnerStatus', data.usuario.id_rol === 2 ? 'true' : 'false');

                if (typeof window.aplicarEstadoRunner === 'function') {
                    window.aplicarEstadoRunner();
                }      
                if (typeof cargarMisPedidos === 'function') {
                    cargarMisPedidos();
                }

                // Ocultamos el login
                if (screenLogin) {
                    screenLogin.classList.add("hidden");
                }

                // Redirección por roles (ADMIN, RUNNER, ALUMNO)
                if (data.usuario && data.usuario.id_rol === 3) {
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
                    
                    if (typeof cargarUsuariosAdmin === 'function') {
                        cargarUsuariosAdmin();
                    }
                } else if (data.usuario && data.usuario.id_rol === 2) {
                    sessionStorage.setItem('isRunnerStatus', 'true');
                    if (typeof isRunner !== 'undefined') { isRunner = true; } 
                    
                    if (typeof window.setActiveRole === 'function') {
                        window.setActiveRole('alumno');
                    }
                    
                    const btnRunner = document.getElementById("role-btn-runner");
                    if (btnRunner) {
                        btnRunner.disabled = false;
                        btnRunner.classList.remove("opacity-50", "cursor-not-allowed");
                        btnRunner.innerHTML = "Runner";
                    }
                } else {
                    sessionStorage.setItem('isRunnerStatus', 'false');
                    if (typeof isRunner !== 'undefined') { isRunner = false; }
                    
                    const btnRunner = document.getElementById("role-btn-runner");
                    if (btnRunner) {
                        btnRunner.disabled = true;
                        btnRunner.classList.add("opacity-50", "cursor-not-allowed");
                        btnRunner.innerHTML = '<i data-lucide="lock" class="w-3 h-3"></i> Runner';
                    }
                    if (window.lucide) {
                        lucide.createIcons();
                    }
                }
            } else {
                // ⚠️ Limpiar basura en caché si el backend rechaza el acceso
    localStorage.clear();
    sessionStorage.clear();
                Swal.fire({
                    title: 'Acceso denegado',
                    text: data.error || 'Ocurrió un error al ingresar.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
            }

        } catch (error) {
            console.error("Error en Firebase:", error.code, error.message);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                Swal.fire({
                    title: 'Credenciales incorrectas',
                    text: 'Código de alumno o contraseña incorrectos.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
            } else {
                Swal.fire({
                    title: 'Error de autenticación',
                    text: 'Hubo un error al intentar ingresar. Revisa tus datos.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
            }
        } finally {
            loginBtn.textContent = "Iniciar sesión";
            loginBtn.disabled = false;
        }
    });
}

// --- 1. Botón inicial: Abre la pantalla de postulación como ventana superpuesta ---
const btnSerRunner = document.getElementById("btn-ser-runner");

if (btnSerRunner) {
    btnSerRunner.addEventListener("click", () => {
        // Ya no ocultamos el inicio. Solo mostramos la ventana flotante por encima.
        const pantallaPostular = document.getElementById("postular-runner");
        pantallaPostular.classList.remove("hidden");
        pantallaPostular.style.display = "flex";
    });
}
// --- 2. Nuevo Botón Azul: Confirma y asciende a Runner en la BD ---
const btnPostularRunner = document.getElementById("btn-postular-runner");

if (btnPostularRunner) {
    btnPostularRunner.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Error: Debes iniciar sesión primero.");
            return;
        }

        // Estado de carga inicial
        btnPostularRunner.innerText = "Postulando...";
        btnPostularRunner.disabled = true;

        try {
            const token = await user.getIdToken();

            const response = await fetch('/api/usuarios/rol', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                // 1. Éxito: Cambiamos el botón a color VERDE
                btnPostularRunner.innerText = "✓ Ya eres Runner";
                btnPostularRunner.classList.remove("bg-blue-500", "hover:bg-blue-600");
                btnPostularRunner.classList.add("bg-emerald-600");
                
                // 2. Pausa de 1.5 segundos para que veas la animación
                setTimeout(() => {
                    // Ocultamos la pantalla de postulación
                    document.getElementById("postular-runner").classList.add("hidden");
                    
                    // Activamos la lógica de insignias y cambio de pestaña de main.js
                    const btnInsignias = document.getElementById("apply-runner-btn");
                    if (btnInsignias) btnInsignias.click();
                }, 1500);

            } else {
                alert("Error: " + data.error);
                btnPostularRunner.innerText = "Postular como Runner";
                btnPostularRunner.disabled = false;
            }
        } catch (error) {
            console.error("Error conectando con el servidor:", error);
            alert("Ocurrió un error al intentar conectarse al servidor.");
            btnPostularRunner.innerText = "Postular como Runner";
            btnPostularRunner.disabled = false;
        }
    });
}
// ==========================================
// FASE 2: REGISTRO EN FIREBASE Y VERIFICACIÓN (OPCIÓN A)
// ==========================================
const btnRegister = document.getElementById('btn-register');

if (btnRegister) {
    btnRegister.addEventListener('click', async () => {
        // 1. Capturamos todos los valores del formulario
        const codigo = document.getElementById('register-codigo').value.trim();
        const nombres = document.getElementById('register-nombres').value.trim();
        const apellidos = document.getElementById('register-apellidos').value.trim();
        const carrera = document.getElementById('register-carrera').value;
        const password = document.getElementById('register-password').value;
        const terms = document.getElementById('register-terms').checked;

        // 2. Validaciones estrictas
        if (!codigo || !nombres || !apellidos || !carrera || !password) {
            alert("Por favor, completa todos los campos del formulario.");
            return;
        }

        if (!terms) {
            alert("Debes aceptar el uso de datos para continuar.");
            return;
        }

        // Expresión regular para validar formato: U + 8 números
        const formatoCodigo = /^U\d{8}$/i;
        if (!formatoCodigo.test(codigo)) {
            alert("El código de alumno debe comenzar con la letra 'U' y contener exactamente ocho dígitos.");
            return;
        }

        // 3. Generamos el correo institucional y nombre completo
        const correoInstitucional = `${codigo.toUpperCase()}@utp.edu.pe`;
        const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`;

        try {
            btnRegister.textContent = "Creando cuenta...";
            btnRegister.disabled = true;
            btnRegister.classList.add("opacity-70");

            // 4. Crear la cuenta directamente en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, correoInstitucional, password);
            const user = userCredential.user;

            // 5. Enviar correo de verificación nativo de Firebase al instante
            const actionCodeSettings = {
    url: 'https://patarunnerapp-frontend.vercel.app',
    handleCodeInApp: false
};

await sendEmailVerification(user, actionCodeSettings);
// ⚠️ AGREGAR ESTA LÍNEA: Cerramos la sesión temporal para obligar un login limpio tras verificar
            await auth.signOut();

            // 6. Guardar al usuario en PostgreSQL (Neon) con verificado = false y su firebase_uid
            const respuestaBD = await fetch('/api/usuarios/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    codigo_alumno: codigo.toUpperCase(),
                    nombre_completo: nombreCompleto,
                    carrera: carrera,
                    correo_institucional: correoInstitucional,
                    verificado: false
                })
            });

            const datosRespuesta = await respuestaBD.json();

            if (respuestaBD.ok) {
                alert(`¡Registro exitoso!\n\nHemos enviado un correo de verificación oficial a:\n${correoInstitucional}\n\nPor favor, revisa tu bandeja de entrada o spam antes de iniciar sesión.`);

                // Limpiamos el formulario y volvemos a la pantalla de Login
                document.getElementById('register-codigo').value = '';
                document.getElementById('register-nombres').value = '';
                document.getElementById('register-apellidos').value = '';
                document.getElementById('register-carrera').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-terms').checked = false;

                document.getElementById('register-form').classList.add('hidden');
                document.getElementById('login-form').classList.remove('hidden');
            } else {
                alert("Error al guardar en base de datos: " + (datosRespuesta.error || "Ocurrió un error."));
            }

        } catch (error) {
            console.error("Error en el registro de Firebase:", error);
            
            if (error.code === 'auth/email-already-in-use') {
                alert("Ya existe una cuenta asociada a este código de alumno.");
            } else if (error.code === 'auth/weak-password') {
                alert("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
            } else {
                alert("Ocurrió un error al crear la cuenta: " + error.message);
            }
        } finally {
            btnRegister.textContent = "Registrarme";
            btnRegister.disabled = false;
            btnRegister.classList.remove("opacity-70");
        }
    });
}

// Recuperación de Contraseña mediante correo institucional con Firebase Auth
window.recuperarContrasenaModal = async function() {
    const correo = prompt('Ingresa tu correo institucional UTP para enviarte un enlace de recuperación:');
    
    if (!correo || correo.trim() === '') return;

    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio.endsWith('@utp.edu.pe')) {
        alert('Por favor, ingresa un correo institucional válido (@utp.edu.pe).');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, correoLimpio);
        alert('¡Correo de recuperación enviado! Revisa tu bandeja de entrada o spam de tu correo institucional UTP para restablecer tu contraseña.');
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        if (error.code === 'auth/user-not-found') {
            alert('El correo ingresado no está registrado en PataRunner.');
        } else {
            alert('No se pudo enviar el correo de recuperación: ' + error.message);
        }
    }
};
// =================================================================
// AUTO-LOGIN: RESTAURAR SESIÓN AL REFRESCAR O NAVEGAR
// =================================================================

// 1. SINCRONIZACIÓN INMEDIATA (Ejecuta al cargar el script)
// Garantiza que sessionStorage tenga los datos antes de que main.js lea sus variables
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

// 2. RESTAURACIÓN DE INTERFAZ (Se ejecuta cuando el DOM esté listo)
document.addEventListener("DOMContentLoaded", () => {
    const usuarioGuardado = sessionStorage.getItem('usuario');
    const tokenGuardado = sessionStorage.getItem('token');

    if (usuarioGuardado && tokenGuardado) {
        try {
            const usuario = JSON.parse(usuarioGuardado);
            const screenLogin = document.getElementById("screen-login");

            // Ocultar pantalla de login
            if (screenLogin) {
                screenLogin.classList.add("hidden");
            }

            // Si es Administrador
            if (usuario.id_rol === 3) {
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
                if (typeof cargarUsuariosAdmin === 'function') {
                    cargarUsuariosAdmin();
                }
            } else {
                // Si es Alumno / Runner
                if (typeof window.aplicarEstadoRunner === 'function') {
                    window.aplicarEstadoRunner();
                }
                if (typeof cargarMisPedidos === 'function') {
                    cargarMisPedidos();
                }
                if (typeof cargarDatosPerfil === 'function') {
                    cargarDatosPerfil();
                }
            }
        } catch (e) {
            console.error("Error al restaurar sesión activa:", e);
        }
    }
});