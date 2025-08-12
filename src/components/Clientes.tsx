import React, { useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  activo: number;
};

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/clientes")
      .then(res => res.json())
      .then(data => setClientes(data));
  }, []);

  return (
    <div>
      <h1>Clientes</h1>
      <ul>
        {clientes.map(cliente => (
          <li key={cliente.id}>
            <b>{cliente.nombre} {cliente.apellido}</b> - {cliente.telefono} - {cliente.correo}
            {cliente.activo ? "" : " (Inactivo)"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Clientes;