import { useNavigate } from 'react-router-dom';
import './MenuPrincipal.css';
import riderLogo from '../assets/rider-logo.png';

function MenuPrincipal() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="menu-principal">
      <header>
        <img src={riderLogo} alt="Rider Motos" className="logo-menu" />
        <h1>Panel Principal</h1>
        <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <main className="menu-grid">
        <button>🛒 Productos</button>
        <button>👥 Clientes</button>
        <button>💰 Ventas</button>
        <button>🛂 Patentamientos</button>
        <button>📊 Reportes</button>
      </main>
    </div>
  );
}

export default MenuPrincipal;
