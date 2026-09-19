package com.sportapp.dao;

import com.sportapp.model.DetallePedido;
import com.sportapp.util.Conexion;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class DetallePedidoDAO {

    // Inserta una línea de detalle y descuenta el stock del producto vendido.
    // Se hace en una sola transacción para no dejar la base de datos inconsistente
    // si algo falla a mitad de camino (ej. sin stock suficiente).
    public int insertar(DetallePedido d) throws SQLException {
        String sqlVerificarStock = "SELECT stock FROM producto WHERE id_producto = ? FOR UPDATE";
        String sqlInsertar = "INSERT INTO detalle_pedido (id_pedido, id_variante, id_producto, talla, color, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?, ?, ?)";
        String sqlActualizarStock = "UPDATE producto SET stock = stock - ? WHERE id_producto = ?";

        try (Connection con = Conexion.getConexion()) {
            con.setAutoCommit(false);
            try {
                // 1. Verificar stock disponible
                try (PreparedStatement psStock = con.prepareStatement(sqlVerificarStock)) {
                    psStock.setInt(1, d.getIdProducto());
                    try (ResultSet rs = psStock.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("El producto ID " + d.getIdProducto() + " no existe.");
                        }
                        int stockActual = rs.getInt("stock");
                        if (stockActual < d.getCantidad()) {
                            throw new SQLException("Stock insuficiente para el producto ID " + d.getIdProducto() +
                                    " (disponible: " + stockActual + ", solicitado: " + d.getCantidad() + ")");
                        }
                    }
                }

                // 2. Insertar el detalle
                int idDetalleGenerado = 0;
                try (PreparedStatement ps = con.prepareStatement(sqlInsertar, PreparedStatement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, d.getIdPedido());
                    if (d.getIdVariante() != null) {
                        ps.setInt(2, d.getIdVariante());
                    } else {
                        ps.setNull(2, java.sql.Types.INTEGER);
                    }
                    ps.setInt(3, d.getIdProducto());
                    ps.setString(4, d.getTalla());
                    ps.setString(5, d.getColor());
                    ps.setInt(6, d.getCantidad());
                    ps.setDouble(7, d.getPrecioUnitario());
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) idDetalleGenerado = rs.getInt(1);
                    }
                }

                // 3. Descontar stock
                try (PreparedStatement psUpdate = con.prepareStatement(sqlActualizarStock)) {
                    psUpdate.setInt(1, d.getCantidad());
                    psUpdate.setInt(2, d.getIdProducto());
                    psUpdate.executeUpdate();
                }

                con.commit();
                return idDetalleGenerado;
            } catch (SQLException e) {
                con.rollback();
                throw e;
            } finally {
                con.setAutoCommit(true);
            }
        }
    }

    public List<DetallePedido> listarPorPedido(int idPedido) throws SQLException {
        List<DetallePedido> lista = new ArrayList<>();
        String sql = "SELECT * FROM detalle_pedido WHERE id_pedido = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idPedido);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int idVarianteDb = rs.getInt("id_variante");
                    Integer idVariante = rs.wasNull() ? null : idVarianteDb;
                    lista.add(new DetallePedido(
                        rs.getInt("id_detalle"),
                        rs.getInt("id_pedido"),
                        idVariante,
                        rs.getInt("id_producto"),
                        rs.getString("talla"),
                        rs.getString("color"),
                        rs.getInt("cantidad"),
                        rs.getDouble("precio_unitario")
                    ));
                }
            }
        }
        return lista;
    }

    public List<DetallePedido> listarTodos() throws SQLException {
        List<DetallePedido> lista = new ArrayList<>();
        String sql = "SELECT * FROM detalle_pedido";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int idVarianteDb = rs.getInt("id_variante");
                Integer idVariante = rs.wasNull() ? null : idVarianteDb;
                lista.add(new DetallePedido(
                    rs.getInt("id_detalle"),
                    rs.getInt("id_pedido"),
                    idVariante,
                    rs.getInt("id_producto"),
                    rs.getString("talla"),
                    rs.getString("color"),
                    rs.getInt("cantidad"),
                    rs.getDouble("precio_unitario")
                ));
            }
        }
        return lista;
    }
}
