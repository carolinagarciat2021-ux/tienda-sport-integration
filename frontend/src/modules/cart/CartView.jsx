import React, { useState } from 'react';

/**
 * Componente: CartView
 * Muestra el carrito de compras y permite confirmar el pedido,
 * el cual se guarda en MySQL a través de la API (tablas pedido y detalle_pedido).
 */
const CartView = ({ cart = [], user, onUpdateQuantity, onRemoveItem, onCheckout, onGoToStore, onGoToLogin, onGoToRegister }) => {
  const [procesando, setProcesando] = useState(false);

  const total = cart.reduce((acc, item) => acc + (item.precioMayorista * item.cantidad), 0);

  const handleConfirmar = async () => {
    if (cart.length === 0) return;

    setProcesando(true);
    try {
      const idPedido = await onCheckout();
      alert(`✅ ¡Pedido #${idPedido} realizado con éxito! Quedó guardado en la base de datos.`);
    } catch (error) {
      alert(`❌ No se pudo completar el pedido: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
        <h2 style={{ color: '#1a2a6c' }}>🛒 Tu carrito está vacío</h2>
        <p style={{ color: '#666' }}>Agrega productos desde el catálogo para poder hacer un pedido.</p>
        <button
          onClick={onGoToStore}
          style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#1a2a6c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Ir al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ color: '#1a2a6c' }}>🛒 Carrito de Compras</h2>

      {!user && (
        <div style={{ backgroundColor: '#fff8e1', border: '1px solid #f9a825', borderRadius: '6px', padding: '14px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ color: '#8a6d00' }}>
            👤 Estás comprando como invitado. Tu carrito se conserva, pero para confirmar el pedido necesitas iniciar sesión o crear una cuenta.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onGoToLogin} style={{ padding: '8px 14px', backgroundColor: '#1a2a6c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Iniciar Sesión
            </button>
            <button onClick={onGoToRegister} style={{ padding: '8px 14px', backgroundColor: '#fff', color: '#1a2a6c', border: '1px solid #1a2a6c', borderRadius: '4px', cursor: 'pointer' }}>
              Registrarme
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Producto</th>
              <th style={{ padding: '10px' }}>Talla</th>
              <th style={{ padding: '10px' }}>Color</th>
              <th style={{ padding: '10px' }}>Cantidad</th>
              <th style={{ padding: '10px' }}>Subtotal</th>
              <th style={{ padding: '10px' }}></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <tr key={`${item.idProducto}-${item.talla}-${item.color}-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={item.imagenUrl || '/imagenes/productos/default.png'}
                    alt={item.nombre}
                    style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <strong>{item.nombre}</strong>
                </td>
                <td style={{ padding: '10px' }}>{item.talla}</td>
                <td style={{ padding: '10px' }}>{item.color}</td>
                <td style={{ padding: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    max={item.stockDisponible || 99}
                    value={item.cantidad}
                    onChange={(e) => onUpdateQuantity(idx, Number(e.target.value))}
                    style={{ width: '60px', padding: '4px' }}
                  />
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#2e7d32' }}>
                  ${(item.precioMayorista * item.cantidad).toLocaleString('es-CO')}
                </td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => onRemoveItem(idx)}
                    style={{ backgroundColor: '#d32f2f', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '20px', alignItems: 'center' }}>
        <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1a2a6c' }}>
          Total: ${total.toLocaleString('es-CO')}
        </span>
        {user ? (
          <button
            onClick={handleConfirmar}
            disabled={procesando}
            style={{
              padding: '12px 24px',
              backgroundColor: procesando ? '#999' : '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: procesando ? 'not-allowed' : 'pointer'
            }}
          >
            {procesando ? 'Procesando...' : '✅ Confirmar Pedido'}
          </button>
        ) : (
          <button
            onClick={onGoToLogin}
            style={{ padding: '12px 24px', backgroundColor: '#f9a825', color: '#111', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔒 Inicia sesión para pagar
          </button>
        )}
      </div>
    </div>
  );
};

export default CartView;
