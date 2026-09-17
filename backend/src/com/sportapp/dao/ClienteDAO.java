package com.sportapp.dao;

import com.sportapp.model.Cliente;
import com.sportapp.util.Conexion;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClienteDAO {

    // 1. LISTAR TODOS LOS CLIENTES
    public List<Cliente> listarTodos() throws SQLException {
        List<Cliente> lista = new ArrayList<>();
        String sql = "SELECT * FROM clientes";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Cliente c = new Cliente(
                    rs.getInt("id_clientes"),
                    rs.getString("nombre"),
                    rs.getString("apellido"),
                    rs.getString("identificacion"),
                    rs.getString("telefono"),
                    rs.getString("direccion"),
                    rs.getString("correo"),
                    rs.getString("password"),
                    rs.getInt("id_rol")
                );
                lista.add(c);
            }
        }
        return lista;
    }

    // 2. INSERTAR UN NUEVO CLIENTE (Objeto)
    public void insertar(Cliente c) throws SQLException {
        String sql = "INSERT INTO clientes (nombre, apellido, identificacion, telefono, direccion, correo, password, id_rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, c.getNombre());
            ps.setString(2, c.getApellido());
            ps.setString(3, c.getIdentificacion());
            ps.setString(4, c.getTelefono());
            ps.setString(5, c.getDireccion());
            ps.setString(6, c.getCorreo());
            ps.setString(7, c.getPassword());
            ps.setInt(8, c.getIdRol());

            ps.executeUpdate();
        }
    }

    // 3. ACTUALIZAR CLIENTE EXISTENTE
    public boolean actualizar(Cliente c) throws SQLException {
        // Si "password" llega vacío, conservamos la contraseña actual en vez de borrarla
        String sql = "UPDATE clientes SET nombre=?, apellido=?, identificacion=?, telefono=?, direccion=?, correo=?, " +
                     "password = IF(? = '', password, ?), id_rol=? WHERE id_clientes=?";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, c.getNombre());
            ps.setString(2, c.getApellido());
            ps.setString(3, c.getIdentificacion());
            ps.setString(4, c.getTelefono());
            ps.setString(5, c.getDireccion());
            ps.setString(6, c.getCorreo());
            String passwordNueva = c.getPassword() != null ? c.getPassword() : "";
            ps.setString(7, passwordNueva);
            ps.setString(8, passwordNueva);
            ps.setInt(9, c.getIdRol());
            ps.setInt(10, c.getIdClientes());

            return ps.executeUpdate() > 0;
        }
    }

    // 4. ELIMINAR CLIENTE POR ID
    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM clientes WHERE id_clientes=?";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    // 5. BUSCAR CLIENTE POR CORREO (usado para el login)
    public Cliente buscarPorCorreo(String correo) throws SQLException {
        String sql = "SELECT * FROM clientes WHERE correo = ?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, correo);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Cliente(
                        rs.getInt("id_clientes"),
                        rs.getString("nombre"),
                        rs.getString("apellido"),
                        rs.getString("identificacion"),
                        rs.getString("telefono"),
                        rs.getString("direccion"),
                        rs.getString("correo"),
                        rs.getString("password"),
                        rs.getInt("id_rol")
                    );
                }
            }
        }
        return null;
    }

    // --- MÉTODOS COMPATIBLES CON VENTA_ROPA_DEPORTIVA ---

    public void registrarUsuario(String nombre, String apellido, String identificacion, String telefono, String direccion, String correo, String password, int idRol) throws SQLException {
        if (correo != null && correo.contains(" ")) {
            throw new SQLException("El correo electrónico no debe contener espacios en blanco.");
        }
        Cliente c = new Cliente(0, nombre, apellido, identificacion, telefono, direccion, correo, password, idRol);
        insertar(c);
    }

    public void recuperarPassword(String correo, int idRol) throws SQLException {
        String sql = "SELECT password FROM clientes WHERE correo=? AND id_rol=?";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, correo);
            ps.setInt(2, idRol);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    System.out.println("Contraseña recuperada: " + rs.getString("password"));
                } else {
                    System.out.println("No se encontró usuario con ese correo y rol.");
                }
            }
        }
    }
}