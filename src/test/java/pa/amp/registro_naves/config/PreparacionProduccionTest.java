package pa.amp.registro_naves.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.mockito.ArgumentCaptor;
import pa.amp.registro_naves.usuario.Rol;
import pa.amp.registro_naves.usuario.Usuario;
import pa.amp.registro_naves.usuario.UsuarioRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Pruebas unitarias sin acceso a PostgreSQL real. */
class PreparacionProduccionTest {

    private final UsuarioRepository repositorio = mock(UsuarioRepository.class);
    private final PasswordEncoder codificador = mock(PasswordEncoder.class);
    private final DefaultApplicationArguments argumentos = new DefaultApplicationArguments();

    @Test
    void requiereAdministradorEnPrimeraPuestaEnMarcha() {
        when(repositorio.findByCorreoIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(repositorio.existsByRolAndActivoTrue(Rol.ADMINISTRADOR)).thenReturn(false);

        assertThatThrownBy(() -> new PreparacionProduccion(repositorio, codificador, "", "")
                .run(argumentos))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_BOOTSTRAP_EMAIL");
    }

    @Test
    void deshabilitaLasCuentasDemoAunqueEstuvieranValidadas() {
        Usuario demo = new Usuario();
        demo.setCorreo("revisor@navesitas.pa");
        demo.setActivo(true);
        demo.setCorreoValidado(true);
        when(repositorio.findByCorreoIgnoreCase("revisor@navesitas.pa"))
                .thenReturn(Optional.of(demo));
        when(repositorio.existsByRolAndActivoTrue(Rol.ADMINISTRADOR)).thenReturn(true);

        new PreparacionProduccion(repositorio, codificador, "", "").run(argumentos);

        assertThat(demo.isActivo()).isFalse();
        verify(repositorio).save(demo);
    }

    @Test
    void creaAdministradorNuevoConClaveCifradaSinReutilizarLaDemo() {
        when(repositorio.findByCorreoIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(codificador.encode("UnaClaveSegura2026!Inedita"))
                .thenReturn("hash-para-test");

        new PreparacionProduccion(repositorio, codificador,
                "administracion@example.test", "UnaClaveSegura2026!Inedita")
                .run(argumentos);

        ArgumentCaptor<Usuario> capturador = ArgumentCaptor.forClass(Usuario.class);
        verify(repositorio).save(capturador.capture());
        Usuario creado = capturador.getValue();
        assertThat(creado.getCorreo()).isEqualTo("administracion@example.test");
        assertThat(creado.getRol()).isEqualTo(Rol.ADMINISTRADOR);
        assertThat(creado.getPasswordHash()).isEqualTo("hash-para-test");
        assertThat(creado.isCorreoValidado()).isTrue();
        assertThat(creado.isActivo()).isTrue();
    }

    @Test
    void rechazaAdministradorConClaveDemo() {
        assertThatThrownBy(() -> new PreparacionProduccion(repositorio, codificador,
                "administracion@example.test", "Navesitas2026*")
                .run(argumentos))
                .isInstanceOf(IllegalStateException.class);
        verify(repositorio, never()).save(any());
    }
}
