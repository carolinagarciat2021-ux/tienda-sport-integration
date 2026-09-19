package com.sportapp.model;

public class DetallePedido {
    private int idDetalle;
    private int idPedido;
    private Integer idVariante; // puede ser null (no siempre se usa producto_variante)
    private int idProducto;
    private String talla;
    private String color;
    private int cantidad;
    private double precioUnitario;

    public DetallePedido() {}

    public DetallePedido(int idDetalle, int idPedido, Integer idVariante, int idProducto, String talla, String color, int cantidad, double precioUnitario) {
        this.idDetalle = idDetalle;
        this.idPedido = idPedido;
        this.idVariante = idVariante;
        this.idProducto = idProducto;
        this.talla = talla;
        this.color = color;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    public int getIdDetalle() { return idDetalle; }
    public void setIdDetalle(int idDetalle) { this.idDetalle = idDetalle; }

    public int getIdPedido() { return idPedido; }
    public void setIdPedido(int idPedido) { this.idPedido = idPedido; }

    public Integer getIdVariante() { return idVariante; }
    public void setIdVariante(Integer idVariante) { this.idVariante = idVariante; }

    public int getIdProducto() { return idProducto; }
    public void setIdProducto(int idProducto) { this.idProducto = idProducto; }

    public String getTalla() { return talla; }
    public void setTalla(String talla) { this.talla = talla; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }

    public double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(double precioUnitario) { this.precioUnitario = precioUnitario; }
}
