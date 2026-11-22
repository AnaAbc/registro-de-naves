# Navecitas · versión móvil responsive (2026)

Esta entrega parte del ZIP renovado anterior y conserva la fotografía del buque y la estética de `design.md`.
Se adaptaron **las 12 páginas HTML** tanto para teléfonos como para tabletas sin cambiar la lógica del negocio.

## Archivos agregados

- `src/main/resources/static/css/responsive.css`: estilos incrementales para móvil/tableta, separados del CSS del proyecto.
- `src/main/resources/static/js/menu-movil.js`: menú accesible de la portada para móvil, con cierre por Escape, selección o clic externo.

## Ajustes principales

- Portada: una barra compacta con menú desplegable, hero ajustado, botones cómodos al tacto, tarjetas apiladas, secciones y pie responsivos.
- Iniciar sesión / Crear cuenta: imagen conservada en cabecera, panel con difuminado, campos y acciones de ancho completo en celular.
- Registro / Expediente / Patentes / Bandeja / Reportes / Administración / Guía: formularios a una columna, etiquetas legibles, navegación de migas que se ajusta, botones táctiles, tablas con desplazamiento horizontal interno o apiladas según la estructura original.
- Tabletas: tarjetas informativas distribuidas en dos columnas donde corresponde; formularios de acceso con columnas proporcionadas.
- Compatible con `prefers-reduced-motion` y áreas seguras de pantalla.

## Pantallas de referencia

`index.html`, `login.html`, `registro-usuario.html`, `naves.html`, `expediente.html`, `bandeja.html`, `reportes.html`, `guia-requisitos.html`, `patentes.html`, `patente-provisional.html`, `verificar-patente.html`, `admin-usuarios.html`.

## Levantar el proyecto

Requiere Java 21, la configuración de base de datos del proyecto y el Maven wrapper incluido.

```bash
./mvnw spring-boot:run
```

Abre `http://localhost:8080/`. No abrir las páginas HTML directamente en modo archivo local, pues los recursos usan rutas absolutas.

## Validación

- Navegación móvil probada con apertura, cierre por Escape y visibilidad del menú en escritorio.
- Verificación de que no hay desbordamiento horizontal de página en tamaños de teléfono y tableta probados.
- `node --test src/test/js/*.test.cjs`: 37 pruebas correctas, 0 fallidas.
- Los flujos completos de extremo a extremo requieren ejecutar Spring Boot, base de datos y usuarios de prueba.

## Alcance

La implementación modifica únicamente HTML de la portada para la navegación, enlaces de estilo en HTML de todas las pantallas y dos archivos nuevos de presentación/navegación. No altera endpoints, formularios, controladores, entidades, pruebas ni el JavaScript original. Es recomendable validar los recorridos completos con el backend y los perfiles de usuario reales antes de desplegar en producción.
