package com.sportapp.model;

public class Categoria {
    private int idCategoria;
    private String nombre;
    private String descripcion;
    private String tipoCategoria;

    public Categoria() {}

    public Categoria(int idCategoria, String nombre, String descripcion, String tipoCategoria) {
        this.idCategoria = idCategoria;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipoCategoria = tipoCategoria;
    }

    public int getIdCategoria() { return idCategoria; }
    public void setIdCategoria(int idCategoria) { this.idCategoria = idCategoria; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getTipoCategoria() { return tipoCategoria; }
    public void setTipoCategoria(String tipoCategoria) { this.tipoCategoria = tipoCategoria; }
}