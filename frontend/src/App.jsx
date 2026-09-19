import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LoginCard from './modules/auth/LoginCard';
import RegisterCard from './modules/auth/RegisterCard';
import CustomerStore from './modules/customer/CustomerStore';
import AdminDashboard from './modules/dashboard/AdminDashboard';
import ProductForm from './modules/products/ProductForm';
import ProductList from './modules/products/ProductList';
import CartView from './modules/cart/CartView';
import UserManagement from './modules/users/UserManagement';
import AdminOrders from './modules/orders/AdminOrders';
import CategoryManagement from './modules/categories/CategoryManagement';
import {
  listarProductos,
  listarCategorias,
  guardarProducto,
  actualizarProducto,
  eliminarProducto,
  registrarCliente,
  iniciarSesion,
  cerrarSesion,
  obtenerToken,
  registrarManejador401,
  enviarPedidoCompleto
} from './api';

// Mapeo de id_rol (tabla `roles`) a nombre de rol usado en la interfaz
const NOMBRE_ROL = { 1: 'Administrador', 2: 'Cliente', 3: 'Vendedor' };

// Claves de localStorage para que la sesión y el carrito de invitado sobrevivan al refrescar la página
const CLAVE_USUARIO = 'tiendaSport_usuario';
const CLAVE_CARRITO = 'tiendaSport_carrito';

function leerUsuarioGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    return crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    return null;
  }
}

function leerCarritoGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_CARRITO);
    return crudo ? JSON.parse(crudo) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Componente Principal: App
 * Administra el flujo de vistas, sesión de usuario y estado global de productos de Tienda Sport.
 * Todo el catálogo, el carrito y los pedidos quedan conectados al backend (MySQL) mediante api.js.
 *
 * El carrito es de "invitado": cualquiera puede agregar productos sin iniciar sesión,
 * y se guarda en localStorage para que no se pierda al refrescar. Solo al confirmar
 * el pedido (checkout) se exige tener sesión iniciada.
 */
function App() {
  // Sesión: se restaura de localStorage si ya existía un login previo (mientras el token siga vigente)
  const [user, setUser] = useState(() => (obtenerToken() ? leerUsuarioGuardado() : null));

  // Vista actual: 'tienda_publica', 'login', 'registro', 'inventario', 'crear', 'carrito', 'usuarios', 'pedidos', 'categorias'
  const [currentView, setCurrentView] = useState('tienda_publica');

  // Catálogo real, traído desde MySQL a través de la API
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  // Carrito de invitado: arranca con lo que haya quedado guardado en el navegador
  const [cart, setCart] = useState(leerCarritoGuardado);

  // Cada vez que cambia el carrito, lo guardamos para que sobreviva a un refresh
  useEffect(() => {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(cart));
  }, [cart]);

  // ------------------------------------------------------------------
  // Sesión: cerrar sesión (declarado antes para poder registrarlo como
  // manejador del evento 401 más abajo)
  // ------------------------------------------------------------------
  const handleLogout = useCallback(() => {
    cerrarSesion(); // borra el token; el carrito de invitado NO se borra
    setUser(null);
    localStorage.removeItem(CLAVE_USUARIO);
    setCurrentView('tienda_publica');
  }, []);

  // Si el backend rechaza el token (sesión vencida, o el servidor se
  // reinició y la perdió de su memoria), cerramos sesión automáticamente
  // en la interfaz y avisamos, en vez de dejar un error confuso en pantalla.
  useEffect(() => {
    registrarManejador401(() => {
      if (user) {
        alert('Tu sesión ya no es válida (probablemente el servidor se reinició). Por favor inicia sesión de nuevo.');
        handleLogout();
      }
    });
  }, [user, handleLogout]);

  // ------------------------------------------------------------------
  // Carga de datos reales desde el backend
  // ------------------------------------------------------------------
  const cargarCatalogo = useCallback(async () => {
    setCargandoCatalogo(true);
    setErrorCatalogo('');
    try {
      const [productosDb, categoriasDb] = await Promise.all([
        listarProductos(),
        listarCategorias()
      ]);

      const mapaCategorias = {};
      (categoriasDb || []).forEach(cat => { mapaCategorias[cat.id_categoria] = cat.nombre; });

      // Normalizamos cada producto agregando alias en camelCase (compatibles con
      // los componentes ya existentes) sin perder los campos originales de la API.
      const normalizados = (productosDb || []).map(p => ({
        ...p,
        idProducto: p.id_producto,
        costoProducto: p.costo_producto,
        precioMayorista: p.precio_mayorista,
        imagenUrl: p.imagen_url,
        imagenesPorColor: p.imagenes_por_color || '',
        idCategoria: p.id_categoria,
        genero: p.genero || 'Unisex',
        categoria: mapaCategorias[p.id_categoria] || ''
      }));

      setCategorias(categoriasDb || []);
      setProducts(normalizados);
    } catch (error) {
      console.error(error);
      setErrorCatalogo('No se pudo conectar con el servidor API (http://localhost:8080). Verifica que ServidorApi esté corriendo, que MySQL esté encendido y que hayas ejecutado los scripts de migración.');
    } finally {
      setCargandoCatalogo(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // ------------------------------------------------------------------
  // Sesión: login / registro (contra la tabla `clientes`)
  // ------------------------------------------------------------------
  const handleLogin = async (email, password, role) => {
    try {
      const cliente = await iniciarSesion({ correo: email, password, rol: role });
      const usuarioSesion = {
        id_clientes: cliente.id_clientes,
        name: cliente.nombre,
        email: cliente.correo,
        role: NOMBRE_ROL[cliente.id_rol] || role
      };
      setUser(usuarioSesion);
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioSesion));

      if (usuarioSesion.role === 'Administrador' || usuarioSesion.role === 'Vendedor') {
        setCurrentView('inventario');
      } else {
        setCurrentView('tienda_publica');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Credenciales inválidas.' };
    }
  };

  const handleRegister = async (newUser) => {
    // 1. Registrar el cliente en MySQL (el backend valida la complejidad de la contraseña)
    await registrarCliente({
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      identificacion: newUser.identificacion,
      telefono: newUser.telefono,
      direccion: newUser.direccion,
      correo: newUser.correo,
      password: newUser.password,
      id_rol: newUser.idRol
    });

    // 2. Iniciar sesión automáticamente con las credenciales recién creadas
    const resultado = await handleLogin(newUser.correo, newUser.password, 'Cliente');
    if (!resultado.success) {
      // El registro sí quedó guardado; solo informamos que debe iniciar sesión manualmente
      setCurrentView('login');
      throw new Error('Cliente registrado. Por favor inicia sesión.');
    }
  };

  // ------------------------------------------------------------------
  // CRUD de productos (Administrador / Vendedor) contra la tabla `producto`
  // ------------------------------------------------------------------
  const handleAddProduct = async (newProduct) => {
    await guardarProducto({
      nombre: newProduct.nombre,
      descripcion: newProduct.descripcion,
      talla: newProduct.talla,
      color: newProduct.color,
      genero: newProduct.genero,
      precio_mayorista: newProduct.precioMayorista,
      costo_producto: newProduct.costoProducto,
      stock: newProduct.stock,
      imagen_url: newProduct.imagenUrl,
      imagenes_por_color: newProduct.imagenesPorColor,
      id_categoria: newProduct.idCategoria
    });
    await cargarCatalogo();
    setCurrentView('inventario');
    // Si guardarProducto falla, lanza un error y este bloque no sigue;
    // ProductForm es quien captura ese error, avisa y CONSERVA lo que el usuario escribió.
  };

  const handleUpdateProduct = async (id, updatedProduct) => {
    const productoActual = products.find(p => p.idProducto === id || p.id_producto === id);
    try {
      await actualizarProducto({
        id_producto: id,
        nombre: updatedProduct.nombre,
        descripcion: updatedProduct.descripcion,
        talla: updatedProduct.talla,
        color: updatedProduct.color,
        genero: updatedProduct.genero || (productoActual ? productoActual.genero : 'Unisex'),
        precio_mayorista: updatedProduct.precioMayorista ?? updatedProduct.precio_mayorista,
        costo_producto: updatedProduct.costoProducto ?? updatedProduct.costo,
        stock: updatedProduct.stock,
        imagen_url: updatedProduct.imagenUrl ?? updatedProduct.imagen,
        imagenes_por_color: updatedProduct.imagenesPorColor ?? (productoActual ? productoActual.imagenesPorColor : ''),
        // ProductList no permite cambiar la categoría; conservamos la actual
        id_categoria: productoActual ? productoActual.idCategoria : 1
      });
      await cargarCatalogo();
    } catch (error) {
      alert(`No se pudo actualizar el producto: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await eliminarProducto(id);
      await cargarCatalogo();
    } catch (error) {
      alert(`No se pudo eliminar el producto: ${error.message}`);
    }
  };

  // ------------------------------------------------------------------
  // Carrito de invitado y creación de pedidos (tablas `pedido` y `detalle_pedido`)
  // ------------------------------------------------------------------
  const handleAddToCart = (item) => {
    setCart(prevCart => {
      const indiceExistente = prevCart.findIndex(
        i => i.idProducto === item.idProducto && i.talla === item.talla && i.color === item.color
      );
      if (indiceExistente >= 0) {
        const copia = [...prevCart];
        copia[indiceExistente] = {
          ...copia[indiceExistente],
          cantidad: copia[indiceExistente].cantidad + item.cantidad
        };
        return copia;
      }
      return [...prevCart, item];
    });
  };

  const handleUpdateCartQuantity = (index, cantidad) => {
    setCart(prevCart => {
      const copia = [...prevCart];
      const max = copia[index].stockDisponible || 99;
      copia[index] = { ...copia[index], cantidad: Math.max(1, Math.min(cantidad, max)) };
      return copia;
    });
  };

  const handleRemoveFromCart = (index) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (!user) {
      // El componente CartView es quien redirige a Login/Registro; esto es un respaldo.
      throw new Error('Debes iniciar sesión o registrarte para confirmar el pedido.');
    }
    const items = cart.map(item => ({
      id_producto: item.idProducto,
      talla: item.talla,
      color: item.color,
      cantidad: item.cantidad,
      precio_unitario: item.precioMayorista
    }));
    // El backend toma el id_cliente del token de sesión, no hace falta enviarlo
    const idPedido = await enviarPedidoCompleto(items);
    setCart([]);
    // Refrescamos el catálogo para reflejar el stock actualizado tras la compra
    await cargarCatalogo();
    return idPedido;
  };

  const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Barra de Navegación Global */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        setView={setCurrentView}
        cartCount={cartCount}
      />

      {/* RENDERIZADO CONDICIONAL DE VISTAS */}
      <main className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>

        {errorCatalogo && (
          <div style={{ backgroundColor: '#ffe6e6', color: '#b21f1f', padding: '12px 16px', borderRadius: '6px', marginBottom: '15px' }}>
            ⚠️ {errorCatalogo}
          </div>
        )}

        {/* Vista: Inicio de Sesión */}
        {currentView === 'login' && (
          <LoginCard
            onLogin={handleLogin}
            onCancel={() => setCurrentView('tienda_publica')}
            onGoToRegister={() => setCurrentView('registro')}
          />
        )}

        {/* Vista: Registro de Cliente */}
        {currentView === 'registro' && (
          <RegisterCard
            onRegister={handleRegister}
            onCancel={() => setCurrentView('tienda_publica')}
            onGoToLogin={() => setCurrentView('login')}
          />
        )}

        {/* Vista: Catálogo / Tienda Pública (accesible para invitados) */}
        {currentView === 'tienda_publica' && (
          cargandoCatalogo ? (
            <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando catálogo desde la base de datos...</p>
          ) : (
            <CustomerStore
              products={products}
              categorias={categorias}
              user={user}
              onToggleLoginScreen={() => setCurrentView('login')}
              onAddToCart={handleAddToCart}
            />
          )
        )}

        {/* Vista: Carrito de Compras (de invitado; pide login solo al confirmar) */}
        {currentView === 'carrito' && (
          <CartView
            cart={cart}
            user={user}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
            onGoToStore={() => setCurrentView('tienda_publica')}
            onGoToLogin={() => setCurrentView('login')}
            onGoToRegister={() => setCurrentView('registro')}
          />
        )}

        {/* Vista: Control de Inventario y Valoración (Administrador / Vendedor) */}
        {currentView === 'inventario' && (
          <>
            {user?.role === 'Administrador' && <AdminDashboard products={products} />}
            <ProductList
              products={products}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </>
        )}

        {/* Vista: Registro de Nuevo Producto (Administrador / Vendedor) */}
        {currentView === 'crear' && (
          <ProductForm onAddProduct={handleAddProduct} categorias={categorias} />
        )}

        {/* Vista: Gestión de Usuarios (solo Administrador) */}
        {currentView === 'usuarios' && user?.role === 'Administrador' && (
          <UserManagement />
        )}

        {/* Vista: Gestión de Categorías (solo Administrador) */}
        {currentView === 'categorias' && user?.role === 'Administrador' && (
          <CategoryManagement onCategoriasChange={cargarCatalogo} />
        )}

        {/* Vista: Pedidos — Administrador/Vendedor ven todos, Cliente ve solo los suyos */}
        {currentView === 'pedidos' && user && (
          <AdminOrders modoCliente={user.role === 'Cliente'} />
        )}

      </main>
    </div>
  );
}

export default App;
