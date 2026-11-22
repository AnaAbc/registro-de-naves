CREATE TABLE documento_archivo (
    ruta VARCHAR(255) PRIMARY KEY,
    contenido BYTEA NOT NULL,
    CONSTRAINT fk_documento_archivo_ruta FOREIGN KEY (ruta)
        REFERENCES documentos (ruta) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT ck_documento_archivo_tamano CHECK (octet_length(contenido) BETWEEN 5 AND 10485760)
);
