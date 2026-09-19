package com.sportapp.dao;

import com.sportapp.model.Pedido;
import com.sportapp.util.Conexion;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class PedidoDAO {

    public List<Pedido> listarTodos() throws SQLException {
        List<Pedido> lista = new ArrayList<>();
        String sql = "SELECT * FROM pedido";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Pedido(
                    rs.getInt("id_pedido"),
                    rs.getTimestamp("fecha"),
                    rs.getString("estado"),
                    rs.getInt("id_cliente")
                ));
            }
        }
        return lista;
    }

    public Pedido obtenerPorId(int idPedido) throws SQLException {
        String sql = "SELECT * FROM pedido WHERE id_pedido = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idPedido);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Pedido(
                        rs.getInt("id_pedido"),
                        rs.getTimestamp("fecha"),
                        rs.getString("estado"),
                        rs.getInt("id_cliente")
                    );
                }
            }
        }
        return null;
    }

    public void registrarPedido(Pedido p) throws SQLException {
        insertar(p);
    }

    // Inserta el pedido y devuelve el id_pedido generado por MySQL (AUTO_INCREMENT),
    // necesario para poder crear luego las filas de detalle_pedido asociadas.
    public int insertar(Pedido p) throws SQLException {
        String sql = "INSERT INTO pedido (fecha, estado, id_cliente) VALUES (NOW(), ?, ?)";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, p.getEstado() != null ? p.getEstado() : "Pendiente");
            ps.setInt(2, p.getIdCliente());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    public boolean actualizar(Pedido p) throws SQLException {
        String sql = "UPDATE pedido SET estado = ?, id_cliente = ? WHERE id_pedido = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, p.getEstado() != null ? p.getEstado() : "Pendiente");
            ps.setInt(2, p.getIdCliente());
            ps.setInt(3, p.getIdPedido());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM pedido WHERE id_pedido = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}