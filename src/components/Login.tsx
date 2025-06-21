import { useState } from 'react';
import './Login.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = () => {
    if (usuario === 'admin' && contrasena === '1234') {
      alert('Inicio de sesión exitoso');
      // Aquí podrías redirigir a otro componente con useNavigate()
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login">
      <div className="login-logo">
        <img src="/logo.png" alt="Rider Motos" />
      </div>
      <div className="login-form">
        <h2>INICIO DE SESIÓN</h2>
        <input
          type="text"
          placeholder="USUARIO"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
        <input
          type="password"
          placeholder="CONTRASEÑA"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <button onClick={handleLogin}>Iniciar</button>
      </div>
    </div>
  );
}

export default Login;