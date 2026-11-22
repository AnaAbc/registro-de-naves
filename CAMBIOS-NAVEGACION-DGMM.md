# Ajuste de navegación y acceso a la verificación de patente

- Portada: se eliminaron «Verificar patente» y «Crear cuenta» del encabezado; el registro continúa disponible desde el enlace «¿No tiene cuenta? Registrarse» de inicio de sesión. Se simplificó a un único acceso a la plataforma en el hero.
- Menús de sesión: «Verificar patente» aparece solamente en FUNCIONARIO_DGMM. AGENTE_NAVIERO, AUDITOR y ADMINISTRADOR conservan sus demás accesos.
- El verificador y su API GET `/api/verificacion/patentes/{identificador}` requieren `ROLE_FUNCIONARIO_DGMM`. El frontend incluye la cookie de sesión en la consulta.
- El QR del PDF sigue apuntando a `/verificar-patente.html#...`, pero el acceso ya **no es público**: requiere iniciar sesión como DGMM. Este cambio de política es deliberado.
- No se modificaron las migraciones, el modelo de datos, ni la generación de los PDF.
- Las pruebas automatizadas para navegación y seguridad se actualizaron a la nueva política.
