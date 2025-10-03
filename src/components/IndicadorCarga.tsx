import React from "react";
import "./IndicadorCarga.css";

const IndicadorCarga: React.FC<{ mensaje?: string }> = ({ mensaje = "Procesando..." }) => (
  <div className="indicador-carga">
    <span className="spinner" />
    {mensaje}
  </div>
);

export default IndicadorCarga;