
import { auth, ADMIN_UID } from "./firebase.js";

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ==========================================
// VOZ ANGELICAL 2.0
// SISTEMA DE AUTENTICACIÓN
// ==========================================

// Verificar administrador autorizado
export function esAdministrador(usuario) {
    return Boolean(usuario && usuario.uid === ADMIN_UID);
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

export async function iniciarSesion(
    correo,
    contrasena,
    recordar = true
) {
    await setPersistence(
        auth,
        recordar
            ? browserLocalPersistence
            : browserSessionPersistence
    );

    const credenciales = await signInWithEmailAndPassword(
        auth,
        correo.trim(),
        contrasena
    );

    const usuario = credenciales.user;

    if (!esAdministrador(usuario)) {
        await signOut(auth);

        throw new Error(
            "No tienes autorización para acceder a Voz Angelical."
        );
    }

    return usuario;
}

// ==========================================
// PROTEGER PÁGINAS ADMINISTRATIVAS
// ==========================================

export function protegerPagina() {
    return new Promise((resolve, reject) => {

        let resuelto = false;

        onAuthStateChanged(auth, async (usuario) => {

            if (!esAdministrador(usuario)) {

                try {
                    if (usuario) {
                        await signOut(auth);
                    }
                } finally {
                    window.location.replace("index.html");

                    if (!resuelto) {
                        reject(new Error("Acceso no autorizado."));
                    }
                }

                return;
            }

            if (!resuelto) {
                resuelto = true;
                resolve(usuario);
            }

        }, (error) => {
            reject(error);
        });

    });
}

// ==========================================
// VERIFICAR SESIÓN EN EL LOGIN
// ==========================================

export function verificarSesionLogin() {
    return onAuthStateChanged(auth, async (usuario) => {

        if (esAdministrador(usuario)) {
            window.location.replace("inicio.html");
        } else if (usuario) {
            await signOut(auth);
        }

    });
}

// ==========================================
// CERRAR SESIÓN
// ==========================================

export async function cerrarSesion() {
    await signOut(auth);

    window.location.replace("index.html");
}

// ==========================================
// RECUPERAR CONTRASEÑA
// ==========================================

export async function recuperarContrasena(correo) {

    if (!correo || !correo.trim()) {
        throw new Error("Ingresa tu correo electrónico.");
    }

    await sendPasswordResetEmail(
        auth,
        correo.trim()
    );
}

// ==========================================
// MENSAJES DE ERROR EN ESPAÑOL
// ==========================================

export function mensajeError(error) {

    const errores = {

        "auth/invalid-email":
            "El correo electrónico no es válido.",

        "auth/invalid-credential":
            "El correo o la contraseña son incorrectos.",

        "auth/user-not-found":
            "El correo o la contraseña son incorrectos.",

        "auth/wrong-password":
            "El correo o la contraseña son incorrectos.",

        "auth/user-disabled":
            "Esta cuenta ha sido deshabilitada.",

        "auth/too-many-requests":
            "Demasiados intentos. Inténtalo más tarde.",

        "auth/network-request-failed":
            "Verifica tu conexión a internet.",

        "auth/unauthorized-domain":
            "Este dominio no está autorizado en Firebase.",

        "auth/operation-not-allowed":
            "El método de autenticación no está habilitado.",

        "auth/weak-password":
            "La contraseña no es suficientemente segura.",

        "auth/requires-recent-login":
            "Debes iniciar sesión nuevamente."

    };

    return errores[error.code] ||
        (error.code
            ? "No se pudo completar la operación."
            : error.message) ||
        "Ha ocurrido un error inesperado.";
}

// ==========================================
// OBTENER USUARIO ACTUAL
// ==========================================

export function obtenerUsuario() {
    return auth.currentUser;
}
