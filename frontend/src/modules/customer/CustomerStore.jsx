import React, { useState, useMemo } from 'react';

/**
 * Componente: CustomerStore
 * Incluye catálogo interactivo con menú lateral (Género y Tipo de Prenda) 
 * y selectores individuales de Talla, Color y Cantidad en cada producto.
 */
const CustomerStore = ({ products = [], categorias = [], user, onToggleLoginScreen, onAddToCart }) => {
  // Estados para los filtros del menú lateral
  const [selectedGenero, setSelectedGenero] = useState('Todos');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas');
  const [categoriaExpandida, setCategoriaExpandida] = useState(null); // qué tipo de prenda tiene abierto su submenú de género
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para la selección del usuario por producto (Talla, Color, Cantidad)
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});

  // Opciones para el menú lateral. El género es independiente del tipo de prenda:
  // cada producto tiene su propio campo `genero` Y su propia `categoria` (tipo de prenda),
  // así que ambos filtros se pueden combinar libremente sin anularse entre sí.
  const generos = ['Todos', 'Hombre', 'Mujer', 'Infantil', 'Unisex'];

  // Los tipos de prenda salen directo de la tabla `categorias` (ya no están hardcodeados),
  // para que el filtro siempre coincida con lo que de verdad existe en la base de datos.
  const tiposPrenda = useMemo(() => {
    const nombres = categorias.map(c => c.nombre).filter(Boolean);
    return ['Todas', ...Array.from(new Set(nombres))];
  }, [categorias]);

  // Manejo de cambios en los selectores por producto
  const handleSizeChange = (id, talla) => {
    setSelectedSizes(prev => ({ ...prev, [id]: talla }));
  };

  const handleColorChange = (id, color) => {
    setSelectedColors(prev => ({ ...prev, [id]: color }));
  };

  const handleQuantityChange = (id, cantidad, maxStock) => {
    const qty = Math.max(1, Math.min(Number(cantidad), maxStock || 99));
    setSelectedQuantities(prev => ({ ...prev, [id]: qty }));
  };

  // Filtrado optimizado para resolver la búsqueda de categorías (evita fallos por mayúsculas o espacios)
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesGenero =
        selectedGenero === 'Todos' ||
        (prod.genero && prod.genero.trim().toLowerCase() === selectedGenero.trim().toLowerCase());

      const categoriaProd = (prod.categoria || prod.tipoPrenda || '').trim().toLowerCase();
      const matchesCategoria =
        selectedCategoria === 'Todas' ||
        categoriaProd === selectedCategoria.trim().toLowerCase();

      const matchesSearch =
        searchQuery === '' ||
        (prod.nombre && prod.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesGenero && matchesCategoria && matchesSearch;
    });
  }, [products, selectedGenero, selectedCategoria, searchQuery]);

  // Manejo de la acción "Agregar al Carrito" — funciona para invitados;
  // el login solo se exige más adelante, al confirmar el pedido (checkout).
  const handleAddToCart = (prod) => {
    const id = prod.idProducto || prod.id_producto;

    // Obtener valores seleccionados o usar por defecto los del producto.
    // IMPORTANTE: la talla por defecto debe ser SOLO la primera talla real
    // del producto (no el texto completo "XS,S,M,L,XL,XXL" tal cual viene
    // guardado cuando el producto tiene varias tallas disponibles).
    const listaColores = prod.color ? prod.color.split(',').map(c => c.trim()).filter(Boolean) : ['Único'];
    const listaTallas = prod.talla ? prod.talla.split(',').map(t => t.trim()).filter(Boolean) : ['M'];
    const tallaElegida = selectedSizes[id] || listaTallas[0];
    const colorElegido = selectedColors[id] || listaColores[0];
    const cantidadElegida = selectedQuantities[id] || 1;
    const precio = prod.precioMayorista || prod.precio_mayorista || 0;

    if ((prod.stock || 0) < 1) {
      alert('Este producto no tiene stock disponible.');
      return;
    }

    onAddToCart({
      idProducto: id,
      nombre: prod.nombre || prod.descripcion,
      precioMayorista: precio,
      imagenUrl: prod.imagenUrl || prod.imagen_url,
      talla: tallaElegida,
      color: colorElegido,
      cantidad: cantidadElegida,
      stockDisponible: prod.stock || 0
    });

    alert(
      `🛒 ¡Agregado al Carrito!\n\n` +
      `Producto: ${prod.nombre || prod.descripcion}\n` +
      `Talla: ${tallaElegida}\n` +
      `Color: ${colorElegido}\n` +
      `Cantidad: ${cantidadElegida} unidad(es)\n` +
      `Subtotal: $${(precio * cantidadElegida).toLocaleString('es-CO')}` +
      (user ? '' : '\n\n(Podrás pagarlo cuando inicies sesión o te registres.)')
    );
  };

  return (
    <div style={{ display: 'flex', gap: '25px', marginTop: '20px', alignItems: 'flex-start' }}>
      
      {/* ========================================== */}
      {/* MENÚ LATERAL IZQUIERDO (FILTROS)           */}
      {/* ========================================== */}
      <aside 
        style={{
          width: '260px',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#1a2a6c', borderBottom: '2px solid #1a2a6c', paddingBottom: '8px' }}>
          🔍 Categorías y Filtros
        </h3>

        {/* Buscador */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', color: '#555' }}>
            Buscar Producto:
          </label>
          <input
            type="text"
            placeholder="Ej: Legis, Camiseta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* SECCIÓN TIPO DE PRENDA */}
      
        {/* SECCIÓN TIPO DE PRENDA — al hacer clic en una prenda, se despliega
            un submenú para elegir Hombre / Mujer / Infantil dentro de ese tipo,
            tal como se pidió: "si quieren buscar una camiseta, que salga una
            subselección de género". El filtro rápido de género de arriba
            sigue funcionando igual para ver todo un género sin importar la prenda. */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            👕 Tipo de Prenda
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {/* "Todas" no tiene submenú: reinicia el filtro de tipo de prenda */}
            <li style={{ marginBottom: '6px' }}>
              <button
                onClick={() => { setSelectedCategoria('Todas'); setCategoriaExpandida(null); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedCategoria === 'Todas' ? '#2e7d32' : '#f9f9f9',
                  color: selectedCategoria === 'Todas' ? '#ffffff' : '#444444',
                  fontWeight: selectedCategoria === 'Todas' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Todas
              </button>
            </li>

            {tiposPrenda.filter(t => t !== 'Todas').map((tipo) => {
              const estaExpandida = categoriaExpandida === tipo;
              const estaSeleccionada = selectedCategoria === tipo;
              return (
                <li key={tipo} style={{ marginBottom: '6px' }}>
                  <button
                    onClick={() => {
                      // Un clic selecciona esta prenda (con el género que ya esté activo)
                      // y abre/cierra su submenú de género.
                      setSelectedCategoria(tipo);
                      setCategoriaExpandida(estaExpandida ? null : tipo);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: estaSeleccionada ? '#2e7d32' : '#f9f9f9',
                      color: estaSeleccionada ? '#ffffff' : '#444444',
                      fontWeight: estaSeleccionada ? 'bold' : 'normal',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{tipo}</span>
                    <span style={{ fontSize: '0.75rem' }}>{estaExpandida ? '▲' : '▼'}</span>
                  </button>

                  {/* Submenú de género, solo visible cuando esta prenda está expandida */}
                  {estaExpandida && (
                    <ul style={{ listStyle: 'none', padding: '6px 0 0 14px', margin: 0, borderLeft: '2px solid #e0e0e0' }}>
                      {generos.map((gen) => {
                        const subSeleccionado = estaSeleccionada && selectedGenero === gen;
                        return (
                          <li key={gen} style={{ marginBottom: '4px' }}>
                            <button
                              onClick={() => {
                                setSelectedCategoria(tipo);
                                setSelectedGenero(gen);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 10px',
                                borderRadius: '5px',
                                border: 'none',
                                fontSize: '0.85rem',
                                backgroundColor: subSeleccionado ? '#1a2a6c' : '#ffffff',
                                color: subSeleccionado ? '#ffffff' : '#555555',
                                fontWeight: subSeleccionado ? 'bold' : 'normal',
                                cursor: 'pointer'
                              }}
                            >
                              {gen === 'Todos' ? `Todo (${tipo})` : gen}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Botón para reiniciar filtros */}
        {(selectedGenero !== 'Todos' || selectedCategoria !== 'Todas' || searchQuery !== '') && (
          <button
            onClick={() => {
              setSelectedGenero('Todos');
              setSelectedCategoria('Todas');
              setCategoriaExpandida(null);
              setSearchQuery('');
            }}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '8px',
              backgroundColor: '#e0e0e0',
              border: 'none',
              borderRadius: '6px',
              color: '#333',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            🔄 Limpiar Filtros
          </button>
        )}
      </aside>

      {/* ========================================== */}
      {/* SECCIÓN PRINCIPAL: GRILLA DE PRODUCTOS     */}
      {/* ========================================== */}
      <section style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#1a2a6c' }}>
            Catálogo Deportivo 
            <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '10px' }}>
              ({selectedGenero} / {selectedCategoria})
            </span>
          </h2>
          <span style={{ fontSize: '0.9rem', color: '#777' }}>
            Mostrando {filteredProducts.length} productos
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>No se encontraron prendas para los filtros seleccionados.</p>
          </div>
        ) : (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
              gap: '20px' 
            }}
          >
            {filteredProducts.map((prod) => {
              const id = prod.idProducto || prod.id_producto;
              const precio = prod.precioMayorista || prod.precio_mayorista || 0;
              const categoriaNombre = prod.categoria || prod.tipoPrenda;

              // Parsear los colores disponibles si vienen separados por comas
              const listaColores = prod.color ? prod.color.split(',').map(c => c.trim()).filter(Boolean) : ['Único'];

              // Parsear las tallas REALES de este producto (no todas las tallas posibles del sistema)
              const listaTallas = prod.talla ? prod.talla.split(',').map(t => t.trim()).filter(Boolean) : ['M'];

              const currentTalla = selectedSizes[id] || listaTallas[0];
              const currentColor = selectedColors[id] || listaColores[0];
              const currentQuantity = selectedQuantities[id] || 1;

              // Obtener la imagen según el color seleccionado (si existen múltiples imágenes guardadas)
              // Imagen según el color elegido: primero busca en `imagenesPorColor`
              // (formato "Negro=url1;Azul=url2", guardado de verdad en la BD),
              // y si ese color no tiene URL propia, usa la galería local o la imagen general.
              const mapaImagenesPorColor = {};
              if (prod.imagenesPorColor) {
                prod.imagenesPorColor.split(';').forEach(par => {
                  const [c, url] = par.split('=');
                  if (c && url) mapaImagenesPorColor[c.trim()] = url.trim();
                });
              }
              const colorIndex = Math.max(0, listaColores.indexOf(currentColor));
              const galeriaImagenes = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes : [prod.imagenUrl || prod.imagen || '/imagenes/productos/default.png'];
              const imagenMostrada = mapaImagenesPorColor[currentColor] || galeriaImagenes[colorIndex] || galeriaImagenes[0];

              return (
                <div 
                  key={id} 
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  {/* Imagen y Badges */}
                  <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f5f5f5' }}>
                    <img 
                      src={imagenMostrada} 
                      alt={prod.nombre || prod.descripcion} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {prod.genero && (
                      <span 
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: '#1a2a6c',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {prod.genero}
                      </span>
                    )}

                    {categoriaNombre && (
                      <span 
                        style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          left: '8px', 
                          backgroundColor: 'rgba(46, 125, 50, 0.9)', 
                          color: '#fff', 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600' 
                        }}
                      >
                        {categoriaNombre}
                      </span>
                    )}
                  </div>

                  {/* Detalles del Producto y Selecciones */}
                  <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#222', fontSize: '1rem' }}>
                        {prod.nombre || prod.descripcion}
                      </h4>
                      <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '0.85rem', lineHeight: '1.3' }}>
                        {prod.descripcion}
                      </p>

                      {/* --- SELECTOR DE TALLA --- */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#444', marginBottom: '4px' }}>
                          Talla:
                        </label>
                        <select
                          value={currentTalla}
                          onChange={(e) => handleSizeChange(id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '0.85rem'
                          }}
                          translate="no"
                          className="notranslate"
                        >
                          {listaTallas.map(talla => (
                            <option key={talla} value={talla}>{talla}</option>
                          ))}
                        </select>
                      </div>

                      {/* --- SELECTOR DE COLOR --- */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#444', marginBottom: '4px' }}>
                          Color:
                        </label>
                        <select
                          value={currentColor}
                          onChange={(e) => handleColorChange(id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '0.85rem'
                          }}
                        >
                          {listaColores.map((col, idx) => (
                            <option key={idx} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      {/* --- SELECTOR DE CANTIDAD --- */}
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#444', marginBottom: '4px' }}>
                          Cantidad: (Disponible: {prod.stock || 0} uds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={prod.stock || 99}
                          value={currentQuantity}
                          onChange={(e) => handleQuantityChange(id, e.target.value, prod.stock)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      {/* PRECIO */}
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2e7d32', marginBottom: '12px' }}>
                        ${(precio * currentQuantity).toLocaleString('es-CO')}
                        {currentQuantity > 1 && (
                          <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal', marginLeft: '6px' }}>
                            (${precio.toLocaleString('es-CO')} c/u)
                          </span>
                        )}
                      </div>

                      {/* BOTÓN AGREGAR */}
                      <button
                        onClick={() => handleAddToCart(prod)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1a2a6c',
                          color: '#fff',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        🛒 Agregar al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerStore;