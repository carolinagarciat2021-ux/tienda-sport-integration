import React, { useState } from 'react';

const TALLAS_OPCIONES = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Componente: ProductForm (Vista Administrador)
 */
const ProductForm = ({ onAddProduct, categorias = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    costoProducto: '',
    precioMayorista: '',
    stock: '',
    idCategoria: categorias[0]?.id_categoria ? String(categorias[0].id_categoria) : '1',
    genero: 'Hombre',
    color: '',
    imagenUrlManual: ''
  });

  const [tallasSeleccionadas, setTallasSeleccionadas] = useState([]);
  const [imagenesLocales, setImagenesLocales] = useState([]);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTallaToggle = (talla) => {
    if (tallasSeleccionadas.includes(talla)) {
      setTallasSeleccionadas(tallasSeleccionadas.filter(t => t !== talla));
    } else {
      setTallasSeleccionadas([...tallasSeleccionadas, talla]);
    }
  };

  // Carga de MÚLTIPLES archivos de imagen (un archivo por color)
  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imageUrls = files.map(file => URL.createObjectURL(file));
      setImagenesLocales(imageUrls);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, costoProducto, precioMayorista, stock } = formData;

    if (!nombre || !costoProducto || !precioMayorista || !stock) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    onAddProduct({
      ...formData,
      talla: tallasSeleccionadas.join(','),
      costoProducto: parseFloat(costoProducto),
      precioMayorista: parseFloat(precioMayorista),
      stock: parseInt(stock, 10),
      // Prioriza la URL manual (persistente); si no hay, usa la imagen local (solo de vista previa)
      imagenUrl: (formData.imagenUrlManual && formData.imagenUrlManual.trim()) || imagenesLocales[0] || '/imagenes/productos/default.png',
      imagenes: imagenesLocales.length > 0 ? imagenesLocales : ['/imagenes/productos/default.png']
    });

    // Limpiar formulario
    setFormData({
      nombre: '',
      descripcion: '',
      costoProducto: '',
      precioMayorista: '',
      stock: '',
      idCategoria: categorias[0]?.id_categoria ? String(categorias[0].id_categoria) : '1',
      genero: 'Hombre',
      color: '',
      imagenUrlManual: ''
    });
    setTallasSeleccionadas([]);
    setImagenesLocales([]);
    setError('');
  };

  return (
    <div className="card-form" style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>➕ Crear Nuevo Producto en Tienda Sport</h3>
      {error && <div className="alert-danger" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Nombre del Producto (*):</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Descripción:</label>
          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        {/* Campo Género con opción Infantil */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem' }}>Género:</label>
          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Infantil">Infantil</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        {/* Campo Categoría / Tipo de Prenda (traído directamente de la tabla `categorias`) */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem' }}>Categoría:</label>
          <select
            name="idCategoria"
            value={formData.idCategoria}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {categorias.length === 0 && <option value="">Cargando categorías...</option>}
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selección Múltiple de Tallas con protección contra traducción automática */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Tallas Disponibles (*):</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            {TALLAS_OPCIONES.map(talla => (
              <label key={talla} style={{ cursor: 'pointer' }} translate="no" className="notranslate">
                <input 
                  type="checkbox" 
                  checked={tallasSeleccionadas.includes(talla)} 
                  onChange={() => handleTallaToggle(talla)} 
                /> {talla}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Colores Disponibles (separados por coma):</label>
          <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Ej: Negro, Azul, Rosa" style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Costo del Producto (*):</label>
          <input type="number" name="costoProducto" value={formData.costoProducto} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Precio Mayorista (*):</label>
          <input type="number" name="precioMayorista" value={formData.precioMayorista} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Stock Disponible Real (*):</label>
          <input type="number" name="stock" value={formData.stock} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        {/* URL de Imagen persistente (recomendado, ya que el archivo local no se guarda en el servidor) */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>URL de Imagen (recomendado):</label>
          <input
            type="text"
            name="imagenUrlManual"
            value={formData.imagenUrlManual || ''}
            onChange={handleChange}
            placeholder="https://.../imagen.png"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {/* Carga de Múltiples Imágenes (Una por cada color) */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>O cargar Fotos desde Almacenamiento Local (solo vista previa, no se guarda en la base de datos):</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleMultipleImageUpload} 
            style={{ width: '100%', padding: '8px' }} 
          />
          {imagenesLocales.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#b26a00', marginTop: '4px' }}>
              ⚠️ {imagenesLocales.length} imág{imagenesLocales.length > 1 ? 'enes cargadas' : 'en cargada'} solo para previsualizar en esta sesión. Usa el campo "URL de Imagen" para que quede guardada de forma permanente.
            </p>
          )}
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#1a2a6c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Guardar Producto en Base de Datos
        </button>
      </form>
    </div>
  );
};

export default ProductForm;