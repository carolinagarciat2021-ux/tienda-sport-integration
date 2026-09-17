package com.sportapp.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    private static final String URL = "jdbc:mysql://localhost:3307/venta_ropa_deportiva?serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASS = "1234";
    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";

    // Método que llaman tus clases ClienteDAO y ProductoDAO
    public static Connection getConexion() throws SQLException {
        return conectar();
    }

    // Método principal de conexión
    public static Connection conectar() throws SQLException {
        try {
            Class.forName(DRIVER);
            return DriverManager.getConnection(URL, USER, PASS);
        } catch (ClassNotFoundException e) {
            throw new SQLException("Error: Driver JDBC no encontrado. " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        try (Connection con = conectar()) {
            if (con != null) {
                System.out.println("-------------------------------------------------------");
                System.out.println(" CONEXIÓN EXITOSA EN TIEMPO REAL - TIENDA SPORT");
                System.out.println(" Base de datos: venta_ropa_deportiva (Puerto 3307)");
                System.out.println("-------------------------------------------------------");
            }
        } catch (SQLException e) {
            System.err.println("❌ Error de conexión: " + e.getMessage());
        }
    }
}