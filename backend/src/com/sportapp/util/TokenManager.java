package com.sportapp.util;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manejador de sesiones por token, en memoria.
 *
 * No es JWT (no hay firma criptográfica ni librería de Spring Security),
 * pero cumple la misma función práctica para este proyecto: al iniciar
 * sesión se genera un token aleatorio que identifica al cliente, y ese
 * token se debe enviar en cada petición protegida (header Authorization).
 *
 * Ventaja frente a "confiar en lo que mande el frontend": el rol y el
 * id_cliente quedan guardados en el SERVIDOR, asociados al token. Un
 * usuario no puede simplemente inventarse un rol "Administrador" en
 * Postman, porque el servidor solo confía en lo que hay en este mapa,
 * no en lo que venga en el body de la petición.
 *
 * Nota: al reiniciar el servidor, todas las sesiones se pierden (viven
 * en memoria). Para un proyecto académico es suficiente; en producción
 * esto se reemplazaría por JWT firmado o por sesiones en base de datos/Redis.
 */
public class TokenManager {

    public static class Sesion {
        public final int idClientes;
        public final String nombre;
        public final String correo;
        public final int idRol;
        public final long creadoEn;

        public Sesion(int idClientes, String nombre, String correo, int idRol) {
            this.idClientes = idClientes;
            this.nombre = nombre;
            this.correo = correo;
            this.idRol = idRol;
            this.creadoEn = System.currentTimeMillis();
        }
    }

    private static final Map<String, Sesion> SESIONES = new ConcurrentHashMap<>();
    private static final long DURACION_TOKEN_MS = 4 * 60 * 60 * 1000L; // 4 horas

    public static String crearSesion(int idClientes, String nombre, String correo, int idRol) {
        String token = UUID.randomUUID().toString();
        SESIONES.put(token, new Sesion(idClientes, nombre, correo, idRol));
        return token;
    }

    /** Devuelve la sesión asociada al token, o null si no existe o ya expiró. */
    public static Sesion validar(String token) {
        if (token == null || token.isEmpty()) return null;
        Sesion s = SESIONES.get(token);
        if (s == null) return null;
        if (System.currentTimeMillis() - s.creadoEn > DURACION_TOKEN_MS) {
            SESIONES.remove(token);
            return null;
        }
        return s;
    }

    public static void cerrarSesion(String token) {
        if (token != null) SESIONES.remove(token);
    }

    /** Extrae el token del header "Authorization: Bearer <token>". */
    public static String extraerToken(String headerAuthorization) {
        if (headerAuthorization == null) return null;
        if (headerAuthorization.startsWith("Bearer ")) {
            return headerAuthorization.substring(7).trim();
        }
        return headerAuthorization.trim();
    }
}
