import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './Login.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena }),
      });
      if (response.ok) {
        localStorage.setItem("logueado", "1"); 
        navigate('/menu');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="login">
      <div className="login-form">
        <h2>INICIO DE SESIÓN</h2>
        <input
          type="text"
          placeholder="usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
        <input
          type="password"
          placeholder="contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <button onClick={handleLogin}>INICIAR</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;