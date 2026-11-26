
// ==========================================
// VOZ ANGELICAL 2.0
// SISTEMA DE PERSONALIZACIÓN DE TEMA
// ==========================================

(function () {

    "use strict";

    const CLAVE_TEMA = "vozAngelicalTema";

    const TEMAS_VALIDOS = [
        "claro",
        "oscuro",
        "sistema"
    ];

    const preferenciaSistema = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

    // ======================================
    // OBTENER TEMA GUARDADO
    // ======================================

    function obtenerTema() {

        try {

            const tema = localStorage.getItem(CLAVE_TEMA);

            return TEMAS_VALIDOS.includes(tema)
                ? tema
                : "sistema";

        } catch {

            return "sistema";

        }

    }

    let temaActual = obtenerTema();

    // ======================================
    // DETERMINAR TEMA VISUAL
    // ======================================

    function obtenerTemaEfectivo() {

        if (temaActual === "sistema") {

            return preferenciaSistema.matches
                ? "oscuro"
                : "claro";

        }

        return temaActual;

    }

    // ======================================
    // APLICAR TEMA
    // ======================================

    function aplicarTema() {

        const temaEfectivo = obtenerTemaEfectivo();

        const oscuro = temaEfectivo === "oscuro";

        document.documentElement.setAttribute(
            "data-tema",
            temaEfectivo
        );

        document.documentElement.setAttribute(
            "data-bs-theme",
            oscuro ? "dark" : "light"
        );

        document.documentElement.style.colorScheme =
            oscuro ? "dark" : "light";

        const metaColor = document.querySelector(
            'meta[name="theme-color"]'
        );

        if (metaColor) {

            metaColor.setAttribute(
                "content",
                oscuro ? "#171614" : "#F5EFE4"
            );

        }

        actualizarControles();

        window.dispatchEvent(

            new CustomEvent("temaCambiado", {

                detail: {

                    preferencia: temaActual,

                    tema: temaEfectivo

                }

            })

        );

    }

    // ======================================
    // GUARDAR PREFERENCIA
    // ======================================

    function cambiarTema(tema) {

        if (!TEMAS_VALIDOS.includes(tema)) {

            return false;

        }

        temaActual = tema;

        try {

            localStorage.setItem(
                CLAVE_TEMA,
                tema
            );

        } catch (error) {

            console.warn(
                "No se pudo guardar la preferencia.",
                error
            );

        }

        aplicarTema();

        return true;

    }

    // ======================================
    // ALTERNAR ENTRE CLARO Y OSCURO
    // ======================================

    function alternarTema() {

        cambiarTema(

            obtenerTemaEfectivo() === "oscuro"

                ? "claro"

                : "oscuro"

        );

    }

    // ======================================
    // ACTUALIZAR CONTROLES VISUALES
    // ======================================

    function actualizarControles() {

        document.querySelectorAll(
            "[data-elegir-tema]"
        ).forEach(boton => {

            const seleccionado =

                boton.dataset.elegirTema === temaActual;

            boton.classList.toggle(
                "activo",
                seleccionado
            );

            boton.setAttribute(
                "aria-pressed",
                String(seleccionado)
            );

        });

        document.querySelectorAll(
            "[data-icono-tema]"
        ).forEach(icono => {

            icono.className =

                obtenerTemaEfectivo() === "oscuro"

                    ? "bi bi-sun"

                    : "bi bi-moon-stars";

        });

        document.querySelectorAll(
            "[data-texto-tema]"
        ).forEach(elemento => {

            const nombres = {

                claro: "Modo claro",

                oscuro: "Modo oscuro",

                sistema: "Modo automático"

            };

            elemento.textContent = nombres[temaActual];

        });

    }

    // ======================================
    // CONTROL DE BOTONES
    // ======================================

    document.addEventListener("click", evento => {

        const botonTema = evento.target.closest(
            "[data-elegir-tema]"
        );

        if (botonTema) {

            cambiarTema(
                botonTema.dataset.elegirTema
            );

            return;

        }

        const botonAlternar = evento.target.closest(
            "[data-alternar-tema]"
        );

        if (botonAlternar) {

            alternarTema();

        }

    });

    // ======================================
    // DETECTAR CAMBIOS DEL SISTEMA
    // ======================================

    preferenciaSistema.addEventListener(
        "change",
        () => {

            if (temaActual === "sistema") {

                aplicarTema();

            }

        }
    );

    // ======================================
    // SINCRONIZAR ENTRE PESTAÑAS
    // ======================================

    window.addEventListener("storage", evento => {

        if (
            evento.key === CLAVE_TEMA ||
            evento.key === null
        ) {

            temaActual = obtenerTema();

            aplicarTema();

        }

    });

    // ======================================
    // FUNCIONES GLOBALES
    // ======================================

    window.VozAngelicalTema = Object.freeze({

        cambiar: cambiarTema,

        alternar: alternarTema,

        obtener: () => temaActual,

        obtenerEfectivo: obtenerTemaEfectivo,

        aplicar: aplicarTema

    });

    // ======================================
    // INICIALIZACIÓN
    // ======================================

    aplicarTema();

    document.addEventListener(
        "DOMContentLoaded",
        aplicarTema
    );

})();
