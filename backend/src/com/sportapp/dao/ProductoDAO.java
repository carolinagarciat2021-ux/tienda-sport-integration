package com.sportapp.dao;

import com.sportapp.model.Producto;
import com.sportapp.util.Conexion;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductoDAO {

    // Crear Producto (Vista Administrador)
    public void insertar(Producto p) throws SQLException {
        String sql = "INSERT INTO producto (nombre, descripcion, talla, color, genero, precio_mayorista, costo_producto, stock, imagen_url, imagenes_por_color, id_categoria) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, p.getNombre());
            ps.setString(2, p.getDescripcion());
            ps.setString(3, p.getTalla());
            ps.setString(4, p.getColor());
            ps.setString(5, (p.getGenero() != null && !p.getGenero().isEmpty()) ? p.getGenero() : "Unisex");
            ps.setDouble(6, p.getPrecioMayorista());
            ps.setDouble(7, p.getCostoProducto());
            ps.setInt(8, p.getStock());
            
            // Asigna la ruta enviada o una por defecto si el valor es nulo o vacío
            if (p.getImagenUrl() != null && !p.getImagenUrl().trim().isEmpty()) {
                ps.setString(9, p.getImagenUrl());
            } else {
                ps.setString(9, "/imagenes/productos/default.png"); 
            }
            ps.setString(10, p.getImagenesPorColor());

            ps.setInt(11, p.getIdCategoria());
            ps.executeUpdate();
            System.out.println("[BD Real-Time]: Producto '" + p.getNombre() + "' registrado correctamente.");
        }
    }

    // Listar todos los productos (Vista Administrador / GET /api/producto)
    public List<Producto> listarTodos() throws SQLException {
        List<Producto> lista = new ArrayList<>();
        String sql = "SELECT * FROM producto ORDER BY id_producto DESC";
        try (Connection con = Conexion.conectar();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                lista.add(extraerProducto(rs));
            }
        }
        return lista;
    }

    // Listar productos activos con stock para el Cliente (Inhabilita agotados)
    public List<Producto> listarDisponiblesCliente() throws SQLException {
        List<Producto> lista = new ArrayList<>();
        String sql = "SELECT * FROM producto WHERE stock > 0 ORDER BY id_producto DESC";
        try (Connection con = Conexion.conectar();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                lista.add(extraerProducto(rs));
            }
        }
        return lista;
    }

    // Buscar producto por ID
    public Producto buscarPorId(int id) throws SQLException {
        String sql = "SELECT * FROM producto WHERE id_producto = ?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return extraerProducto(rs);
                }
            }
        }
        return null;
    }

    // Actualizar producto existente (Administrador)
    public boolean actualizar(Producto p) throws SQLException {
        String sql = "UPDATE producto SET nombre = ?, descripcion = ?, talla = ?, color = ?, genero = ?, " +
                     "precio_mayorista = ?, costo_producto = ?, stock = ?, imagen_url = ?, imagenes_por_color = ?, id_categoria = ? " +
                     "WHERE id_producto = ?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, p.getNombre());
            ps.setString(2, p.getDescripcion());
            ps.setString(3, p.getTalla());
            ps.setString(4, p.getColor());
            ps.setString(5, (p.getGenero() != null && !p.getGenero().isEmpty()) ? p.getGenero() : "Unisex");
            ps.setDouble(6, p.getPrecioMayorista());
            ps.setDouble(7, p.getCostoProducto());
            ps.setInt(8, p.getStock());
            ps.setString(9, p.getImagenUrl());
            ps.setString(10, p.getImagenesPorColor());
            ps.setInt(11, p.getIdCategoria());
            ps.setInt(12, p.getIdProducto());
            
            return ps.executeUpdate() > 0;
        }
    }

    // Eliminar producto por ID (Administrador)
    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM producto WHERE id_producto = ?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    // Valoración del inventario total (Administrador)
    public void obtenerValoracionInventario() throws SQLException {
        String sqlCosto = "SELECT SUM(costo_producto * stock) AS valor_total_costo FROM producto";
        String sqlMayorista = "SELECT SUM(precio_mayorista * stock) AS valor_total_mayorista FROM producto";

        try (Connection con = Conexion.conectar();
             Statement st = con.createStatement()) {
            
            ResultSet rsCosto = st.executeQuery(sqlCosto);
            double totalCosto = 0;
            if (rsCosto.next()) totalCosto = rsCosto.getDouble("valor_total_costo");

            ResultSet rsMayorista = st.executeQuery(sqlMayorista);
            double totalMayorista = 0;
            if (rsMayorista.next()) totalMayorista = rsMayorista.getDouble("valor_total_mayorista");

            System.out.println("\n===== VALORACIÓN DEL INVENTARIO (TIENDA SPORT) =====");
            System.out.println("Valoración total a Costo: $" + totalCosto + " COP");
            System.out.println("Valoración total a Precio Mayorista: $" + totalMayorista + " COP");
            System.out.println("===================================================\n");
        }
    }

    private Producto extraerProducto(ResultSet rs) throws SQLException {
        Producto p = new Producto(
            rs.getInt("id_producto"),
            rs.getString("nombre"),
            rs.getString("descripcion"),
            rs.getString("talla"),
            rs.getString("color"),
            rs.getString("genero"),
            rs.getDouble("precio_mayorista"),
            rs.getDouble("costo_producto"),
            rs.getInt("stock"),
            rs.getString("imagen_url"),
            rs.getInt("id_categoria")
        );
        p.setImagenesPorColor(rs.getString("imagenes_por_color"));
        return p;
    }
}