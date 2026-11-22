package pa.amp.registro_naves.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pa.amp.registro_naves.usuario.Rol;
import pa.amp.registro_naves.usuario.Usuario;
import pa.amp.registro_naves.usuario.UsuarioRepository;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Solo en produccion: inhabilita cuentas sembradas para los sprints y
 * permite crear el primer administrador sin colocar secretos en Git.
 *
 * No modifica las migraciones anteriores: Flyway debe mantener sus checksums
 * y las pruebas locales siguen usando las cuentas de demostracion.
 */
@Component
@Profile("prod")
public class PreparacionProduccion implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PreparacionProduccion.class);
    private static final List<String> CORREOS_DEMO = List.of(
            "agente@navesitas.pa",
            "revisor@navesitas.pa",
            "auditor@navesitas.pa",
            "admin@navesitas.pa");
    private static final Set<String> CORREOS_RESERVADOS = Set.copyOf(CORREOS_DEMO);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder codificador;
    private final String correoInicial;
    private final String claveInicial;

    public PreparacionProduccion(
            UsuarioRepository usuarios,
            PasswordEncoder codificador,
            @Value("${ADMIN_BOOTSTRAP_EMAIL:}") String correoInicial,
            @Value("${ADMIN_BOOTSTRAP_PASSWORD:}") String claveInicial) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.correoInicial = correoInicial == null ? "" : correoInicial.trim().toLowerCase(Locale.ROOT);
        this.claveInicial = claveInicial == null ? "" : claveInicial;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Se ejecuta en cada inicio para que un restore no reactive las cuentas
        // con credenciales publicadas en las migraciones de los sprints.
        for (String correo : CORREOS_DEMO) {
            usuarios.findByCorreoIgnoreCase(correo).ifPresent(usuario -> {
                if (usuario.isActivo()) {
                    usuario.setActivo(false);
                    usuarios.save(usuario);
                }
            });
        }

        boolean correoPresente = !correoInicial.isBlank();
        boolean clavePresente = !claveInicial.isBlank();
        if (correoPresente != clavePresente) {
            throw new IllegalStateException(
                    "Configure ADMIN_BOOTSTRAP_EMAIL y ADMIN_BOOTSTRAP_PASSWORD juntos, o elimine ambos tras crear el administrador.");
        }

        if (!correoPresente) {
            if (!usuarios.existsByRolAndActivoTrue(Rol.ADMINISTRADOR)) {
                throw new IllegalStateException(
                        "No existe un administrador activo. Configure ADMIN_BOOTSTRAP_EMAIL y ADMIN_BOOTSTRAP_PASSWORD para el primer despliegue.");
            }
            log.info("Preparacion de produccion completada (administrador existente).");
            return;
        }

        if (CORREOS_RESERVADOS.contains(correoInicial)) {
            throw new IllegalStateException("El administrador inicial no debe usar correos de demostracion.");
        }
        if (correoInicial.length() > 120 ||
                !correoInicial.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalStateException("ADMIN_BOOTSTRAP_EMAIL debe ser un correo valido (hasta 120 caracteres).");
        }
        if (claveInicial.length() < 16 || claveInicial.length() > 72
                || "Navesitas2026*".equals(claveInicial)) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_PASSWORD debe tener de 16 a 72 caracteres y no ser la clave demo.");
        }

        if (usuarios.findByCorreoIgnoreCase(correoInicial).isPresent()) {
            Usuario existente = usuarios.findByCorreoIgnoreCase(correoInicial).orElseThrow();
            if (existente.getRol() != Rol.ADMINISTRADOR || !existente.isActivo()) {
                throw new IllegalStateException(
                        "El correo inicial ya pertenece a una cuenta que no es administrador activo.");
            }
            // Nunca cambiar la clave del administrador en cada reinicio.
            log.info("Preparacion de produccion completada (administrador ya provisionado).");
            return;
        }

        Usuario administrador = new Usuario();
        administrador.setCorreo(correoInicial);
        administrador.setNombreCompleto("Administracion Navecitas");
        administrador.setPasswordHash(codificador.encode(claveInicial));
        administrador.setRol(Rol.ADMINISTRADOR);
        administrador.setCorreoValidado(true);
        administrador.setActivo(true);
        usuarios.save(administrador);
        log.info("Primer administrador de produccion creado; retire las variables de bootstrap cuando confirme el acceso.");
    }
}
