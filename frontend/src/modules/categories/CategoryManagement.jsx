import React, { useState, useEffect, useCallback } from 'react';
import { listarCategorias, guardarCategoria, actualizarCategoria, eliminarCategoria } from '../../api';

/**
 * Componente: CategoryManagement
 * Panel para que el Administrador vea, cree, edite y elimine las categorías
 * (tipos de prenda) del catálogo, sin tener que tocar la base de datos directamente.
 */
const CategoryManagement = ({ onCategoriasChange }) => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({ nombre: '', descripcion: '' });
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' });
  const [guardandoNueva, setGuardandoNueva] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const lista = await listarCategorias();
      setCategorias(lista || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las categorías.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.nombre.trim()) return;
    setGuardandoNueva(true);
    try {
      await guardarCategoria({
        nombre: nuevaCategoria.nombre,
        descripcion: nuevaCategoria.descripcion,
        tipo_categoria: 'Tipo de Prenda'
      });
      setNuevaCategoria({ nombre: '', descripcion: '' });
      await cargar();
      if (onCategoriasChange) await onCategoriasChange();
    } catch (err) {
      alert(`No se pudo crear la categoría: ${err.message}`);
    } finally {
      setGuardandoNueva(false);
    }
  };

  const iniciarEdicion = (cat) => {
    setEditandoId(cat.id_categoria);
    setFormEdicion({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
  };

  const guardarEdicion = async (cat) => {
    try {
      await actualizarCategoria({
        id_categoria: cat.id_categoria,
        nombre: formEdicion.nombre,
        descripcion: formEdicion.descripcion,
        tipo_categoria: cat.tipo_categoria || 'Tipo de Prenda'
      });
      setEditandoId(null);
      await cargar();
      if (onCategoriasChange) await onCategoriasChange();
    } catch (err) {
      alert(`No se pudo actualizar la categoría: ${err.message}`);
    }
  };

  const handleEliminar = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"? Los productos que la usan quedarían sin categoría válida.`)) return;
    try {
      await eliminarCategoria(cat.id_categoria);
      await cargar();
      if (onCategoriasChange) await onCategoriasChange();
    } catch (err) {
      alert(`No se pudo eliminar la categoría: ${err.message}`);
    }
  };

  if (cargando) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando categorías...</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ color: '#1a2a6c' }}>🗂️ Gestión de Categorías (Tipos de Prenda)</h2>

      {error && (
        <div style={{ backgroundColor: '#ffe6e6', color: '#b21f1f', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Formulario para crear una categoría nueva */}
      <form onSubmit={handleCrear} style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Nombre de la categoría</label>
          <input
            type="text"
            value={nuevaCategoria.nombre}
            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
            placeholder="Ej: Gorras y Accesorios"
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        <div style={{ flex: '2 1 300px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Descripción</label>
          <input
            type="text"
            value={nuevaCategoria.descripcion}
            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })}
            placeholder="Ej: Gorras deportivas y accesorios varios"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" disabled={guardandoNueva} style={{ padding: '9px 18px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>
          {guardandoNueva ? 'Creando...' : '+ Crear'}
        </button>
      </form>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Nombre</th>
              <th style={{ padding: '10px' }}>Descripción</th>
              <th style={{ padding: '10px' }}></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id_categoria} style={{ borderBottom: '1px solid #eee' }}>
                {editandoId === cat.id_categoria ? (
                  <>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={formEdicion.nombre}
                        onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                        style={{ width: '100%', padding: '5px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={formEdicion.descripcion}
                        onChange={(e) => setFormEdicion({ ...formEdicion, descripcion: e.target.value })}
                        style={{ width: '100%', padding: '5px' }}
                      />
                    </td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => guardarEdicion(cat)} style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>Guardar</button>
                      <button onClick={() => setEditandoId(null)} style={{ backgroundColor: '#999', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px' }}><strong>{cat.nombre}</strong></td>
                    <td style={{ padding: '10px', color: '#666' }}>{cat.descripcion}</td>
                    <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => iniciarEdicion(cat)} style={{ backgroundColor: '#1a73e8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>Editar</button>
                      <button onClick={() => handleEliminar(cat)} style={{ backgroundColor: '#d32f2f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay categorías registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManagement;
