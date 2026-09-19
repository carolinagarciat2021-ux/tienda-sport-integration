package com.sportapp.main;

import com.sportapp.dao.ClienteDAO;
import com.sportapp.model.Cliente;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import com.sportapp.dao.ProductoDAO;
import com.sportapp.model.Producto;
import com.sportapp.dao.CategoriaDAO;
import com.sportapp.model.Categoria;
import com.sportapp.dao.PedidoDAO;
import com.sportapp.model.Pedido;
import com.sportapp.dao.DetallePedidoDAO;
import com.sportapp.model.DetallePedido;
import com.sportapp.util.TokenManager;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.List;

public class ServidorApi {

    public static void main(String[] args) throws IOException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("No se encontró el driver JDBC de MySQL: " + e.getMessage());
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // Endpoints de la API
        server.createContext("/api/clientes", new ClienteHandler());
        server.createContext("/api/categorias", new CategoriaHandler());
        server.createContext("/api/producto", new ProductoHandler());
        server.createContext("/api/pedidos", new PedidoHandler());
        server.createContext("/api/detalle_pedido", new DetallePedidoHandler());
        server.createContext("/api/login", new LoginHandler());

        server.setExecutor(null);
        System.out.println("==================================================");
        System.out.println(" Servidor API de Tienda Deportiva Ejecutándose");
        System.out.println(" Escuchando en http://localhost:8080/api/");
        System.out.println("==================================================");
        server.start();
    }

    // --- MANEJADOR DE PRODUCTOS COMPLETO (GET, POST, PUT, DELETE, OPTIONS) ---
    static class ProductoHandler implements HttpHandler {
        private final ProductoDAO productoDAO = new ProductoDAO();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                // 1. PETICIÓN GET (Consultar todos los productos) — pública, para que los invitados vean el catálogo
                if ("GET".equalsIgnoreCase(metodo)) {
                    List<Producto> lista = productoDAO.listarTodos();
                    StringBuilder json = new StringBuilder("[");
                    for (int i = 0; i < lista.size(); i++) {
                        Producto p = lista.get(i);
                        json.append("{")
                            .append("\"id_producto\":").append(p.getIdProducto()).append(",")
                            .append("\"nombre\":\"").append(p.getNombre()).append("\",")
                            .append("\"descripcion\":\"").append(p.getDescripcion() != null ? p.getDescripcion() : "").append("\",")
                            .append("\"talla\":\"").append(p.getTalla() != null ? p.getTalla() : "").append("\",")
                            .append("\"color\":\"").append(p.getColor() != null ? p.getColor() : "").append("\",")
                            .append("\"genero\":\"").append(p.getGenero() != null ? p.getGenero() : "Unisex").append("\",")
                            .append("\"precio_mayorista\":").append(p.getPrecioMayorista()).append(",")
                            .append("\"costo_producto\":").append(p.getCostoProducto()).append(",")
                            .append("\"stock\":").append(p.getStock()).append(",")
                            .append("\"imagen_url\":\"").append(p.getImagenUrl() != null ? p.getImagenUrl() : "").append("\",")
                            .append("\"imagenes_por_color\":\"").append(p.getImagenesPorColor() != null ? p.getImagenesPorColor().replace("\"", "") : "").append("\",")
                            .append("\"id_categoria\":").append(p.getIdCategoria())
                            .append("}");
                        if (i < lista.size() - 1) json.append(",");
                    }
                    json.append("]");
                    responder(exchange, 200, json.toString());

                // 2. PETICIÓN POST (Crear nuevo producto) — solo Administrador (1) o Vendedor (3)
                } else if ("POST".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1, 3) == null) return;
                    String body = leerCuerpo(exchange);
                    Producto p = MapearProductoDesdeJson(body, 0);
                    productoDAO.insertar(p);
                    responder(exchange, 201, "{\"mensaje\": \"Producto guardado exitosamente en MySQL\"}");

                // 3. PETICIÓN PUT (Actualizar producto existente) — solo Administrador (1) o Vendedor (3)
                } else if ("PUT".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1, 3) == null) return;
                    String body = leerCuerpo(exchange);
                    int id = parseIntSeguro(obtenerValorJson(body, "id_producto"));
                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Se requiere 'id_producto' para actualizar\"}");
                        return;
                    }
                    Producto p = MapearProductoDesdeJson(body, id);
                    boolean actualizado = productoDAO.actualizar(p);
                    if (actualizado) {
                        responder(exchange, 200, "{\"mensaje\": \"Producto ID " + id + " actualizado correctamente\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No se encontró el producto con ID " + id + "\"}");
                    }

                // 4. PETICIÓN DELETE (Eliminar producto por ID) — solo Administrador (1)
                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    String query = exchange.getRequestURI().getQuery();
                    String body = leerCuerpo(exchange);
                    int id = 0;

                    if (query != null && query.contains("id=")) {
                        id = parseIntSeguro(query.split("id=")[1].split("&")[0]);
                    } else if (!body.isEmpty()) {
                        id = parseIntSeguro(obtenerValorJson(body, "id_producto"));
                    }

                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Debes enviar 'id_producto' en el body o '?id=' en la URL\"}");
                        return;
                    }

                    boolean eliminado = productoDAO.eliminar(id);
                    if (eliminado) {
                        responder(exchange, 200, "{\"mensaje\": \"Producto ID " + id + " eliminado de MySQL\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No existe un producto con el ID " + id + "\"}");
                    }

                } else {
                    exchange.sendResponseHeaders(405, -1);
                }

            } catch (SQLException e) {
                System.err.println("[ERROR MYSQL] " + e.getMessage());
                responder(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }

        private Producto MapearProductoDesdeJson(String body, int id) {
            String nombre = obtenerValorJson(body, "nombre");
            String descripcion = obtenerValorJson(body, "descripcion");
            String talla = obtenerValorJson(body, "talla");
            String color = obtenerValorJson(body, "color");
            String genero = obtenerValorJson(body, "genero");
            double precio = parseDoubleSeguro(obtenerValorJson(body, "precio_mayorista"));
            double costo = parseDoubleSeguro(obtenerValorJson(body, "costo_producto"));
            int stock = parseIntSeguro(obtenerValorJson(body, "stock"));
            String imagen = obtenerValorJson(body, "imagen_url");
            String imagenesPorColor = obtenerValorJson(body, "imagenes_por_color");
            int categoria = parseIntSeguro(obtenerValorJson(body, "id_categoria"));
            if (categoria == 0) categoria = 1;

            Producto p = new Producto(id, nombre, descripcion, talla, color, genero, precio, costo, stock, imagen, categoria);
            p.setImagenesPorColor(imagenesPorColor);
            return p;
        }
    }

    // --- MANEJADOR DE CLIENTES COMPLETO (GET, POST, PUT, DELETE, OPTIONS) ---
    static class ClienteHandler implements HttpHandler {
        private final ClienteDAO clienteDAO = new ClienteDAO();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                // 1. PETICIÓN GET (Consultar todos los clientes) — solo Administrador
                if ("GET".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    List<Cliente> lista = clienteDAO.listarTodos();
                    StringBuilder json = new StringBuilder("[");
                    for (int i = 0; i < lista.size(); i++) {
                        Cliente c = lista.get(i);
                        json.append("{")
                            .append("\"id_clientes\":").append(c.getIdClientes()).append(",")
                            .append("\"nombre\":\"").append(c.getNombre() != null ? c.getNombre() : "").append("\",")
                            .append("\"apellido\":\"").append(c.getApellido() != null ? c.getApellido() : "").append("\",")
                            .append("\"identificacion\":\"").append(c.getIdentificacion() != null ? c.getIdentificacion() : "").append("\",")
                            .append("\"telefono\":\"").append(c.getTelefono() != null ? c.getTelefono() : "").append("\",")
                            .append("\"direccion\":\"").append(c.getDireccion() != null ? c.getDireccion() : "").append("\",")
                            .append("\"correo\":\"").append(c.getCorreo() != null ? c.getCorreo() : "").append("\",")
                            .append("\"id_rol\":").append(c.getIdRol())
                            .append("}");
                        if (i < lista.size() - 1) json.append(",");
                    }
                    json.append("]");
                    responder(exchange, 200, json.toString());

                // 2. PETICIÓN POST (Crear nuevo cliente) — valida complejidad de contraseña
                } else if ("POST".equalsIgnoreCase(metodo)) {
                    String body = leerCuerpo(exchange);
                    Cliente c = MapearClienteDesdeJson(body, 0);

                    String errorPassword = validarComplejidadPassword(c.getPassword());
                    if (errorPassword != null) {
                        responder(exchange, 400, "{\"error\": \"" + errorPassword + "\"}");
                        return;
                    }

                    clienteDAO.insertar(c);
                    responder(exchange, 201, "{\"mensaje\": \"Cliente registrado exitosamente en MySQL\"}");

                // 3. PETICIÓN PUT (Actualizar cliente existente) — el propio cliente o un Administrador
                } else if ("PUT".equalsIgnoreCase(metodo)) {
                    String body = leerCuerpo(exchange);
                    int id = parseIntSeguro(obtenerValorJson(body, "id_clientes"));
                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Se requiere 'id_clientes' para actualizar\"}");
                        return;
                    }
                    TokenManager.Sesion sesion = requerirSesion(exchange);
                    if (sesion == null) return;
                    if (sesion.idRol != 1 && sesion.idClientes != id) {
                        responder(exchange, 403, "{\"error\": \"Solo puedes editar tu propio perfil\"}");
                        return;
                    }
                    Cliente c = MapearClienteDesdeJson(body, id);

                    // Solo validamos complejidad si de verdad están enviando una contraseña nueva;
                    // si viene vacía, el DAO conserva la contraseña actual sin tocarla.
                    if (c.getPassword() != null && !c.getPassword().isEmpty()) {
                        String errorPassword = validarComplejidadPassword(c.getPassword());
                        if (errorPassword != null) {
                            responder(exchange, 400, "{\"error\": \"" + errorPassword + "\"}");
                            return;
                        }
                    }

                    boolean actualizado = clienteDAO.actualizar(c);
                    if (actualizado) {
                        responder(exchange, 200, "{\"mensaje\": \"Cliente ID " + id + " actualizado correctamente\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No se encontró el cliente con ID " + id + "\"}");
                    }

                // 4. PETICIÓN DELETE (Eliminar cliente por ID) — solo Administrador
                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    String query = exchange.getRequestURI().getQuery();
                    String body = leerCuerpo(exchange);
                    int id = 0;

                    if (query != null && query.contains("id=")) {
                        id = parseIntSeguro(query.split("id=")[1].split("&")[0]);
                    } else if (!body.isEmpty()) {
                        id = parseIntSeguro(obtenerValorJson(body, "id_clientes"));
                    }

                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Debes enviar 'id_clientes' en el body o '?id=' en la URL\"}");
                        return;
                    }

                    boolean eliminado = clienteDAO.eliminar(id);
                    if (eliminado) {
                        responder(exchange, 200, "{\"mensaje\": \"Cliente ID " + id + " eliminado de MySQL\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No existe un cliente con el ID " + id + "\"}");
                    }

                } else {
                    exchange.sendResponseHeaders(405, -1);
                }

            } catch (SQLException e) {
                System.err.println("[ERROR MYSQL CLIENTES] " + e.getMessage());
                responder(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }

        private Cliente MapearClienteDesdeJson(String body, int id) {
            String nombre = obtenerValorJson(body, "nombre");
            String apellido = obtenerValorJson(body, "apellido");
            String identificacion = obtenerValorJson(body, "identificacion");
            String telefono = obtenerValorJson(body, "telefono");
            String direccion = obtenerValorJson(body, "direccion");
            String correo = obtenerValorJson(body, "correo");
            String password = obtenerValorJson(body, "password");
            int idRol = parseIntSeguro(obtenerValorJson(body, "id_rol"));
            if (idRol == 0) idRol = 2; // Rol por defecto (Cliente)

            return new Cliente(id, nombre, apellido, identificacion, telefono, direccion, correo, password, idRol);
        }
    }

    // --- MANEJADOR DE CATEGORÍAS COMPLETO (GET, POST, PUT, DELETE, OPTIONS) ---
    static class CategoriaHandler implements HttpHandler {
        private final CategoriaDAO categoriaDAO = new CategoriaDAO();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                // 1. PETICIÓN GET (Consultar todas las categorías)
                if ("GET".equalsIgnoreCase(metodo)) {
                    List<Categoria> lista = categoriaDAO.listarTodas();
                    StringBuilder json = new StringBuilder("[");
                    for (int i = 0; i < lista.size(); i++) {
                        Categoria c = lista.get(i);
                        json.append("{")
                            .append("\"id_categoria\":").append(c.getIdCategoria()).append(",")
                            .append("\"nombre\":\"").append(c.getNombre() != null ? c.getNombre() : "").append("\",")
                            .append("\"descripcion\":\"").append(c.getDescripcion() != null ? c.getDescripcion() : "").append("\",")
                            .append("\"tipo_categoria\":\"").append(c.getTipoCategoria() != null ? c.getTipoCategoria() : "").append("\"")
                            .append("}");
                        if (i < lista.size() - 1) json.append(",");
                    }
                    json.append("]");
                    responder(exchange, 200, json.toString());

                // 2. PETICIÓN POST (Crear nueva categoría) — solo Administrador
                } else if ("POST".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    String body = leerCuerpo(exchange);
                    Categoria c = mapearCategoriaDesdeJson(body, 0);
                    categoriaDAO.insertar(c);
                    responder(exchange, 201, "{\"mensaje\": \"Categoría guardada exitosamente en MySQL\"}");

                // 3. PETICIÓN PUT (Actualizar categoría existente) — solo Administrador
                } else if ("PUT".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    String body = leerCuerpo(exchange);
                    int id = parseIntSeguro(obtenerValorJson(body, "id_categoria"));
                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Se requiere 'id_categoria' para actualizar\"}");
                        return;
                    }
                    Categoria c = mapearCategoriaDesdeJson(body, id);
                    boolean actualizado = categoriaDAO.actualizar(c);
                    if (actualizado) {
                        responder(exchange, 200, "{\"mensaje\": \"Categoría ID " + id + " actualizada correctamente\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No se encontró la categoría con ID " + id + "\"}");
                    }

                // 4. PETICIÓN DELETE (Eliminar categoría por ID) — solo Administrador
                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    String query = exchange.getRequestURI().getQuery();
                    String body = leerCuerpo(exchange);
                    int id = 0;

                    if (query != null && query.contains("id=")) {
                        id = parseIntSeguro(query.split("id=")[1].split("&")[0]);
                    } else if (!body.isEmpty()) {
                        id = parseIntSeguro(obtenerValorJson(body, "id_categoria"));
                    }

                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Debes enviar 'id_categoria' en el body o '?id=' en la URL\"}");
                        return;
                    }

                    boolean eliminado = categoriaDAO.eliminar(id);
                    if (eliminado) {
                        responder(exchange, 200, "{\"mensaje\": \"Categoría ID " + id + " eliminada de MySQL\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No existe una categoría con el ID " + id + "\"}");
                    }

                } else {
                    exchange.sendResponseHeaders(405, -1);
                }

            } catch (SQLException e) {
                System.err.println("[ERROR MYSQL CATEGORIAS] " + e.getMessage());
                responder(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }

        private Categoria mapearCategoriaDesdeJson(String body, int id) {
            String nombre = obtenerValorJson(body, "nombre");
            String descripcion = obtenerValorJson(body, "descripcion");
            String tipoCategoria = obtenerValorJson(body, "tipo_categoria");
            if (tipoCategoria == null || tipoCategoria.isEmpty()) tipoCategoria = "Tipo de Prenda";

            return new Categoria(id, nombre, descripcion, tipoCategoria);
        }
    }

    // --- MANEJADOR DE PEDIDOS COMPLETO (GET, POST, PUT, DELETE, OPTIONS) ---
    static class PedidoHandler implements HttpHandler {
        private final PedidoDAO pedidoDAO = new PedidoDAO();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                // 1. PETICIÓN GET (Consultar pedidos) — Cliente ve solo los suyos; Administrador/Vendedor ven todos
                if ("GET".equalsIgnoreCase(metodo)) {
                    TokenManager.Sesion sesion = requerirSesion(exchange);
                    if (sesion == null) return;
                    List<Pedido> lista = pedidoDAO.listarTodos();
                    boolean puedeVerTodos = (sesion.idRol == 1 || sesion.idRol == 3); // Administrador o Vendedor
                    StringBuilder json = new StringBuilder("[");
                    boolean primero = true;
                    for (Pedido p : lista) {
                        if (!puedeVerTodos && p.getIdCliente() != sesion.idClientes) continue; // Un Cliente no ve pedidos de otros
                        if (!primero) json.append(",");
                        primero = false;
                        json.append("{")
                            .append("\"id_pedido\":").append(p.getIdPedido()).append(",")
                            .append("\"fecha\":\"").append(p.getFecha() != null ? p.getFecha().toString() : "").append("\",")
                            .append("\"estado\":\"").append(p.getEstado() != null ? p.getEstado() : "").append("\",")
                            .append("\"id_cliente\":").append(p.getIdCliente())
                            .append("}");
                    }
                    json.append("]");
                    responder(exchange, 200, json.toString());

                // 2. PETICIÓN POST (Crear nuevo pedido) — requiere estar autenticado (cualquier rol)
                } else if ("POST".equalsIgnoreCase(metodo)) {
                    TokenManager.Sesion sesion = requerirSesion(exchange);
                    if (sesion == null) return;
                    String body = leerCuerpo(exchange);
                    Pedido p = mapearPedidoDesdeJson(body, 0);
                    // Ignoramos cualquier id_cliente que venga en el body: el pedido SIEMPRE
                    // se asocia al usuario dueño del token, para que nadie pueda comprar a nombre de otro.
                    p.setIdCliente(sesion.idClientes);
                    int idGenerado = pedidoDAO.insertar(p);
                    responder(exchange, 201, "{\"mensaje\": \"Pedido registrado exitosamente en MySQL\", \"id_pedido\": " + idGenerado + "}");

                // 3. PETICIÓN PUT (Actualizar pedido existente, ej. cambiar estado) — Administrador o Vendedor
                } else if ("PUT".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1, 3) == null) return;
                    String body = leerCuerpo(exchange);
                    int id = parseIntSeguro(obtenerValorJson(body, "id_pedido"));
                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Se requiere 'id_pedido' para actualizar\"}");
                        return;
                    }
                    Pedido p = mapearPedidoDesdeJson(body, id);
                    boolean actualizado = pedidoDAO.actualizar(p);
                    if (actualizado) {
                        responder(exchange, 200, "{\"mensaje\": \"Pedido ID " + id + " actualizado correctamente\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No se encontró el pedido con ID " + id + "\"}");
                    }

                // 4. PETICIÓN DELETE (Eliminar pedido por ID) — solo Administrador
                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange, 1) == null) return;
                    String query = exchange.getRequestURI().getQuery();
                    String body = leerCuerpo(exchange);
                    int id = 0;

                    if (query != null && query.contains("id=")) {
                        id = parseIntSeguro(query.split("id=")[1].split("&")[0]);
                    } else if (!body.isEmpty()) {
                        id = parseIntSeguro(obtenerValorJson(body, "id_pedido"));
                    }

                    if (id == 0) {
                        responder(exchange, 400, "{\"error\": \"Debes enviar 'id_pedido' en el body o '?id=' en la URL\"}");
                        return;
                    }

                    boolean eliminado = pedidoDAO.eliminar(id);
                    if (eliminado) {
                        responder(exchange, 200, "{\"mensaje\": \"Pedido ID " + id + " eliminado de MySQL\"}");
                    } else {
                        responder(exchange, 404, "{\"error\": \"No existe un pedido con el ID " + id + "\"}");
                    }

                } else {
                    exchange.sendResponseHeaders(405, -1);
                }

            } catch (SQLException e) {
                System.err.println("[ERROR MYSQL PEDIDOS] " + e.getMessage());
                responder(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }

        private Pedido mapearPedidoDesdeJson(String body, int id) {
            String estado = obtenerValorJson(body, "estado");
            if (estado == null || estado.isEmpty()) estado = "Pendiente";
            int idCliente = parseIntSeguro(obtenerValorJson(body, "id_cliente"));

            return new Pedido(id, new Timestamp(System.currentTimeMillis()), estado, idCliente);
        }
    }

    // --- MANEJADOR DE DETALLE DE PEDIDO (GET, POST, OPTIONS) ---
    // Cada línea del carrito de compras se guarda aquí, referenciando un id_pedido.
    // Al insertar, descuenta automáticamente el stock del producto vendido.
    static class DetallePedidoHandler implements HttpHandler {
        private final DetallePedidoDAO detalleDAO = new DetallePedidoDAO();
        private final PedidoDAO pedidoDAOConsulta = new PedidoDAO();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                // 1. PETICIÓN GET (Consultar el detalle de un pedido: /api/detalle_pedido?id_pedido=5) — requiere sesión
                if ("GET".equalsIgnoreCase(metodo)) {
                    TokenManager.Sesion sesion = requerirSesion(exchange);
                    if (sesion == null) return;

                    String query = exchange.getRequestURI().getQuery();
                    List<DetallePedido> lista;
                    if (query != null && query.contains("id_pedido=")) {
                        int idPedido = parseIntSeguro(query.split("id_pedido=")[1].split("&")[0]);

                        // Un Cliente solo puede ver el detalle de SUS PROPIOS pedidos
                        if (sesion.idRol == 2) {
                            Pedido pedido = pedidoDAOConsulta.obtenerPorId(idPedido);
                            if (pedido == null || pedido.getIdCliente() != sesion.idClientes) {
                                responder(exchange, 403, "{\"error\": \"No tienes permiso para ver este pedido\"}");
                                return;
                            }
                        }
                        lista = detalleDAO.listarPorPedido(idPedido);
                    } else if (sesion.idRol == 1 || sesion.idRol == 3) {
                        lista = detalleDAO.listarTodos(); // Solo Administrador/Vendedor puede pedir el listado completo sin filtrar
                    } else {
                        responder(exchange, 403, "{\"error\": \"Debes indicar 'id_pedido'\"}");
                        return;
                    }

                    StringBuilder json = new StringBuilder("[");
                    for (int i = 0; i < lista.size(); i++) {
                        DetallePedido d = lista.get(i);
                        json.append("{")
                            .append("\"id_detalle\":").append(d.getIdDetalle()).append(",")
                            .append("\"id_pedido\":").append(d.getIdPedido()).append(",")
                            .append("\"id_producto\":").append(d.getIdProducto()).append(",")
                            .append("\"talla\":\"").append(d.getTalla() != null ? d.getTalla() : "").append("\",")
                            .append("\"color\":\"").append(d.getColor() != null ? d.getColor() : "").append("\",")
                            .append("\"cantidad\":").append(d.getCantidad()).append(",")
                            .append("\"precio_unitario\":").append(d.getPrecioUnitario())
                            .append("}");
                        if (i < lista.size() - 1) json.append(",");
                    }
                    json.append("]");
                    responder(exchange, 200, json.toString());

                // 2. PETICIÓN POST (Agregar una línea de detalle a un pedido existente) — requiere sesión
                } else if ("POST".equalsIgnoreCase(metodo)) {
                    if (requerirSesion(exchange) == null) return;
                    String body = leerCuerpo(exchange);
                    int idPedido = parseIntSeguro(obtenerValorJson(body, "id_pedido"));
                    int idProducto = parseIntSeguro(obtenerValorJson(body, "id_producto"));
                    String talla = obtenerValorJson(body, "talla");
                    String color = obtenerValorJson(body, "color");
                    int cantidad = parseIntSeguro(obtenerValorJson(body, "cantidad"));
                    double precioUnitario = parseDoubleSeguro(obtenerValorJson(body, "precio_unitario"));

                    if (idPedido == 0 || idProducto == 0 || cantidad <= 0) {
                        responder(exchange, 400, "{\"error\": \"Se requieren 'id_pedido', 'id_producto' y 'cantidad' (mayor a 0)\"}");
                        return;
                    }

                    DetallePedido d = new DetallePedido(0, idPedido, null, idProducto, talla, color, cantidad, precioUnitario);
                    int idGenerado = detalleDAO.insertar(d);
                    responder(exchange, 201, "{\"mensaje\": \"Detalle de pedido registrado y stock actualizado\", \"id_detalle\": " + idGenerado + "}");

                } else {
                    exchange.sendResponseHeaders(405, -1);
                }

            } catch (SQLException e) {
                System.err.println("[ERROR MYSQL DETALLE_PEDIDO] " + e.getMessage());
                responder(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    // --- MANEJADOR DE LOGIN (POST, OPTIONS) ---
    // Valida correo + contraseña contra la tabla clientes, y que el rol elegido coincida con id_rol.
    static class LoginHandler implements HttpHandler {
        private final ClienteDAO clienteDAO = new ClienteDAO();

        // Debe coincidir con los datos sembrados en la tabla `roles`
        private static final Map<String, Integer> ROLES = new HashMap<>();
        static {
            ROLES.put("Administrador", 1);
            ROLES.put("Cliente", 2);
            ROLES.put("Vendedor", 3);
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            try {
                String body = leerCuerpo(exchange);
                String correo = obtenerValorJson(body, "correo");
                String password = obtenerValorJson(body, "password");
                String rol = obtenerValorJson(body, "rol");

                if (correo.isEmpty() || password.isEmpty()) {
                    responder(exchange, 400, "{\"error\": \"Se requieren 'correo' y 'password'\"}");
                    return;
                }

                Cliente c = clienteDAO.buscarPorCorreo(correo);
                if (c == null || !c.getPassword().equals(password)) {
                    responder(exchange, 401, "{\"error\": \"Correo o contraseña incorrectos\"}");
                    return;
                }

                Integer idRolEsperado = ROLES.get(rol);
                if (idRolEsperado != null && c.getIdRol() != idRolEsperado) {
                    responder(exchange, 401, "{\"error\": \"El rol seleccionado no coincide con este usuario\"}");
                    return;
                }

                String json = "{"
                        + "\"id_clientes\":" + c.getIdClientes() + ","
                        + "\"nombre\":\"" + c.getNombre() + "\","
                        + "\"apellido\":\"" + (c.getApellido() != null ? c.getApellido() : "") + "\","
                        + "\"correo\":\"" + c.getCorreo() + "\","
                        + "\"id_rol\":" + c.getIdRol() + ","
                        + "\"token\":\"" + TokenManager.crearSesion(c.getIdClientes(), c.getNombre(), c.getCorreo(), c.getIdRol()) + "\""
                        + "}";
                responder(exchange, 200, json);

            } catch (SQLException e) {
                System.err.println("[ERROR MYSQL LOGIN] " + e.getMessage());
                responder(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    // --- MÉTODOS AUXILIARES ---
    private static void configurarCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static String leerCuerpo(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    }

    private static void responder(HttpExchange exchange, int statusCode, String respuesta) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = respuesta.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String obtenerValorJson(String json, String clave) {
        try {
            String patron = "\"" + clave + "\"";
            int posClave = json.indexOf(patron);
            if (posClave == -1) return "";

            int posDosPuntos = json.indexOf(":", posClave);
            if (posDosPuntos == -1) return "";

            int posInicio = posDosPuntos + 1;
            while (posInicio < json.length() && (json.charAt(posInicio) == ' ' || json.charAt(posInicio) == '\t' || json.charAt(posInicio) == '\n' || json.charAt(posInicio) == '\r')) {
                posInicio++;
            }

            if (posInicio < json.length() && json.charAt(posInicio) == '"') {
                posInicio++;
                int posFin = json.indexOf('"', posInicio);
                if (posFin != -1) return json.substring(posInicio, posFin);
            } else {
                int posFin = posInicio;
                while (posFin < json.length() && json.charAt(posFin) != ',' && json.charAt(posFin) != '}' && json.charAt(posFin) != '\n' && json.charAt(posFin) != '\r') {
                    posFin++;
                }
                return json.substring(posInicio, posFin).trim();
            }
        } catch (Exception e) {
            return "";
        }
        return "";
    }

    private static double parseDoubleSeguro(String val) {
        try { return Double.parseDouble(val); } catch (Exception e) { return 0.0; }
    }

    private static int parseIntSeguro(String val) {
        try { return Integer.parseInt(val); } catch (Exception e) { return 0; }
    }

    /**
     * Regla de complejidad exigida al registrar o cambiar la contraseña:
     * mínimo 8 caracteres, con al menos una letra y al menos un número.
     * Devuelve null si la contraseña es válida, o un mensaje de error si no.
     */
    private static String validarComplejidadPassword(String password) {
        if (password == null || password.length() < 8) {
            return "La contraseña debe tener mínimo 8 caracteres.";
        }
        boolean tieneLetra = password.chars().anyMatch(Character::isLetter);
        boolean tieneNumero = password.chars().anyMatch(Character::isDigit);
        boolean tieneSimbolo = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        if (!tieneLetra || !tieneNumero || !tieneSimbolo) {
            return "La contraseña debe incluir al menos una letra, un número y un símbolo (por ejemplo: @, #, $, %, !, -, _).";
        }
        return null;
    }

    /**
     * Verifica que la petición traiga un token de sesión válido (header
     * "Authorization: Bearer <token>", generado por /api/login).
     * Si además se pasan rolesPermitidos, exige que el rol del usuario
     * autenticado esté en esa lista (1=Administrador, 2=Cliente, 3=Vendedor).
     *
     * Si la validación falla, esta función ya escribe la respuesta de error
     * (401 o 403) y devuelve null; el handler que la llama debe hacer
     * "return" inmediatamente cuando reciba null, para no seguir ejecutando
     * la operación protegida.
     */
    private static TokenManager.Sesion requerirSesion(HttpExchange exchange, int... rolesPermitidos) throws IOException {
        String header = exchange.getRequestHeaders().getFirst("Authorization");
        String token = TokenManager.extraerToken(header);
        TokenManager.Sesion sesion = TokenManager.validar(token);

        if (sesion == null) {
            responder(exchange, 401, "{\"error\": \"Debes iniciar sesión para realizar esta acción\"}");
            return null;
        }

        if (rolesPermitidos != null && rolesPermitidos.length > 0) {
            boolean permitido = false;
            for (int rol : rolesPermitidos) {
                if (rol == sesion.idRol) { permitido = true; break; }
            }
            if (!permitido) {
                responder(exchange, 403, "{\"error\": \"No tienes permisos suficientes para realizar esta acción\"}");
                return null;
            }
        }

        return sesion;
    }
}