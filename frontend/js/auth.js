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
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
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
            alert("Por favor, ingresa tu código y contraseña.");
            return;
        }

       // 3. EXCEPCIÓN VIP PARA EL ADMIN Y GENERACIÓN DE CORREO
        let emailInput = "";

        if (codigo === "ADMIN01") {
            // Si eres tú, saltamos las reglas y usamos tu correo de admin
            emailInput = "terronesdiego04@gmail.com";
        } else {
            // Si es un alumno normal, aplicamos las validaciones estrictas
            if (!codigo.startsWith('U') || codigo.length !== 9) {
                alert("El código de alumno debe empezar con 'U' y tener 8 números.");
                return;
            }
            // Generamos el correo institucional en secreto para Firebase
            emailInput = `${codigo}@utp.edu.pe`;
        }

        try {
            loginBtn.textContent = "Iniciando...";
            loginBtn.disabled = true;

            // 4. Intentamos iniciar sesión con Firebase
            const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
            const user = userCredential.user;

            // Verificamos si el correo ya fue validado en su bandeja
            if (!user.emailVerified) {
                alert("Debes verificar tu correo institucional antes de ingresar a PataRunner. Revisa tu bandeja de entrada.");
                await auth.signOut(); // Lo bloqueamos por seguridad
                return; // Detenemos todo aquí
            }

            // 5. Extraemos el token criptográfico
            const token = await user.getIdToken();
            sessionStorage.setItem('token', token);

            // 6. Tocamos la puerta de tu servidor local (Tu backend)
            const response = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/login', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            // 7. Procesamos la respuesta de tu base de datos
            if (response.ok) {
                console.log("Acceso concedido:", data);
                // Si tu variable de respuesta se llama "data":
sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
                sessionStorage.setItem('userId', data.usuario.id_usuario);
                sessionStorage.setItem('isRunnerStatus', 'false');
          if (typeof window.aplicarEstadoRunner === 'function') {
        window.aplicarEstadoRunner();
    }      
                if (typeof cargarMisPedidos === 'function') {
                    cargarMisPedidos();
                }

                // Ocultamos la pantalla de login
                if (screenLogin) {
                    screenLogin.classList.add("hidden");
                }

                // Asignamos rol de Runner si la base de datos lo indica
                if (data.usuario && data.usuario.id_rol === 2) {
                    sessionStorage.setItem('isRunnerStatus', 'true');
                    // Usamos window.isRunner si la variable está global en otro lado, sino omitimos. 
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
                    // Renderizamos el icono del candado
                    if (window.lucide) {
                        lucide.createIcons();
                    }
                }
            } else {
                alert("Acceso denegado por el servidor: " + data.error);
            }

        } catch (error) {
            console.error("Error en Firebase:", error.code, error.message);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                alert("Código de alumno o contraseña incorrectos.");
            } else {
                alert("Hubo un error al intentar ingresar. Revisa tus datos.");
            }
        } finally {
            // Restauramos el botón visualmente
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

            const response = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/usuarios/rol', {
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
// FASE 2: REGISTRO EN FIREBASE Y VERIFICACIÓN
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

        // 3. Generamos el correo institucional en secreto
        const correoInstitucional = `${codigo.toUpperCase()}@utp.edu.pe`;

        try {
            // Cambiamos el estado del botón para que el usuario sepa que está cargando
            btnRegister.textContent = "Creando cuenta...";
            btnRegister.disabled = true;
            btnRegister.classList.add("opacity-70");

            // 4. Creamos la cuenta en Firebase
            // IMPORTANTE: Asegúrate de tener importado createUserWithEmailAndPassword y sendEmailVerification al inicio de tu archivo
            const userCredential = await createUserWithEmailAndPassword(auth, correoInstitucional, password);
            
            // 5. Enviamos el correo de verificación inmediatamente
            await sendEmailVerification(userCredential.user);

           // ==========================================
            // 6. FASE 3: GUARDAR PERFIL EN POSTGRESQL
            // ==========================================
            // Obtenemos el ID único (UID) que Firebase le acaba de asignar al alumno
            const firebaseUid = userCredential.user.uid;

            try {
                // Hacemos la petición a tu servidor Node.js
                const respuestaBD = await fetch('https://unopposed-cosmetics-sudden.ngrok-free.dev/api/registro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firebase_uid: firebaseUid,
                        codigo_alumno: codigo,
                        nombres: nombres,
                        apellidos: apellidos,
                        carrera: carrera,
                        correo: correoInstitucional
                    })
                });

                if (!respuestaBD.ok) {
                    console.error("Advertencia: La cuenta se creó en Firebase, pero hubo un problema al guardarla en PostgreSQL.");
                }
            } catch (dbError) {
                console.error("No se pudo conectar con el servidor local Node.js. Asegúrate de que esté encendido.", dbError);
            }

            // 7. Éxito: Le avisamos al usuario y lo mandamos al login
            alert(`¡Cuenta creada con éxito!\n\nHemos enviado un enlace de verificación a:\n${correoInstitucional}\n\nPor favor, revisa tu bandeja de entrada (o spam) para activar tu cuenta antes de iniciar sesión.`);
            
            // Limpiamos el formulario y volvemos a la pantalla de Login
            document.getElementById('register-codigo').value = '';
            document.getElementById('register-nombres').value = '';
            document.getElementById('register-apellidos').value = '';
            document.getElementById('register-carrera').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-terms').checked = false;

            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');

        } catch (error) {
            console.error("Error en el registro de Firebase:", error);
            
            // Manejo de errores comunes de Firebase en español
            if (error.code === 'auth/email-already-in-use') {
                alert("Ya existe una cuenta asociada a este código de alumno.");
            } else if (error.code === 'auth/weak-password') {
                alert("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
            } else {
                alert("Ocurrió un error al crear la cuenta: " + error.message);
            }
        } finally {
            // Restauramos el botón a la normalidad
            btnRegister.textContent = "Registrarme";
            btnRegister.disabled = false;
            btnRegister.classList.remove("opacity-70");
        }
    });
}