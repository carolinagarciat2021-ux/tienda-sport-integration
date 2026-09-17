// frontend/src/api.js
// Capa de comunicación entre el frontend (React) y el backend (ServidorApi.java / MySQL).

const API_BASE = 'http://localhost:8080/api';

// ============ MANEJO DEL TOKEN DE SESIÓN ============
// El token lo devuelve /api/login y hay que reenviarlo en cada petición
// protegida (header Authorization). Se guarda en localStorage para que la
// sesión sobreviva si el usuario refresca la página.
const CLAVE_TOKEN = 'tiendaSport_token';

export const guardarToken = (token) => {
  if (token) localStorage.setItem(CLAVE_TOKEN, token);
};

export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);

export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN);

/**
 * Función genérica para enviar peticiones HTTP a la API.
 * Soporta GET, POST, PUT y DELETE, y adjunta el token de sesión
 * automáticamente si el usuario ya inició sesión.
 */
const apiRequest = async (endpoint, metodo = 'GET', datos = null) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = obtenerToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opciones = { method: metodo, headers };
    if (datos !== null) {
      opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch(`${API_BASE}/${endpoint}`, opciones);

    // Intentamos parsear el JSON aunque la respuesta no sea 2xx,
    // porque el backend siempre responde con un cuerpo JSON (incluso en errores).
    let cuerpo = null;
    const texto = await respuesta.text();
    if (texto) {
      try { cuerpo = JSON.parse(texto); } catch (e) { cuerpo = texto; }
    }

    if (!respuesta.ok) {
      const mensajeError = (cuerpo && cuerpo.error) ? cuerpo.error : `Error ${respuesta.status} en el servidor`;
      throw new Error(mensajeError);
    }

    return cuerpo;
  } catch (error) {
    console.error(`Error al conectar con /api/${endpoint}:`, error);
    throw error;
  }
};

// ============ CLIENTES ============
export const listarClientes = () => apiRequest('clientes', 'GET'); // solo Administrador
export const registrarCliente = (datosCliente) => apiRequest('clientes', 'POST', datosCliente);
export const actualizarCliente = (datosCliente) => apiRequest('clientes', 'PUT', datosCliente);
export const eliminarCliente = (id) => apiRequest(`clientes?id=${id}`, 'DELETE');

// ============ LOGIN ============
// Espera { correo, password, rol } y devuelve los datos del cliente autenticado + token.
export const iniciarSesion = async (credenciales) => {
  const resultado = await apiRequest('login', 'POST', credenciales);
  if (resultado && resultado.token) {
    guardarToken(resultado.token);
  }
  return resultado;
};

export const cerrarSesion = () => {
  borrarToken();
};

// ============ CATEGORÍAS (tipos de prenda) ============
export const listarCategorias = () => apiRequest('categorias', 'GET');
export const guardarCategoria = (datosCategoria) => apiRequest('categorias', 'POST', datosCategoria); // Admin
export const actualizarCategoria = (datosCategoria) => apiRequest('categorias', 'PUT', datosCategoria); // Admin
export const eliminarCategoria = (id) => apiRequest(`categorias?id=${id}`, 'DELETE'); // Admin

// ============ PRODUCTOS ============
export const listarProductos = () => apiRequest('producto', 'GET'); // pública (invitados incluidos)
export const guardarProducto = (datosProducto) => apiRequest('producto', 'POST', datosProducto); // Admin/Vendedor
export const actualizarProducto = (datosProducto) => apiRequest('producto', 'PUT', datosProducto); // Admin/Vendedor
export const eliminarProducto = (id) => apiRequest(`producto?id=${id}`, 'DELETE'); // Admin

// ============ PEDIDOS ============
export const listarPedidos = () => apiRequest('pedidos', 'GET'); // requiere sesión
// datosPedido: { estado }. El id_cliente lo toma el backend del token, no del body.
export const crearPedido = (datosPedido) => apiRequest('pedidos', 'POST', datosPedido);
export const actualizarPedido = (datosPedido) => apiRequest('pedidos', 'PUT', datosPedido); // Admin/Vendedor
export const eliminarPedido = (id) => apiRequest(`pedidos?id=${id}`, 'DELETE'); // Admin

// ============ DETALLE DE PEDIDO (líneas del carrito) ============
// datosDetalle: { id_pedido, id_producto, cantidad, precio_unitario }
export const crearDetallePedido = (datosDetalle) => apiRequest('detalle_pedido', 'POST', datosDetalle); // requiere sesión
export const listarDetallePedido = (idPedido) => apiRequest(`detalle_pedido?id_pedido=${idPedido}`, 'GET');

/**
 * Envía un pedido completo: crea el pedido (asociado automáticamente al
 * usuario logueado, según su token) y luego cada línea del carrito como
 * detalle_pedido (esto también descuenta el stock en el backend).
 * items: [{ id_producto, cantidad, precio_unitario }]
 * Devuelve el id_pedido creado.
 */
export const enviarPedidoCompleto = async (items) => {
  const resultadoPedido = await crearPedido({ estado: 'Pendiente' });
  const idPedido = resultadoPedido.id_pedido;

  for (const item of items) {
    await crearDetallePedido({
      id_pedido: idPedido,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    });
  }

  return idPedido;
};
