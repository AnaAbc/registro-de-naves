# Publicar Navecitas desde `AnaAbc/registro-de-naves`

**Guía vigente:** [DESPLIEGUE-AZURE-CONTAINER-APPS.md](DESPLIEGUE-AZURE-CONTAINER-APPS.md).

La versión oficial para publicar es la rama **`main`** del repositorio de AnaAbc.
El despliegue de referencia usa **Azure Container Apps (Consumption)**,
**PostgreSQL en Azure**, **GitHub Container Registry** y un volumen persistente
para documentos PDF. No usar cuentas demo ni contraseñas del repositorio.

La guía anterior de Render y de la rama `sprint-8` se conserva únicamente como
referencia histórica en [PUBLICAR-EN-WEB-RENDER-HISTORICO.md](PUBLICAR-EN-WEB-RENDER-HISTORICO.md):
**no corresponde al despliegue actual**.

## Orden recomendado

1. Revisar y fusionar en `main` la preparación de producción.
2. Ejecutar las pruebas Java y JS mediante GitHub Actions.
3. Publicar la imagen desde el workflow manual `Publicar imagen de Navecitas`.
4. Completar configuración en Azure (volumen, secretos, PostgreSQL, SMTP).
5. Activar el ingreso externo HTTPS y probar todo el flujo.

Consultar la guía vigente para nombres de variables y advertencias de costos.
