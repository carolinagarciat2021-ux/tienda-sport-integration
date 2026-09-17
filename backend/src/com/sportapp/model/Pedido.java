package com.sportapp.model;

import java.sql.Timestamp;

public class Pedido {
    private int idPedido;
    private Timestamp fecha;
    private String estado;
    private int idCliente;

    public Pedido() {}

    public Pedido(int idPedido, Timestamp fecha, String estado, int idCliente) {
        this.idPedido = idPedido;
        this.fecha = fecha;
        this.estado = estado;
        this.idCliente = idCliente;
    }

    public int getIdPedido() { return idPedido; }
    public void setIdPedido(int idPedido) { this.idPedido = idPedido; }

    public Timestamp getFecha() { return fecha; }
    public void setFecha(Timestamp fecha) { this.fecha = fecha; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public int getIdCliente() { return idCliente; }
    public void setIdCliente(int idCliente) { this.idCliente = idCliente; }
}