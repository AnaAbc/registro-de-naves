# Navecitas — versión de producción, Azure Container Apps

**Rama:** `AnaAbc/registro-de-naves` → `main`.
**Objetivo:** demostración pública con Spring Boot 4, Java 21, PostgreSQL 17 de Azure y documentos PDF persistentes.

Esta versión incluye una preparación de producción que **desactiva** las cuentas de
prueba de las migraciones (`agente@`, `revisor@`, `auditor@` y `admin@navesitas.pa`)
y permite crear un administrador privado. No se reescriben las migraciones ya
aplicadas y **no se modifican** los usuarios de los entornos de desarrollo/pruebas.

## 0. Antes de publicar

1. Asegurar que el código corregido está en `main`.
2. Confirmar que el PostgreSQL `pg-navecitas-s9` está operativo y su base objetivo existe.
3. Crear un usuario/contraseña privados para el administrador inicial. No utilizar
   `admin@navesitas.pa` ni ninguna contraseña conocida del repositorio.
4. Crear el recurso de almacenamiento que durará más que una réplica, por ejemplo
   un **Azure Storage Account** con un **Azure Files share**. El Storage Account,
   Azure Files, operaciones y tráfico **pueden generar cargos**: revisar su precio
   antes de crearlos. **Nunca** subir documentos reales sin un volumen persistente.
5. Preparar proveedor SMTP real con STARTTLS (el contenedor usa puerto 587).
6. Verificar reglas de firewall de PostgreSQL para la **salida** de Container Apps.
   Una regla para todas las direcciones IP de Azure es demasiado amplia para uso
   real; privilegiar una configuración de red controlada y minimizar la exposición.

## 1. Publicar imagen desde tu GitHub (sin Azure Container Registry)

En GitHub, abrir `AnaAbc/registro-de-naves` → **Actions** →
**Publicar imagen de Navecitas (manual)** → **Run workflow** → rama `main`.
El workflow primero ejecuta `./mvnw -B verify` sobre PostgreSQL 17 y los tests
JavaScript; solo si todo pasa crea y sube la imagen a GitHub Container Registry:

`ghcr.io/anaabc/registro-de-naves:latest`

Al crear el paquete GHCR por primera vez, podría aparecer como **privado**.
Abrir GitHub → perfil → Packages → `registro-de-naves` → Package settings →
Change visibility → **Public**. Así Azure puede descargarlo sin credenciales
adicionales. Si quieres mantenerlo privado, se requieren credenciales de lectura
seguras configuradas en Container Apps. **No guardar tokens en el repositorio.**

Para versiones reproducibles, también se publica la etiqueta con el SHA del
commit. Es preferible fijar ese SHA en Azure en lugar de depender de `latest`.

## 2. Crear la aplicación en Azure

En **Azure Container Apps** usar el entorno de consumo ya creado:

- Suscripción: `Azure for Students`.
- Grupo de recursos: `rg-navecitas-sprint9`.
- Aplicación: `navecitas`.
- Entorno: `env-navecitas-ncus` (o el nombre real del entorno creado).
- Región: **North Central US** (debe ser la del entorno).
- Imagen: `ghcr.io/anaabc/registro-de-naves:latest`, registro GHCR público.
- Ingreso/entrada (Ingress): **habilitado, externo, HTTP, puerto destino 8080**.
  TLS/HTTPS público lo termina Azure; Spring Boot respeta `X-Forwarded-*`.
- Mínimo de réplicas: `0`; máximo: `1` para una demo que puede tardar en despertar.
- Recursos iniciales sugeridos: **0.5 vCPU / 1 GiB**; verificar memoria real.
- Sonda HTTP de disponibilidad: `/actuator/health`, puerto 8080.

No agregar un perfil dedicado ni una red virtual únicamente para esta demo.
Los recursos de consumo y otros servicios conectados se cobran según uso y
pueden agotar créditos educativos.

## 3. Almacenamiento de documentos — imprescindible para adjuntos

En el entorno de Container Apps registrar el volumen de **Azure Files** existente.
Después, en la aplicación → Contenedores/Volúmenes, agregar un montaje con ruta:

`/mnt/navecitas`

Configurar `NAVESITAS_ALMACEN_RUTA=/mnt/navecitas/almacen`.
La ruta debe ser **escribible por UID 10001** (usuario no root del Dockerfile).
Realizar una carga, reiniciar la revisión y volver a descargar el mismo archivo
para comprobar persistencia. **No basta con declarar la ruta de la variable:**
se necesita un montaje Azure Files efectivo y permisos compatibles.

Si no puedes crear Azure Files por limitaciones de la suscripción, **no publiques
la funcionalidad de adjuntos con archivos reales**: hay que implementar un
almacenamiento alternativo persistente o limitar la demo a datos sin PDF adjunto.

## 4. Variables de entorno / Secrets

Configurar estas variables en Container Apps. Los valores sensibles deben ir en
**Secrets** y referenciarse desde Environment variables (no en GitHub ni en
capturas publicadas). **No reutilizar el archivo `.env` del desarrollo.**

| Variable | Ejemplo / instrucción |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8080` |
| `DB_URL` | `jdbc:postgresql://pg-navecitas-s9.postgres.database.azure.com:5432/BASE_REAL?sslmode=require` |
| `DB_USER` | Usuario administrador real de PostgreSQL |
| `DB_PASSWORD` | Secret de contraseña de PostgreSQL |
| `NAVESITAS_URL_BASE` | `https://URL_REAL_DE_CONTAINER_APPS` (sin `/` final) |
| `NAVESITAS_ALMACEN_RUTA` | `/mnt/navecitas/almacen` |
| `SMTP_HOST` | Host SMTP real |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASSWORD` | Secret SMTP |
| `SMTP_FROM` | Remitente permitido por el proveedor |
| `ADMIN_BOOTSTRAP_EMAIL` | Correo privado de administrador, solo primera preparación |
| `ADMIN_BOOTSTRAP_PASSWORD` | Secret de contraseña única, **16 a 72 caracteres** |

La URL JDBC usa la **base existente real** (no siempre `postgres`). Confirmar
que el servidor acepta conexiones SSL. No colocar credenciales en la URL JDBC.

**Primer inicio:** Spring Boot corre Flyway; luego la preparación de producción
inhabilita las cuatro cuentas demo y crea el administrador privado. Si faltan
`ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` y no hay administrador
activo, el inicio **fallará a propósito** para no exponer una app sin
administrador seguro. La clave se almacena cifrada con BCrypt. Si la cuenta
administradora ya existe y está activa, nunca se reemplaza su clave al reiniciar.
Tras verificar el login del nuevo admin, pueden eliminarse ambas variables de
bootstrap: la cuenta se conserva en PostgreSQL.

**Seguridad:** no permitir que la profesora use cuentas de los sprints con clave
conocida. Desde el panel de administración, crear cuentas DGMM y auditor privadas;
esos usuarios deben confirmar su correo antes de ingresar.

## 5. Verificación obligatoria

1. Confirmar en Actions que **Java y JS** terminaron correctamente.
2. Ver `/actuator/health`: código HTTP 200 y `UP`. Si indica `DOWN`, revisar
   PostgreSQL, la configuración y los registros de una ejecución controlada.
3. Abrir `/login.html` por HTTPS en un navegador incógnito.
4. Intentar ingresar con la contraseña demo: debe **rechazarse**.
5. Iniciar con el administrador privado y crear usuarios DGMM/Auditor.
6. Registrar un agente de prueba y recibir el correo real con enlace HTTPS.
7. Crear una nave y completar flujo de propietario, agente residente y revisión.
8. Subir PDF, descargarlo; reiniciar una réplica y comprobar que sigue existiendo.
9. Verificar rechazo de usuarios sin sesión y de acceso a documentos ajenos.
10. Monitorizar costos de PostgreSQL, almacenamiento y Container Apps.

**Importante:** la opción "No guardar registros" evita almacenar logs, pero
dificulta diagnosticar fallos. Para una prueba técnica se puede habilitar un
destino temporal con retención y gasto acotados.

## 6. Pruebas locales del repositorio

```powershell
# Requiere Java 21, PostgreSQL de desarrollo, y variables DB_*.
.\mvnw.cmd clean verify
node --test src/test/js/*.test.cjs
```

Si falla el pipeline de publicación, **no publicar la imagen** hasta revisar
los resultados. En particular, Java usa PostgreSQL de pruebas: nunca apuntar
`./mvnw verify` a la base de datos real de Azure.

## 7. Cómo actualizar tras un merge

Fusionar los cambios a `main`, ejecutar de nuevo el workflow manual en GitHub,
y actualizar la revisión de Azure Container Apps con la nueva etiqueta SHA.
No borrar PostgreSQL ni Azure Files. Hacer respaldos antes de nuevas migraciones.
