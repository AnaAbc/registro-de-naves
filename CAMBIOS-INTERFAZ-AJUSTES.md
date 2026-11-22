# Navecitas · Ajustes de navegación y pantalla

Se tomó como base el ZIP `registro-de-naves-main(3).zip` y se mantuvieron las funciones del registro y patentes.

1. Inicio y pantallas de acceso: se usa alto dinámico del dispositivo para evitar desplazamiento global. En móviles se priorizan los formularios sobre la imagen decorativa. En pantallas extremadamente bajas o con zoom, se permite desplazamiento **interno** para no impedir el acceso a campos y errores.
2. Verificador de patente: se consulta `/api/auth/sesion` solo para adaptar el menú. Si hay sesión, aparece la navegación del rol y un enlace «Volver» hacia la última sección permitida de origen (o a Patentes por defecto). Si es anónimo, se mantiene el menú público. La consulta de patente `/api/verificacion/patentes/{id}` sigue usando `credentials: omit`.
3. «Mis naves»: se trasladó a `mis-naves.html` con su propio `mis-naves.js`; conserva los filtros HU-10, el conteo, las peticiones al servidor y los enlaces a expedientes. `naves.html` contiene ahora únicamente registro. Los enlaces anteriores `naves.html#mis-naves` redirigen al nuevo lugar.
4. Seguridad: el acceso a `mis-naves.html` queda restringido en Spring Security al rol AGENTE_NAVIERO. No se modificó ninguna API ni migración de base de datos.

Para probar localmente: `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build --force-recreate`. El entorno requiere Docker Desktop. No usar `down -v` si se desean conservar datos.
