import React, { useState } from 'react';

/**
 * Componente: RegisterCard
 * Registro de nuevos usuarios/clientes con validación detallada de errores (REGEX) y texto limpio.
 */
const RegisterCard = ({ onRegister, onCancel, onGoToLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    identificacion: '',
    telefono: '',
    direccion: '',
    correo: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const { correo, nombre, password, identificacion, telefono, direccion } = formData;
    if (!nombre || !correo || !password || !identificacion || !telefono || !direccion) {
      return "Por favor, complete todos los campos obligatorios (*).";
    }
    // Validación exacta requerida: sin espacios y con formato '@'
    if (correo.includes(" ")) {
      return "Error: No se permiten espacios en el correo electrónico.";
    }
    const regexEmail = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!regexEmail.test(correo)) {
      return "Error: El correo electrónico debe contener un formato válido con '@'.";
    }
    // Misma regla que valida el backend: mínimo 8 caracteres, con letras y números.
    // Se valida aquí también para que el usuario vea el error al instante, sin
    // esperar la respuesta del servidor.
    if (password.length < 8) {
      return "La contraseña debe tener mínimo 8 caracteres.";
    }
    const tieneLetra = /[A-Za-z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    if (!tieneLetra || !tieneNumero) {
      return "La contraseña debe incluir al menos una letra y un número.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCargando(true);
    try {
      // Petición de registro real: guarda el cliente en MySQL vía la API
      await onRegister({
        ...formData,
        idRol: 2 // Rol Cliente por defecto
      });
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="card-form" style={{ maxWidth: '500px', margin: '20px auto', padding: '24px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3 style={{ textAlign: 'center' }}>Registro de Nuevo Cliente</h3>

      {error && <div className="alert-danger" style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="grid-form">
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label>Nombre (*):</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label>Apellido:</label>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label>Correo Electrónico (*):</label>
          <input type="email" name="correo" value={formData.correo} onChange={handleChange} required placeholder="ejemplo@correo.com" style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label>Contraseña (*):</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} style={{ width: '100%', padding: '8px' }} />
          <p style={{ fontSize: '0.75rem', color: '#666', margin: '4px 0 0 0' }}>
            Mínimo 8 caracteres, con al menos una letra y un número.
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label>Identificación / Cédula (*):</label>
          <input type="text" name="identificacion" value={formData.identificacion} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label>Teléfono (*):</label>
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Dirección (*):</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <button type="submit" className="btn-success" disabled={cargando} style={{ width: '100%', padding: '10px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer' }}>
          {cargando ? 'Registrando...' : 'Crear Usuario y Registrarse'}
        </button>

        <button type="button" onClick={onCancel} style={{ width: '100%', padding: '8px', marginTop: '10px', background: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}>
          Volver
        </button>
      </form>

      {onGoToLogin && (
        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            style={{ background: 'none', border: 'none', color: '#1a2a6c', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Inicia sesión aquí
          </button>
        </p>
      )}
    </div>
  );
};

export default RegisterCard;