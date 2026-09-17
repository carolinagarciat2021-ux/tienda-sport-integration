import React, { useState } from 'react';
import { registrarCliente } from '../api'; // Importa la función de api.js

const FormularioCliente = () => {
  // Estado para capturar los datos ingresados en los campos del formulario
  const [cliente, setCliente] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  // Actualiza los valores cuando escribes en los inputs
  const handleChange = (e) => {
    setCliente({
      ...cliente,
      [e.target.name]: e.target.value
    });
  };

  // Se ejecuta al pulsar el botón "Guardar Cliente"
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    try {
      // 1. Envía los datos a api.js -> ServidorApi.java -> MySQL
      const respuesta = await registrarCliente(cliente);
      alert(respuesta.mensaje); // Muestra la alerta de confirmación
    } catch (error) {
      alert('Error al conectar con la API o guardar en MySQL');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Registrar Nuevo Cliente</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre Completo: </label>
          <input 
            type="text" 
            name="nombre" 
            value={cliente.nombre} 
            onChange={handleChange} 
            required 
          />
        </div>
        <br />
        <div>
          <label>Correo Electrónico: </label>
          <input 
            type="email" 
            name="email" 
            value={cliente.email} 
            onChange={handleChange} 
            required 
          />
        </div>
        <br />
        <div>
          <label>Teléfono: </label>
          <input 
            type="text" 
            name="telefono" 
            value={cliente.telefono} 
            onChange={handleChange} 
          />
        </div>
        <br />
        <button type="submit">Guardar Cliente en MySQL</button>
      </form>
    </div>
  );
};

export default FormularioCliente;