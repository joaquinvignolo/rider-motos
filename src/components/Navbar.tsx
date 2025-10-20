import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  moduloActual?: string;
}

const Navbar: React.FC<NavbarProps> = ({ moduloActual }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        borderBottom: "2px solid #a32020",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 1000,
        boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
      }}
    >
      {/* Logo/Título */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            background: "#a32020",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "1.2rem",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => navigate("/menu")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(163, 32, 32, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
          title="Volver al menú"
        >
          R
        </div>
        <span
          style={{
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          RIDER MOTOS
        </span>
      </div>

      {/* Navegación */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Botón Menú Principal */}
        {location.pathname !== "/menu" && (
          <button
            onClick={() => navigate("/menu")}
            style={{
              background: "#a32020",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#8a1a1a";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(163, 32, 32, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#a32020";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>←</span>
            Menú Principal
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;