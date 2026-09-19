import React, { useState, useEffect, useCallback } from 'react';
import { listarPedidosConDetalle, listarClientes, listarProductos } from '../../api';

/**
 * Componente: AdminOrders
 * Muestra todos los pedidos hechos por los clientes, con el detalle completo
 * de cada uno (qué productos, en qué talla y color, y cuánto pagaron).
 * Si el usuario logueado es Cliente, el backend ya filtra y solo trae SUS pedidos
 * (por eso este mismo componente también sirve para "Mis Pedidos" del cliente).
 */
const AdminOrders = ({ modoCliente = false }) => {
  const [pedidos, setPedidos] = useState([]);
  const [clientesPorId, setClientesPorId] = useState({});
  const [productosPorId, setProductosPorId] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [pedidosDb, productosDb] = await Promise.all([
        listarPedidosConDetalle(),
        listarProductos()
      ]);

      const mapaProductos = {};
      (productosDb || []).forEach(p => { mapaProductos[p.id_producto] = p; });
      setProductosPorId(mapaProductos);

      // Solo el Administrador puede consultar la lista de clientes (para mostrar el nombre);
      // si falla (porque el que mira es un Cliente), simplemente no mostramos nombres.
      if (!modoCliente) {
        try {
          const clientesDb = await listarClientes();
          const mapaClientes = {};
          (clientesDb || []).forEach(c => { mapaClientes[c.id_clientes] = c; });
          setClientesPorId(mapaClientes);
        } catch (e) {
          // Silencioso: si no es Administrador, simplemente no se listan clientes
        }
      }

      // Pedidos más recientes primero
      const ordenados = [...(pedidosDb || [])].sort((a, b) => b.id_pedido - a.id_pedido);
      setPedidos(ordenados);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pedidos.');
    } finally {
      setCargando(false);
    }
  }, [modoCliente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const calcularTotal = (detalle) => (detalle || []).reduce((acc, d) => acc + (d.precio_unitario * d.cantidad), 0);

  if (cargando) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando pedidos...</p>;

  if (error) {
    return (
      <div style={{ backgroundColor: '#ffe6e6', color: '#b21f1f', padding: '14px 18px', borderRadius: '6px', marginTop: '20px' }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ color: '#1a2a6c' }}>{modoCliente ? '📦 Mis Pedidos' : '📦 Pedidos de Clientes'}</h2>

      {pedidos.length === 0 && (
        <p style={{ color: '#888', marginTop: '20px' }}>
          {modoCliente ? 'Todavía no has hecho ningún pedido.' : 'Todavía no hay pedidos registrados.'}
        </p>
      )}

      {pedidos.map((pedido) => {
        const cliente = clientesPorId[pedido.id_cliente];
        const expandido = pedidoExpandido === pedido.id_pedido;
        const total = calcularTotal(pedido.detalle);

        return (
          <div key={pedido.id_pedido} style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '14px', overflow: 'hidden' }}>
            <button
              onClick={() => setPedidoExpandido(expandido ? null : pedido.id_pedido)}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 18px', border: 'none', backgroundColor: '#f8f9fa',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
              }}
            >
              <div>
                <strong style={{ color: '#1a2a6c' }}>Pedido #{pedido.id_pedido}</strong>
                {' — '}{pedido.fecha}
                {!modoCliente && cliente && <span> — {cliente.nombre} {cliente.apellido} ({cliente.correo})</span>}
                {!modoCliente && !cliente && <span> — Cliente ID {pedido.id_cliente}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold',
                  backgroundColor: pedido.estado === 'Pagado' ? '#e8f5e9' : pedido.estado === 'Enviado' ? '#e3f2fd' : '#fff3e0',
                  color: pedido.estado === 'Pagado' ? '#2e7d32' : pedido.estado === 'Enviado' ? '#1565c0' : '#e65100'
                }}>
                  {pedido.estado}
                </span>
                <strong style={{ color: '#2e7d32' }}>${total.toLocaleString('es-CO')}</strong>
                <span>{expandido ? '▲' : '▼'}</span>
              </div>
            </button>

            {expandido && (
              <div style={{ padding: '14px 18px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Producto</th>
                      <th style={{ padding: '6px' }}>Cantidad</th>
                      <th style={{ padding: '6px' }}>Precio unitario</th>
                      <th style={{ padding: '6px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pedido.detalle || []).map((linea) => {
                      const producto = productosPorId[linea.id_producto];
                      return (
                        <tr key={linea.id_detalle} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '6px' }}>{producto ? (producto.nombre || producto.descripcion) : `Producto ID ${linea.id_producto}`}</td>
                          <td style={{ padding: '6px' }}>{linea.cantidad}</td>
                          <td style={{ padding: '6px' }}>${linea.precio_unitario.toLocaleString('es-CO')}</td>
                          <td style={{ padding: '6px', fontWeight: 'bold' }}>${(linea.precio_unitario * linea.cantidad).toLocaleString('es-CO')}</td>
                        </tr>
                      );
                    })}
                    {(!pedido.detalle || pedido.detalle.length === 0) && (
                      <tr><td colSpan={4} style={{ padding: '10px', color: '#888' }}>Sin líneas de detalle.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminOrders;
