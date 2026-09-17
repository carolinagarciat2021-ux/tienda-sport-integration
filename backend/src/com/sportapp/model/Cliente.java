package com.sportapp.model;

public class Cliente {
    private int idClientes;
    private String nombre;
    private String apellido;
    private String identificacion;
    private String telefono;
    private String direccion;
    private String correo;
    private String password;
    private int idRol;

    public Cliente() {}

    public Cliente(int idClientes, String nombre, String apellido, String identificacion, String telefono, String direccion, String correo, String password, int idRol) {
        this.idClientes = idClientes;
        this.nombre = nombre;
        this.apellido = apellido;
        this.identificacion = identificacion;
        this.telefono = telefono;
        this.direccion = direccion;
        this.correo = correo;
        this.password = password;
        this.idRol = idRol;
    }

    public int getIdClientes() { return idClientes; }
    public void setIdClientes(int idClientes) { this.idClientes = idClientes; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getIdentificacion() { return identificacion; }
    public void setIdentificacion(String identificacion) { this.identificacion = identificacion; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public int getIdRol() { return idRol; }
    public void setIdRol(int idRol) { this.idRol = idRol; }
}