import React from "react";

interface Props {
  pagina: number;
  totalPaginas: number;
  onAnterior: () => void;
  onSiguiente: () => void;
}

const PaginacionUnificada: React.FC<Props> = ({ pagina, totalPaginas, onAnterior, onSiguiente }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 18, gap: 10 }}>
    <button
      className="btn-agencia btn-pag"
      disabled={pagina === 1}
      onClick={onAnterior}
    >
      Anterior
    </button>
    <span style={{ color: "#fff", fontWeight: 600 }}>
      Página {pagina} de {totalPaginas}
    </span>
    <button
      className="btn-agencia btn-pag"
      disabled={pagina === totalPaginas || totalPaginas === 0}
      onClick={onSiguiente}
    >
      Siguiente
    </button>
  </div>
);

export default PaginacionUnificada;