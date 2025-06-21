import { Link } from 'react-router-dom';
import './Inicio.css';
import riderLogo from '../assets/rider-logo.png'; // Importa el logo

function Inicio() {
  return (
    <div className="inicio">
      <img src={riderLogo} alt="Rider Motos" className="logo" />
      <h1>Bienvenido, Rider Motos</h1>
      <p>Por favor inicie sesión</p>
      <Link to="/login">
        <button className="btn-login">Iniciar Sesión</button>
      </Link>
    </div>
  );
}

export default Inicio;