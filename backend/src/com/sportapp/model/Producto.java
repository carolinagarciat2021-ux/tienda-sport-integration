package com.sportapp.model;

public class Producto {
    private int idProducto;
    private String nombre;
    private String descripcion;
    private String talla;
    private String color;
    private String genero; // Hombre, Mujer, Infantil, Unisex
    private double precioMayorista;
    private double costoProducto;
    private int stock;
    private String imagenUrl;
    private int idCategoria;
    // JSON de texto: {"Negro":"url1","Azul":"url2"} — una imagen distinta por color del producto
    private String imagenesPorColor;

    public Producto() {}

    public Producto(int idProducto, String nombre, String descripcion, String talla, String color, String genero,
                    double precioMayorista, double costoProducto, int stock, String imagenUrl, int idCategoria) {
        this.idProducto = idProducto;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.talla = talla;
        this.color = color;
        this.genero = genero;
        this.precioMayorista = precioMayorista;
        this.costoProducto = costoProducto;
        this.stock = stock;
        this.imagenUrl = imagenUrl;
        this.idCategoria = idCategoria;
    }

    // Getters y Setters
    public int getIdProducto() { return idProducto; }
    public void setIdProducto(int idProducto) { this.idProducto = idProducto; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getTalla() { return talla; }
    public void setTalla(String talla) { this.talla = talla; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public double getPrecioMayorista() { return precioMayorista; }
    public void setPrecioMayorista(double precioMayorista) { this.precioMayorista = precioMayorista; }

    public double getCostoProducto() { return costoProducto; }
    public void setCostoProducto(double costoProducto) { this.costoProducto = costoProducto; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }

    public int getIdCategoria() { return idCategoria; }
    public void setIdCategoria(int idCategoria) { this.idCategoria = idCategoria; }

    public String getImagenesPorColor() { return imagenesPorColor; }
    public void setImagenesPorColor(String imagenesPorColor) { this.imagenesPorColor = imagenesPorColor; }
}