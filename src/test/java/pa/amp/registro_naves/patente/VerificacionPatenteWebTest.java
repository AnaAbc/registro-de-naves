package pa.amp.registro_naves.patente;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pa.amp.registro_naves.config.SecurityConfig;
import pa.amp.registro_naves.common.RecursoNoEncontradoException;
import java.util.UUID;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers={VerificacionPatenteController.class,PatenteController.class})
@Import(SecurityConfig.class)
class VerificacionPatenteWebTest {
    @Autowired MockMvc mvc;
    @MockitoBean PatenteService servicio;
    @MockitoBean UserDetailsService usuarios;

    @Test void soloDGMMConsultaPatentesYErroresClaros() throws Exception {
        UUID otro=UUID.randomUUID();
        mvc.perform(get("/verificar-patente.html")).andExpect(status().is3xxRedirection());
        mvc.perform(get("/api/verificacion/patentes/"+otro)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/verificacion/patentes/"+otro).with(user("agente").roles("AGENTE_NAVIERO")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/verificacion/patentes/"+otro).with(user("auditor").roles("AUDITOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/verificacion/patentes/"+otro).with(user("admin").roles("ADMINISTRADOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/verificar-patente.html").with(user("agente").roles("AGENTE_NAVIERO")))
            .andExpect(status().isForbidden());
        verifyNoInteractions(servicio);
        mvc.perform(get("/verificar-patente.html").with(user("dgmm").roles("FUNCIONARIO_DGMM")))
            .andExpect(status().isOk());
        UUID token=UUID.randomUUID();
        when(servicio.verificar(token)).thenReturn(new PatenteService.Verificacion("PRUEBA-42",
            "2026-11-14T10:20:00-05:00","APROBADA","Sin vencimiento definido","Modelo académico — sin validez oficial"));
        mvc.perform(get("/api/verificacion/patentes/"+token).with(user("dgmm").roles("FUNCIONARIO_DGMM")))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control","no-store"))
            .andExpect(header().string("Referrer-Policy","no-referrer"))
            .andExpect(jsonPath("$.length()").value(5))
            .andExpect(jsonPath("$.numero").value("PRUEBA-42"))
            .andExpect(jsonPath("$.estado").value("APROBADA"))
            .andExpect(jsonPath("$.propietarios").doesNotExist())
            .andExpect(jsonPath("$.solicitante").doesNotExist())
            .andExpect(jsonPath("$.documentos").doesNotExist());
        UUID ausente=UUID.randomUUID();
        when(servicio.verificar(ausente)).thenThrow(new RecursoNoEncontradoException("Patente no encontrada."));
        mvc.perform(get("/api/verificacion/patentes/"+ausente).with(user("dgmm").roles("FUNCIONARIO_DGMM")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/verificacion/patentes/1").with(user("dgmm").roles("FUNCIONARIO_DGMM")))
            .andExpect(status().isBadRequest());
    }

    @Test void descargaSigueProtegidaYDevuelvePdfSinCache() throws Exception {
        mvc.perform(get("/api/naves/42/patente-provisional/archivo")).andExpect(status().isUnauthorized());
        verifyNoInteractions(servicio);
        byte[] bytes="%PDF-1.7\nprueba".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        when(servicio.descargarPdf(42L,"auditor")).thenReturn(new PatenteService.Archivo("PRUEBA-42.pdf",bytes,"a".repeat(64)));
        mvc.perform(get("/api/naves/42/patente-provisional/archivo").with(user("auditor")))
            .andExpect(status().isOk()).andExpect(content().contentType("application/pdf"))
            .andExpect(content().bytes(bytes)).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(header().string("X-Content-SHA256","a".repeat(64)));
    }

    @Test void abrirVerificacionNoHabilitaEmisionNiEvitaCsrf() throws Exception {
        mvc.perform(post("/api/naves/42/patente-provisional/aprobar")
            .with(user("agente")).contentType("application/json").content("{\"envioId\":1}"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/naves/42/patente-provisional/evidencias/1/archivo"))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(servicio);
    }
}
