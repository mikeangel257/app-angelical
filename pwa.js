(function () {

    "use strict";

    const VERSION = "2.0.1";

    let eventoInstalacion = null;
    let registroSW = null;
    let actualizacionDisponible = false;
    let actualizando = false;
    let recargando = false;

    // DETECTAR DISPOSITIVO

    function esIOS() {

        return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
            (
                navigator.platform === "MacIntel" &&
                navigator.maxTouchPoints > 1
            );

    }

    function estaInstalada() {

        return window.matchMedia(
            "(display-mode: standalone)"
        ).matches || navigator.standalone === true;

    }

    // NOTIFICACIONES

    function notificar(texto) {

        let aviso = document.getElementById("avisoPWA");

        if (!aviso) {

            aviso = document.createElement("div");

            aviso.id = "avisoPWA";

            aviso.setAttribute("role", "status");

            aviso.style.cssText = `
                position:fixed;
                bottom:calc(95px + env(safe-area-inset-bottom));
                left:50%;
                transform:translateX(-50%);
                width:max-content;
                max-width:90%;
                padding:15px 22px;
                background:#30271D;
                color:#FFFFFF;
                border:1px solid #B48A42;
                border-radius:15px;
                font-size:13px;
                text-align:center;
                box-shadow:0 8px 25px rgba(0,0,0,.20);
                z-index:99999;
            `;

            document.body.appendChild(aviso);

        }

        aviso.textContent = texto;
        aviso.hidden = false;

        clearTimeout(notificar.temporizador);

        notificar.temporizador = setTimeout(() => {

            aviso.hidden = true;

        }, 4500);

    }

    // BOTONES DE INSTALACIÓN Y ACTUALIZACIÓN

    function actualizarBotones() {

        document.querySelectorAll(
            "#btnInstalar, [data-instalar-app]"
        ).forEach(boton => {

            boton.hidden = estaInstalada() ||
                (!eventoInstalacion && !esIOS());

        });

        document.querySelectorAll(
            "[data-actualizar-app]"
        ).forEach(boton => {

            boton.hidden = !actualizacionDisponible;
            boton.disabled = actualizando;

        });

    }

    // INSTALAR APLICACIÓN

    window.addEventListener(
        "beforeinstallprompt",
        evento => {

            evento.preventDefault();

            eventoInstalacion = evento;

            actualizarBotones();

        }
    );

    async function instalarApp() {

        if (estaInstalada()) {

            notificar("Voz Angelical ya está instalada.");

            return;

        }

        if (eventoInstalacion) {

            try {

                const solicitud = eventoInstalacion;

                eventoInstalacion = null;

                await solicitud.prompt();

                const resultado = await solicitud.userChoice;

                if (resultado.outcome === "accepted") {

                    notificar("Instalación aceptada.");

                }

            } catch (error) {

                notificar("No se pudo iniciar la instalación.");

            }

            actualizarBotones();

            return;

        }

        if (esIOS()) {

            alert(
                "Para instalar Voz Angelical en tu iPhone:\n\n" +
                "1. Abre la aplicación en Safari.\n" +
                "2. Presiona Compartir.\n" +
                "3. Selecciona Agregar a inicio.\n" +
                "4. Presiona Agregar."
            );

            return;

        }

        notificar(
            "Utiliza la opción Instalar aplicación de tu navegador."
        );

    }

    window.addEventListener("appinstalled", () => {

        eventoInstalacion = null;

        actualizarBotones();

        notificar("Voz Angelical instalada correctamente.");

    });

    // DETECTAR ACTUALIZACIONES

    function anunciarActualizacion() {

        if (actualizacionDisponible) return;

        actualizacionDisponible = true;

        actualizarBotones();

        notificar(
            "Hay una nueva versión de Voz Angelical disponible."
        );

        window.dispatchEvent(
            new CustomEvent("actualizacionDisponible")
        );

    }

    function observarRegistro(registro) {

        if (
            registro.waiting &&
            navigator.serviceWorker.controller
        ) {

            anunciarActualizacion();

        }

        registro.addEventListener("updatefound", () => {

            const trabajador = registro.installing;

            if (!trabajador) return;

            trabajador.addEventListener("statechange", () => {

                if (
                    trabajador.state === "installed" &&
                    navigator.serviceWorker.controller
                ) {

                    anunciarActualizacion();

                }

            });

        });

    }

    // REGISTRAR SERVICE WORKER

    async function registrarServiceWorker() {

        if (!("serviceWorker" in navigator)) return;

        try {

            registroSW = await navigator.serviceWorker.register(
                "./sw.js",
                {
                    scope: "./",
                    updateViaCache: "none"
                }
            );

            observarRegistro(registroSW);

            if (navigator.onLine) {

                registroSW.update().catch(() => {});

            }

        } catch (error) {

            console.warn(
                "No se pudo registrar el Service Worker:",
                error
            );

        }

    }

    // APLICAR ACTUALIZACIÓN

    async function actualizarApp() {

        if (actualizando) return;

        if (!navigator.onLine) {

            notificar("Necesitas conexión a internet.");

            return;

        }

        if (!registroSW) {

            notificar("El sistema de actualizaciones no está disponible.");

            return;

        }

        if (!registroSW.waiting) {

            try {

                await registroSW.update();

            } catch (error) {

                notificar("No se pudieron buscar actualizaciones.");

                return;

            }

        }

        if (!registroSW.waiting) {

            if (registroSW.installing) {

                notificar("La actualización se está preparando.");

            } else {

                notificar("No hay actualizaciones pendientes.");

            }

            return;

        }

        const confirmar = window.confirm(

            "Hay una actualización disponible.\n\n" +
            "Guarda cualquier cambio pendiente antes de continuar.\n\n" +
            "¿Deseas actualizar Voz Angelical ahora?"

        );

        if (!confirmar) return;

        actualizando = true;

        actualizarBotones();

        notificar("Actualizando Voz Angelical...");

        registroSW.waiting.postMessage({

            tipo: "SKIP_WAITING"

        });

        setTimeout(() => {

            if (!recargando && actualizando) {

                actualizando = false;

                actualizarBotones();

                notificar(
                    "No se confirmó la actualización. Revisa tu conexión."
                );

            }

        }, 15000);

    }

    // RECARGAR CUANDO LA NUEVA VERSIÓN ESTÉ ACTIVA

    if ("serviceWorker" in navigator) {

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {

                if (actualizando && !recargando) {

                    recargando = true;

                    window.location.reload();

                } else {

                    actualizacionDisponible = false;

                    actualizarBotones();

                    notificar(
                        "La versión cambió. Guarda tus cambios y recarga."
                    );

                }

            }
        );

    }

    // ESTADO DE CONEXIÓN

    function actualizarConexion() {

        const conectado = navigator.onLine;

        document.querySelectorAll(
            "[data-estado-conexion]"
        ).forEach(elemento => {

            elemento.textContent = conectado
                ? "Red disponible"
                : "Sin conexión";

        });

        document.querySelectorAll(
            "[data-punto-conexion]"
        ).forEach(elemento => {

            elemento.style.backgroundColor = conectado
                ? "#328653"
                : "#C74D4D";

        });

        window.dispatchEvent(

            new CustomEvent("conexionCambiada", {

                detail: {

                    conectado: conectado

                }

            })

        );

    }

    window.addEventListener("online", () => {

        actualizarConexion();

        notificar("Conexión de red recuperada.");

        if (registroSW) {

            registroSW.update().catch(() => {});

        }

    });

    window.addEventListener("offline", () => {

        actualizarConexion();

        notificar("Sin conexión a internet.");

    });

    // EVENTOS DE BOTONES

    document.addEventListener("click", evento => {

        if (
            evento.target.closest(
                "#btnInstalar, [data-instalar-app]"
            )
        ) {

            evento.preventDefault();

            instalarApp();

        }

        if (
            evento.target.closest(
                "[data-actualizar-app]"
            )
        ) {

            evento.preventDefault();

            actualizarApp();

        }

    });

    // FUNCIONES DISPONIBLES PARA TODA LA APLICACIÓN

    window.VozAngelicalPWA = Object.freeze({

        instalar: instalarApp,

        actualizar: actualizarApp,

        estaInstalada: estaInstalada,

        esIOS: esIOS,

        conectado: () => navigator.onLine,

        hayActualizacion: () => actualizacionDisponible,

        version: VERSION

    });

    // INICIAR SISTEMA

    function iniciar() {

        actualizarBotones();

        actualizarConexion();

        registrarServiceWorker();

    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );

    } else {

        iniciar();

    }

})();