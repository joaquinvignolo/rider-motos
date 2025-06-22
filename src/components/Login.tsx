import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const usuarioValido = 'admin';
const contrasenaValida = '1234';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (usuario === usuarioValido && contrasena === contrasenaValida) {
      navigate('/menu');
    } else {
      setError('Usuario o contraseña incorrectos');
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