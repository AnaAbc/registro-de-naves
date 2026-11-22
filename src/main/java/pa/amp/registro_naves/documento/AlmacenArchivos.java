package pa.amp.registro_naves.documento;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Almacena los PDF fuera de static/. La ruta la genera el servidor con el id
 * de la nave y un UUID, y los servicios validan el acceso antes de leerla.
 * Cuando se usa PostgreSQL, el directorio local sirve como caché de lectura.
 */
@Component
public class AlmacenArchivos {

    private final Path raiz;
    private final JdbcTemplate db;
    private final boolean guardarEnPostgresql;

    public AlmacenArchivos(@Value("${navesitas.almacen.ruta:almacen}") String ruta,
                           @Value("${navesitas.almacen.postgresql:false}") boolean guardarEnPostgresql,
                           JdbcTemplate db) {
        this.raiz = Path.of(ruta).toAbsolutePath().normalize();
        this.guardarEnPostgresql = guardarEnPostgresql;
        this.db = db;
    }

    /** Resultado de guardar: ruta relativa para la base y hash del contenido. */
    public record Guardado(String rutaRelativa, String hashSha256, long tamanoBytes) {}

    public Guardado guardar(Long naveId, MultipartFile archivo) {
        String relativa = naveId + "/" + UUID.randomUUID() + ".pdf";
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            if (guardarEnPostgresql) {
                byte[] contenido = archivo.getBytes();
                // La clave foránea se comprueba al confirmar la transacción.
                // DocumentoService guarda los metadatos en esa misma transacción.
                db.update("INSERT INTO documento_archivo (ruta, contenido) VALUES (?, ?)", relativa, contenido);
                return new Guardado(relativa, HexFormat.of().formatHex(sha256.digest(contenido)), contenido.length);
            }

            Path destino = resolver(relativa);
            Files.createDirectories(destino.getParent());
            Path temporal = Files.createTempFile(destino.getParent(), "carga-", ".tmp");
            try {
                long tamano;
                try (InputStream entrada = new DigestInputStream(archivo.getInputStream(), sha256)) {
                    tamano = Files.copy(entrada, temporal, StandardCopyOption.REPLACE_EXISTING);
                }
                Files.move(temporal, destino, StandardCopyOption.ATOMIC_MOVE);
                return new Guardado(relativa, HexFormat.of().formatHex(sha256.digest()), tamano);
            } finally {
                Files.deleteIfExists(temporal);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo", e);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    public Path ubicar(String rutaRelativa) {
        Path destino = resolver(rutaRelativa);
        if (!guardarEnPostgresql || Files.isRegularFile(destino)) {
            return destino;
        }

        byte[] contenido = db.query("SELECT contenido FROM documento_archivo WHERE ruta = ?",
                rs -> rs.next() ? rs.getBytes("contenido") : null, rutaRelativa);
        if (contenido == null) {
            return destino;
        }

        try {
            Files.createDirectories(destino.getParent());
            Path temporal = Files.createTempFile(destino.getParent(), "descarga-", ".tmp");
            try {
                Files.write(temporal, contenido);
                Files.move(temporal, destino, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } finally {
                Files.deleteIfExists(temporal);
            }
            return destino;
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo recuperar el archivo", e);
        }
    }

    /** En PostgreSQL, la transacción revierte los metadatos y el archivo juntos. */
    public void borrarSilencioso(String rutaRelativa) {
        try {
            Files.deleteIfExists(resolver(rutaRelativa));
        } catch (IOException | RuntimeException ignorada) {
            // Un error de limpieza no debe ocultar el fallo original de la carga.
        }
    }

    private Path resolver(String rutaRelativa) {
        Path ruta = raiz.resolve(rutaRelativa).normalize();
        if (!ruta.startsWith(raiz)) {
            throw new IllegalArgumentException("Ruta fuera del almacen");
        }
        return ruta;
    }
}
