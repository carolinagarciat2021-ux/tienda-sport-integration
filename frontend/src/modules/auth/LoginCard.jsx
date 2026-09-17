import React, { useState } from 'react';

/**
 * Componente: LoginCard
 * Formulario de inicio de sesión con selección de 3 roles y recuperación de clave/usuario.
 */
const LoginCard = ({ onLogin, onCancel, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Cliente'); // Cliente, Administrador, Vendedor
  const [error, setError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setForgotMsg('');

    if (!email || !password) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    setCargando(true);
    setError('');
    try {
      const resultado = await onLogin(email, password, role);
      if (!resultado.success) {
        setError(resultado.error || 'Credenciales o rol incorrectos.');
      }
    } finally {
      setCargando(false);
    }
  };

  // Lógica de recuperación de clave/usuario según el rol elegido
  const handleForgotPassword = () => {
    setError('');
    if (!email) {
      setError('Por favor, ingrese su correo electrónico para solicitar la recuperación.');
      return;
    }

    if (role === 'Vendedor') {
      setForgotMsg('⚠️ Aviso Vendedor: Debe pedírsela o contactar al Administrador para restablecer su usuario o contraseña.');
    } else {
      setForgotMsg(`✅ Aviso ${role}: Se ha enviado un enlace/instrucción de recuperación al correo: ${email}`);
    }
  };

  return (
    <div className="login-wrapper" style={{ maxWidth: '420px', margin: '40px auto', padding: '24px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <div className="login-card">
        <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>Tienda Sport</h2>
        <p className="subtitle" style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Ingreso Seguro al Sistema</p>

        {error && <div className="alert-danger" style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
        {forgotMsg && <div className="alert-info" style={{ color: '#0c5460', backgroundColor: '#d1ecf1', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{forgotMsg}</div>}

        <form onSubmit={handleSubmit}>
          {/* Selección de los 3 Roles Obligatorios */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Seleccione Rol de Acceso:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="Cliente">Cliente</option>
              <option value="Administrador">Administrador</option>
              <option value="Vendedor">Vendedor</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Correo Electrónico:</label>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@tiendasport.com"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={cargando} style={{ width: '100%', padding: '10px', backgroundColor: '#1a2a6c', color: '#fff', border: 'none', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer', marginBottom: '10px' }}>
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>

          <button 
            type="button" 
            onClick={handleForgotPassword} 
            style={{ background: 'none', border: 'none', color: '#1a2a6c', textDecoration: 'underline', cursor: 'pointer', width: '100%', fontSize: '0.88rem', marginBottom: '12px' }}
          >
            ¿Olvidaste tu usuario o contraseña?
          </button>

          <button type="button" onClick={onCancel} style={{ width: '100%', padding: '8px', background: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
            Volver al Catálogo Público
          </button>
        </form>

        {onGoToRegister && (
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem' }}>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              style={{ background: 'none', border: 'none', color: '#1a2a6c', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Regístrate aquí
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginCard;