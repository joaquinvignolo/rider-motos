import { Link } from 'react-router-dom';
import './Inicio.css';
import riderLogo from '../assets/rider-logo.png';

function Inicio() {
  return (
    <div className="inicio">
      <img src={riderLogo} alt="Rider Motos" className="logo" />
      <Link to="/login">
        <button className="btn-login">INICIAR SESIÓN</button>
      </Link>
    </div>
  );
}

export default Inicio;