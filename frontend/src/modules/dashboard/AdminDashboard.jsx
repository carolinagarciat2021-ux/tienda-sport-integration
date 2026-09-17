import React from 'react';

/**
 * Componente: AdminDashboard
 * Muestra la valoración general del inventario en costo y precio mayorista.
 */
const AdminDashboard = ({ products = [] }) => {
  // Mapeo dinámico evitando valores nulos
  const totalValoracionCosto = products.reduce((acc, p) => {
    const costo = Number(p.costoProducto || p.costo) || 0;
    const stock = Number(p.stock) || 0;
    return acc + (costo * stock);
  }, 0);

  const totalValoracionMayorista = products.reduce((acc, p) => {
    const precio = Number(p.precioMayorista || p.precio_mayorista) || 0;
    const stock = Number(p.stock) || 0;
    return acc + (precio * stock);
  }, 0);

  return (
    <div className="dashboard-summary" style={{ padding: '20px' }}>
      <h2>📊 Módulo de Administración - Tienda Sport</h2>
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        <div className="metric-card" style={{ padding: '20px', border: '1px solid #1a2a6c', borderRadius: '8px', backgroundColor: '#eef2ff' }}>
          <h4>Valoración Total de Inventario (a Costo)</h4>
          <p className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a2a6c' }}>
            ${totalValoracionCosto.toLocaleString('es-CO')} COP
          </p>
        </div>

        <div className="metric-card" style={{ padding: '20px', border: '1px solid #2e7d32', borderRadius: '8px', backgroundColor: '#eefbeef' }}>
          <h4>Valoración Total de Inventario (a Precio Mayorista)</h4>
          <p className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
            ${totalValoracionMayorista.toLocaleString('es-CO')} COP
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;