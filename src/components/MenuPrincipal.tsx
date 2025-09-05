import { useNavigate } from 'react-router-dom';
import './MenuPrincipal.css';

function MenuPrincipal() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("logueado"); 
    navigate('/login', { replace: true }); 
  };

  return (
    <div className="menu-principal">
      <div className="menu-content">
        <header>
          <h1 className="header-title-box">PANEL PRINCIPAL</h1>
        </header>

        <main
          className="menu-grid"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "64px",
            marginTop: "140px"
          }}
        >
          {}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <button onClick={() => navigate("/compras")}>COMPRAS</button>
            <button onClick={() => navigate("/productos")}>PRODUCTOS</button>
            <button onClick={() => navigate("/ventas")}>VENTAS</button>
          </div>
          {}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <button onClick={() => navigate("/clientes")}>CLIENTES</button>
            <button>PATENTAMIENTOS</button>
            <button onClick={() => navigate("/reportes")}>REPORTES</button>
          </div>
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
