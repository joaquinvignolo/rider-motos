import { useNavigate } from 'react-router-dom';
import './MenuPrincipal.css';

function MenuPrincipal() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="menu-principal">
      <div className="menu-content">
        <header>
          <h1 className="header-title-box">PANEL PRINCIPAL</h1>
        </header>

        <main className="menu-grid">
          <button onClick={() => navigate("/productos")}>PRODUCTOS</button>
          <button>CLIENTES</button>
          <button onClick={() => navigate("/ventas")}>VENTAS</button>
          <button>PATENTAMIENTOS</button>
          <button>REPORTES</button>
        </main>
      </div>

      <div className="motivational-message">
        Gracias por utilizar nuestro sistema. Tu esfuerzo y dedicación son clave para el éxito de Rider Motos.
      </div>
      <button className="logout-btn" onClick={handleLogout}>CERRAR SESIÓN</button>

      <footer className="footer">
        <div>
          &copy; {new Date().getFullYear()} Rider Motos. Sistema interno para uso exclusivo del personal.
        </div>
      </footer>
    </div>
  );
}

export default MenuPrincipal;
