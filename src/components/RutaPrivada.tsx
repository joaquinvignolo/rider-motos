import { Navigate } from "react-router-dom";

const RutaPrivada = ({ children }) => {
  const logueado = localStorage.getItem("logueado") === "1";
  return logueado ? children : <Navigate to="/login" replace />;
};

export default RutaPrivada;