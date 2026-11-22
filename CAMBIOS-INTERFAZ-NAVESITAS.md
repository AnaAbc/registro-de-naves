# Navecitas · Rediseño de navegación y simplificación de pantallas

## Resumen de cambios

- Barra superior coherente para las páginas internas, inspirada en la portada. Incluye logotipo, navegación por permisos y salida de sesión, con menú adaptativo en móviles.
- Los enlaces se eligen exclusivamente a partir del rol confirmado por `GET /api/auth/sesion`:
  - **AGENTE_NAVIERO:** Registrar nave, Mis naves, Requisitos, Patentes, Verificar patente.
  - **FUNCIONARIO_DGMM:** Bandeja de trámites, Patentes, Reportes, Verificar patente.
  - **AUDITOR:** Expedientes, Patentes, Reportes, Verificar patente.
  - **ADMINISTRADOR:** Usuarios, Verificar patente.
  - **Sin sesión:** Inicio, Verificar patente, Crear cuenta, Iniciar sesión.
- Portada: conserva diseño del hero original (buque, puente, CTA y franja de ventajas), traducido al español. Se retiran las secciones repetitivas de presentación, tarjetas, testimonios ficticios y planes de acceso.
- Registro público: el selector de rol se suprime del HTML y del cuerpo JSON. La capa de servicio ya asigna por defecto `AGENTE_NAVIERO` cuando no recibe un rol y mantiene prohibida la autoasignación de otros roles.
- Se traducen los textos del acceso, portada, menús, pie de página y ayudas visibles. Cada pie queda sin enlaces de navegación.
- Se conserva un vínculo contextual «Volver» en los expedientes y solicitudes de patente donde facilita el regreso a un expediente concreto. Los enlaces de secciones repetidos se suprimen.
- Página pública de verificación: se añade un campo para ingresar un código UUID manualmente, además de admitir enlaces con `#UUID` (QR); se mantienen consultas anónimas sin cookies y sin caché.

## Archivos principales

- `src/main/resources/static/index.html`: simplificación de la portada.
- `src/main/resources/static/*.html`: cabecera, pie y traducción de textos.
- `src/main/resources/static/css/navegacion.css`: nueva capa de estilos de navegación.
- `src/main/resources/static/js/navegacion.js`: navegación por rol y control del menú accesible.
- `src/main/resources/static/js/menu-movil.js`: etiquetas en español.
- `src/main/resources/static/js/verificar-patente.js`: consulta manual y mediante QR.
- `src/test/js/navegacion.test.cjs`: pruebas del menú por rol y móvil.
- `src/test/js/usabilidad.test.cjs`: verificación del registro sin selector de rol.

## Alcance y seguridad

Los permisos y el backend no se han alterado: **ocultar un enlace no concede ni revoca acceso**; Spring Security continúa validando autorizaciones en servidor. Se conservaron identificadores, rutas de la API, formularios, validaciones y nombres de campos funcionales, salvo el control de rol público redundante.

## Verificación realizada

- `node --test src/test/js/*.test.cjs`: 41/41 pruebas JavaScript aprobadas.
- Comprobación estructural de 12 páginas: sin IDs duplicados, sin navegación en pies, y rutas estáticas locales presentes.
- Verificación visual en navegadores sin conexión a backend: portada, login, registro, menús de agente/DGMM/auditor y vista móvil; no hubo desbordamiento horizontal.
- **No se ejecutaron las pruebas de Java ni una prueba integral con PostgreSQL/SMTP en este entorno.** Es necesario hacer la validación local completa al levantar Docker.

## Cómo aplicarlo en Windows

1. Descomprime el ZIP en una carpeta nueva, por ejemplo `Navecitas-Interfaz-Actualizada`.
2. Si tu configuración local anterior funciona, conserva tu `.env` **privado** y cópialo a la nueva carpeta. El ZIP no incluye ese archivo por seguridad; sí incluye `.env.example` y `docker-compose.local.yml`.
3. Abre la carpeta del proyecto en Visual Studio Code y asegúrate de que Docker Desktop esté iniciado.
4. Ejecuta desde la raíz del proyecto:

   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build --force-recreate
   ```

5. Visita `http://localhost:8080/`, `http://localhost:8080/login.html` y `http://localhost:8025/`.
6. Prueba una cuenta de cada rol y verifica en particular que el menú muestre solo sus secciones; recorre registro, documentos, patentes, reportes y verificación.
7. Ejecuta las pruebas JavaScript con el servicio disponible del compose:

   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.local.yml run --rm pruebas-js
   ```

8. Para ejecutar la suite Java en una base de pruebas separada:

   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.local.yml run --rm pruebas-java
   ```

Evita `docker compose down -v` si quieres conservar las bases de datos y archivos locales de Docker.
