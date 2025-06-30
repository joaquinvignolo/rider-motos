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
      <div className="menu-content">
        <header>
          <img src={riderLogo} alt="Rider Motos" className="logo-menu" />
          <h1>PANEL PRINCIPAL</h1>
          <button className="logout-btn" onClick={handleLogout}>CERRAR SESIÓN</button>
        </header>

        <main className="menu-grid">
          <button onClick={() => navigate("/productos")}>PRODUCTOS</button>
          <button>CLIENTES</button>
          <button>VENTAS</button>
          <button>PATENTAMIENTOS</button>
          <button>REPORTES</button>
        </main>

        <div className="motivational-message">
          Gracias por utilizar nuestro sistema. Tu esfuerzo y dedicación son clave para el éxito de Rider Motos.
        </div>
      </div>

      <footer className="footer">
        <div>
          &copy; {new Date().getFullYear()} Rider Motos. Sistema interno para uso exclusivo del personal.
        </div>
      </footer>
    </div>
  );
}

export default MenuPrincipal;
