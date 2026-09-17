import React from 'react';

/**
 * Componente: Navbar
 * Controla la navegación global de Tienda Sport según el rol del usuario logueado.
 */
const Navbar = ({ user, onLogout, setView, cartCount = 0 }) => {
  return (
    <header className="navbar-main" style={{ backgroundColor: '#1a2a6c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', color: '#fff' }}>
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Tienda Sport</h1>
        {user && (
          <span className="role-tag" style={{ backgroundColor: '#b21f1f', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {user.role}
          </span>
        )}
      </div>

      <nav className="nav-links" style={{ display: 'flex', gap: '12px' }}>
        {user?.role === 'Administrador' && (
          <>
            <button onClick={() => setView('inventario')} className="nav-btn">📋 Ver Inventario y Valoración</button>
            <button onClick={() => setView('crear')} className="nav-btn">➕ Registrar Producto</button>
          </>
        )}
        <button onClick={() => setView('tienda_publica')} className="nav-btn" style={{ color: '#ffeb3b', fontWeight: 'bold' }}>
          🏪 Catálogo / Tienda
        </button>
        {(!user || user.role === 'Cliente') && (
          <button onClick={() => setView('carrito')} className="nav-btn" style={{ position: 'relative' }}>
            🛒 Carrito {cartCount > 0 && (
              <span style={{ backgroundColor: '#00e676', color: '#111', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '4px' }}>
                {cartCount}
              </span>
            )}
          </button>
        )}
      </nav>

      <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user ? (
          <>
            <span>Bienvenido, <strong>{user.name}</strong></span>
            <button onClick={onLogout} className="btn-logout" style={{ padding: '6px 12px', cursor: 'pointer' }}>Cerrar Sesión</button>
          </>
        ) : (
          <>
            <button onClick={() => setView('login')} className="nav-btn" style={{ backgroundColor: '#00e676', color: '#111', fontWeight: 'bold', padding: '6px 14px', borderRadius: '4px' }}>
              🔒 Iniciar Sesión
            </button>
            <button onClick={() => setView('registro')} className="nav-btn" style={{ backgroundColor: '#fff', color: '#1a2a6c', fontWeight: 'bold', padding: '6px 14px', borderRadius: '4px' }}>
              📝 Registrarse
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
