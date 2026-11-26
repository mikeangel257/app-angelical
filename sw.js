const VERSION = "2.0.1";

const PREFIJO = "voz-angelical-v2-" + self.registration.scope + "-";
const CACHE = PREFIJO + VERSION;

const ARCHIVOS = [
    "./logo.png",
    "./icon-192.png",
    "./icon-512.png",
    "./manifest.json",
    "./tema.js"
];

// INSTALACIÓN

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.addAll(ARCHIVOS);
        })
    );

});

// ACTIVACIÓN

self.addEventListener("activate", event => {

    event.waitUntil((async () => {

        const nombres = await caches.keys();

        await Promise.all(
            nombres
                .filter(nombre =>
                    nombre.startsWith(PREFIJO) &&
                    nombre !== CACHE
                )
                .map(nombre => caches.delete(nombre))
        );

        await self.clients.claim();

    })());

});

// ACTUALIZACIONES

self.addEventListener("message", event => {

    if (event.data?.tipo === "SKIP_WAITING") {
        event.waitUntil(self.skipWaiting());
    }

    if (event.data?.tipo === "OBTENER_VERSION") {

        event.source?.postMessage({
            tipo: "VERSION_APP",
            version: VERSION
        });

    }

});

// PETICIONES

self.addEventListener("fetch", event => {

    const solicitud = event.request;
    const url = new URL(solicitud.url);

    if (solicitud.method !== "GET") return;

    if (url.origin !== self.location.origin) return;

    if (!url.href.startsWith(self.registration.scope)) return;

    // LAS PÁGINAS REQUIEREN INTERNET

    if (solicitud.mode === "navigate") {

        event.respondWith(

            fetch(solicitud, {
                cache: "no-store"
            }).catch(() => {

                return new Response(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport"
                        content="width=device-width, initial-scale=1">

                        <title>Sin conexión</title>

                        <style>

                            body {
                                margin: 0;
                                min-height: 100vh;
                                display: grid;
                                place-items: center;
                                background: #F5EFE4;
                                color: #30271D;
                                font-family: Arial, sans-serif;
                                text-align: center;
                            }

                            main {
                                padding: 30px;
                            }

                            h1 {
                                color: #8A632B;
                            }

                            button {
                                background: #B48A42;
                                color: white;
                                border: none;
                                border-radius: 12px;
                                padding: 15px 25px;
                                font-size: 16px;
                                cursor: pointer;
                            }

                        </style>
                    </head>

                    <body>

                        <main>

                            <h1>Voz Angelical</h1>

                            <h2>Sin conexión a internet</h2>

                            <p>
                                Conéctate a internet para
                                continuar utilizando la aplicación.
                            </p>

                            <button onclick="location.reload()">
                                Volver a intentar
                            </button>

                        </main>

                    </body>
                    </html>
                `, {
                    status: 503,
                    headers: {
                        "Content-Type": "text/html; charset=UTF-8",
                        "Cache-Control": "no-store"
                    }
                });

            })

        );

        return;

    }

    // GUARDAR ÚNICAMENTE RECURSOS ESTÁTICOS

    const permitido = ARCHIVOS.some(archivo =>
        new URL(archivo, self.registration.scope).href === url.href
    );

    if (!permitido) return;

    event.respondWith((async () => {

        const cache = await caches.open(CACHE);

        try {

            const respuesta = await fetch(solicitud, {
                cache: "no-cache"
            });

            const politica =
                respuesta.headers.get("Cache-Control") || "";

            if (
                respuesta.ok &&
                !/no-store|private/i.test(politica)
            ) {

                try {
                    await cache.put(
                        solicitud,
                        respuesta.clone()
                    );
                } catch (error) {
                    console.warn("Error de caché:", error);
                }

            }

            return respuesta;

        } catch (error) {

            const guardado = await cache.match(solicitud);

            if (guardado) return guardado;

            return Response.error();

        }

    })());

});