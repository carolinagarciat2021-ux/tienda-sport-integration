package com.sportapp.dao;

import com.sportapp.model.Categoria;
import com.sportapp.util.Conexion;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CategoriaDAO {

    public List<Categoria> listarTodas() throws SQLException {
        List<Categoria> lista = new ArrayList<>();
        String sql = "SELECT * FROM categorias";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Categoria(
                    rs.getInt("id_categoria"),
                    rs.getString("nombre"),
                    rs.getString("descripcion"),
                    rs.getString("tipo_categoria")
                ));
            }
        }
        return lista;
    }

    public void insertar(Categoria c) throws SQLException {
        String sql = "INSERT INTO categorias (nombre, descripcion, tipo_categoria) VALUES (?, ?, ?)";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, c.getNombre());
            ps.setString(2, c.getDescripcion());
            ps.setString(3, c.getTipoCategoria());
            ps.executeUpdate();
        }
    }

    public boolean actualizar(Categoria c) throws SQLException {
        String sql = "UPDATE categorias SET nombre = ?, descripcion = ?, tipo_categoria = ? WHERE id_categoria = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, c.getNombre());
            ps.setString(2, c.getDescripcion());
            ps.setString(3, c.getTipoCategoria());
            ps.setInt(4, c.getIdCategoria());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM categorias WHERE id_categoria = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}