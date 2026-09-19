import React, { useState } from 'react';

const TALLAS_DISPONIBLES = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Componente: ProductList
 * Muestra la tabla de existencias, control de bodega y edición en línea de productos.
 */
const ProductList = ({ products = [], onUpdateProduct, onDeleteProduct }) => {
  // Estado para saber qué fila se está editando por su ID (normalizado idProducto / id_producto)
  const [editingId, setEditingId] = useState(null);

  // Estado temporal para almacenar los cambios durante la edición
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    descripcion: '',
    talla: '',
    color: '',
    costoProducto: '',
    precioMayorista: '',
    stock: '',
    imagenUrl: ''
  });

  // Helper para obtener el ID correcto sin importar el mapeo (camelCase o snake_case)
  const getId = (prod) => prod.idProducto || prod.id_producto;

  // Activa el modo edición copiando los datos del producto seleccionado
  const handleEditClick = (prod) => {
    setEditingId(getId(prod));
    setEditFormData({
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      talla: prod.talla || 'M',
      color: prod.color || '',
      costoProducto: prod.costoProducto || prod.costo || '',
      precioMayorista: prod.precioMayorista || prod.precio_mayorista || '',
      stock: prod.stock || '',
      imagenUrl: prod.imagenUrl || prod.imagen || ''
    });
  };

  // Captura el cambio de los inputs de texto/número dentro de la fila
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Captura la URL de imagen escrita manualmente (evita Base64, que no cabe en
  // la columna `imagen_url` varchar(255) de la base de datos)
  const handleEditImageUrlChange = (e) => {
    setEditFormData({
      ...editFormData,
      imagenUrl: e.target.value
    });
  };

  // Guarda los cambios y actualiza en el estado global/backend
  const handleSaveSubmit = (id) => {
    if (!editFormData.descripcion || !editFormData.color || !editFormData.precioMayorista || editFormData.stock === '') {
      alert('Todos los campos son obligatorios para actualizar el producto.');
      return;
    }

    const updatedProduct = {
      idProducto: id,
      id_producto: id,
      nombre: editFormData.nombre || editFormData.descripcion,
      descripcion: editFormData.descripcion,
      talla: editFormData.talla,
      color: editFormData.color,
      costoProducto: Number(editFormData.costoProducto),
      precioMayorista: Number(editFormData.precioMayorista),
      precio_mayorista: Number(editFormData.precioMayorista),
      stock: Number(editFormData.stock),
      imagenUrl: editFormData.imagenUrl,
      imagen: editFormData.imagenUrl
    };

    onUpdateProduct(id, updatedProduct);
    setEditingId(null);
  };

  return (
    <div className="card-form" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #1a2a6c', paddingBottom: '8px' }}>
        📋 Existencias y Control Total de Bodega ({products.length} ítems)
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Foto</th>
              <th style={{ padding: '10px' }}>Nombre del Producto</th>
              <th style={{ padding: '10px' }}>Talla</th>
              <th style={{ padding: '10px' }}>Color</th>
              <th style={{ padding: '10px' }}>Costo</th>
              <th style={{ padding: '10px' }}>Precio Mayorista</th>
              <th style={{ padding: '10px' }}>Stock Actual</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Acciones de Control</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => {
              const currentId = getId(prod);
              const isEditing = editingId === currentId;
              const precioMostrar = prod.precioMayorista || prod.precio_mayorista || 0;
              const costoMostrar = prod.costoProducto || prod.costo || 0;
              const imagenMostrar = prod.imagenUrl || prod.imagen || '/imagenes/productos/default.png';

              return (
                <tr key={currentId} style={{ borderBottom: '1px solid #eee', backgroundColor: isEditing ? '#f9fbe7' : 'transparent' }}>
                  
                  {/* FOTO */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <img 
                          src={editFormData.imagenUrl || '/imagenes/productos/default.png'} 
                          alt="" 
                          style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                        <input 
                          type="text" 
                          placeholder="URL de imagen"
                          value={editFormData.imagenUrl || ''}
                          onChange={handleEditImageUrlChange} 
                          style={{ fontSize: '0.75rem', width: '120px' }} 
                        />
                      </div>
                    ) : (
                      <img 
                        src={imagenMostrar} 
                        alt="" 
                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} 
                      />
                    )}
                  </td>

                  {/* DESCRIPCIÓN */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="descripcion" 
                        value={editFormData.descripcion} 
                        onChange={handleEditInputChange}
                        style={{ padding: '6px', width: '100%', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #999' }}
                      />
                    ) : (
                      <strong style={{ color: '#222' }}>{prod.nombre || prod.descripcion}</strong>
                    )}
                  </td>

                  {/* TALLA */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <select 
                        name="talla" 
                        value={editFormData.talla} 
                        onChange={handleEditInputChange}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #999' }}
                      >
                        {TALLAS_DISPONIBLES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ background: '#eee', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {prod.talla || 'M'}
                      </span>
                    )}
                  </td>

                  {/* COLOR */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="color" 
                        value={editFormData.color} 
                        onChange={handleEditInputChange}
                        style={{ padding: '6px', width: '90px', borderRadius: '4px', border: '1px solid #999' }}
                      />
                    ) : (
                      <span>{prod.color}</span>
                    )}
                  </td>

                  {/* COSTO */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <input 
                        type="number" 
                        name="costoProducto" 
                        value={editFormData.costoProducto} 
                        onChange={handleEditInputChange}
                        style={{ padding: '6px', width: '90px', borderRadius: '4px', border: '1px solid #999' }}
                        min="0"
                      />
                    ) : (
                      <span style={{ color: '#555' }}>${costoMostrar.toLocaleString('es-CO')}</span>
                    )}
                  </td>

                  {/* PRECIO MAYORISTA */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <input 
                        type="number" 
                        name="precioMayorista" 
                        value={editFormData.precioMayorista} 
                        onChange={handleEditInputChange}
                        style={{ padding: '6px', width: '90px', borderRadius: '4px', border: '1px solid #999' }}
                        min="0"
                      />
                    ) : (
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${precioMostrar.toLocaleString('es-CO')}</span>
                    )}
                  </td>

                  {/* STOCK */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <input 
                        type="number" 
                        name="stock" 
                        value={editFormData.stock} 
                        onChange={handleEditInputChange}
                        style={{ padding: '6px', width: '70px', borderRadius: '4px', border: '1px solid #999' }}
                        min="0"
                      />
                    ) : (
                      <span style={{ fontWeight: prod.stock <= 5 ? 'bold' : 'normal', color: prod.stock <= 5 ? '#c62828' : '#333' }}>
                        {prod.stock} uds.
                      </span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleSaveSubmit(currentId)} 
                          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Guardar
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          style={{ backgroundColor: '#757575', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEditClick(prod)} 
                          style={{ backgroundColor: '#0288d1', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`¿Estás segura de eliminar "${prod.descripcion || prod.nombre}"?`)) {
                              onDeleteProduct(currentId);
                            }
                          }} 
                          style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;