import React, { useState, useEffect, useCallback } from 'react';
import { listarClientes, actualizarCliente, eliminarCliente } from '../../api';

const NOMBRE_ROL = { 1: 'Administrador', 2: 'Cliente', 3: 'Vendedor' };

const CAMPOS_VACIOS = {
  nombre: '', apellido: '', identificacion: '', telefono: '', direccion: '', correo: '', id_rol: 2, nuevaPassword: ''
};

/**
 * Componente: UserManagement
 * Solo visible para el Administrador. Muestra todos los clientes registrados
 * con sus datos completos (nombre, identificación, teléfono, dirección, rol),
 * permite editar cualquier campo (incluida una contraseña nueva, si hace falta
 * restablecerla) y eliminar usuarios.
 *
 * Nota de seguridad: esta pantalla NO muestra la contraseña guardada de nadie,
 * ni siquiera al Administrador. Mostrar contraseñas en texto plano es una mala
 * práctica de seguridad aunque sea "solo para el admin" — en vez de eso, el
 * Administrador puede ASIGNAR una contraseña nueva a cualquier usuario desde
 * el formulario de edición, que es lo que realmente hace falta en la práctica
 * (por ejemplo, si un cliente olvidó la suya).
 */
const UserManagement = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState(CAMPOS_VACIOS);
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const lista = await listarClientes();
      setUsuarios(lista || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista de usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const iniciarEdicion = (u) => {
    setEditandoId(u.id_clientes);
    setFormEdicion({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      identificacion: u.identificacion || '',
      telefono: u.telefono || '',
      direccion: u.direccion || '',
      correo: u.correo || '',
      id_rol: u.id_rol,
      nuevaPassword: ''
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdicion(CAMPOS_VACIOS);
  };

  const handleGuardar = async (idClientes) => {
    if (formEdicion.nuevaPassword && formEdicion.nuevaPassword.length > 0) {
      const p = formEdicion.nuevaPassword;
      if (p.length < 8 || !/[A-Za-z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) {
        alert('La nueva contraseña debe tener mínimo 8 caracteres, con al menos una letra, un número y un símbolo (@, #, $, %, !, -, _...).');
        return;
      }
    }

    setGuardando(true);
    try {
      await actualizarCliente({
        id_clientes: idClientes,
        nombre: formEdicion.nombre,
        apellido: formEdicion.apellido,
        identificacion: formEdicion.identificacion,
        telefono: formEdicion.telefono,
        direccion: formEdicion.direccion,
        correo: formEdicion.correo,
        password: formEdicion.nuevaPassword, // vacío = el backend conserva la contraseña actual
        id_rol: Number(formEdicion.id_rol)
      });
      await cargarUsuarios();
      cancelarEdicion();
    } catch (err) {
      alert(`No se pudo actualizar el usuario: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (u) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${u.nombre} ${u.apellido} (${u.correo})? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarCliente(u.id_clientes);
      await cargarUsuarios();
    } catch (err) {
      alert(`No se pudo eliminar el usuario: ${err.message}`);
    }
  };

  if (cargando) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando usuarios...</p>;

  if (error) {
    return (
      <div style={{ backgroundColor: '#ffe6e6', color: '#b21f1f', padding: '14px 18px', borderRadius: '6px', marginTop: '20px' }}>
        ⚠️ {error}
        {error.toLowerCase().includes('sesión') && (
          <p style={{ marginTop: '8px', marginBottom: 0 }}>
            Este panel solo es visible para el rol Administrador. Verifica que iniciaste sesión con esa cuenta.
          </p>
        )}
      </div>
    );
  }

  const inputEdicion = (campo, tipo = 'text', placeholder = '') => (
    <input
      type={tipo}
      value={formEdicion[campo]}
      placeholder={placeholder}
      onChange={(e) => setFormEdicion({ ...formEdicion, [campo]: e.target.value })}
      style={{ width: '100%', padding: '5px', fontSize: '0.85rem' }}
    />
  );

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ color: '#1a2a6c' }}>👥 Gestión de Usuarios</h2>
      <p style={{ color: '#555', marginBottom: '10px' }}>
        Aquí ves todos los usuarios registrados con su información completa. Da clic en "Editar" para
        cambiar cualquier dato (incluyendo el rol o asignar una contraseña nueva) o en "Eliminar" para borrarlo.
      </p>
      <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '16px', fontStyle: 'italic' }}>
        🔒 Por seguridad, esta pantalla no muestra la contraseña guardada de nadie. Si un usuario necesita
        recuperar acceso, edítalo y asígnale una contraseña nueva.
      </p>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Nombre</th>
              <th style={{ padding: '10px' }}>Correo</th>
              <th style={{ padding: '10px' }}>Identificación</th>
              <th style={{ padding: '10px' }}>Teléfono</th>
              <th style={{ padding: '10px' }}>Dirección</th>
              <th style={{ padding: '10px' }}>Rol</th>
              <th style={{ padding: '10px' }}></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const enEdicion = editandoId === u.id_clientes;
              return (
                <tr key={u.id_clientes} style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
                  {enEdicion ? (
                    <>
                      <td style={{ padding: '8px' }}>
                        {inputEdicion('nombre', 'text', 'Nombre')}
                        <div style={{ marginTop: '4px' }}>{inputEdicion('apellido', 'text', 'Apellido')}</div>
                      </td>
                      <td style={{ padding: '8px' }}>{inputEdicion('correo', 'email')}</td>
                      <td style={{ padding: '8px' }}>{inputEdicion('identificacion')}</td>
                      <td style={{ padding: '8px' }}>{inputEdicion('telefono')}</td>
                      <td style={{ padding: '8px' }}>{inputEdicion('direccion')}</td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={formEdicion.id_rol}
                          onChange={(e) => setFormEdicion({ ...formEdicion, id_rol: e.target.value })}
                          style={{ width: '100%', padding: '5px' }}
                        >
                          <option value={2}>Cliente</option>
                          <option value={3}>Vendedor</option>
                          <option value={1}>Administrador</option>
                        </select>
                        <input
                          type="password"
                          placeholder="Nueva contraseña (opcional)"
                          value={formEdicion.nuevaPassword}
                          onChange={(e) => setFormEdicion({ ...formEdicion, nuevaPassword: e.target.value })}
                          style={{ width: '100%', padding: '5px', marginTop: '4px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleGuardar(u.id_clientes)} disabled={guardando} style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', marginBottom: '4px' }}>
                          {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={cancelarEdicion} style={{ backgroundColor: '#999', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px' }}>{u.nombre} {u.apellido}</td>
                      <td style={{ padding: '10px' }}>{u.correo}</td>
                      <td style={{ padding: '10px' }}>{u.identificacion}</td>
                      <td style={{ padding: '10px' }}>{u.telefono}</td>
                      <td style={{ padding: '10px' }}>{u.direccion}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold',
                          backgroundColor: u.id_rol === 1 ? '#fce4ec' : u.id_rol === 3 ? '#fff3e0' : '#e8f5e9',
                          color: u.id_rol === 1 ? '#ad1457' : u.id_rol === 3 ? '#e65100' : '#2e7d32'
                        }}>
                          {NOMBRE_ROL[u.id_rol] || 'Desconocido'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => iniciarEdicion(u)} style={{ backgroundColor: '#1a73e8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>
                          Editar
                        </button>
                        <button onClick={() => handleEliminar(u)} style={{ backgroundColor: '#d32f2f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                          Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {usuarios.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay usuarios registrados todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
