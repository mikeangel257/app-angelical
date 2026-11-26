
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==========================================
// VOZ ANGELICAL 2.0
// CONFIGURACIÓN DE FIREBASE
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyCLV005ri1RILn9cBLJmPXYvrp1WbKGWgo",
    authDomain: "voz-angelical.firebaseapp.com",
    projectId: "voz-angelical",
    storageBucket: "voz-angelical.firebasestorage.app",
    messagingSenderId: "217682121833",
    appId: "1:217682121833:web:157bca0c793d217c0e7ef8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Sistema de autenticación
const auth = getAuth(app);

// Base de datos
const db = getFirestore(app);

// Administrador autorizado
const ADMIN_UID = "TsWLtI74pTcivOzAC7gtiaaOzJx1";

// Configuración general
const APP_CONFIG = Object.freeze({
    nombre: "Voz Angelical",
    version: "2.0.0",
    moneda: "MXN",
    zonaHoraria: "America/Mexico_City",
    pagoPorSocio: 300,
    duracionPredeterminada: 60,
    margenTraslado: 30
});

// Exportar configuración
export {
    app,
    auth,
    db,
    ADMIN_UID,
    APP_CONFIG
};
