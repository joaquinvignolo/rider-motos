import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Clientes.css";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  activo: number;
};

const CLIENTES_POR_PAGINA = 10;

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [pagina, setPagina] = useState(1);

  // Form fields
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Refresca la lista según el filtro actual
  const cargarClientes = () => {
    fetch(`http://localhost:3001/api/clientes${mostrarInactivos ? '?inactivos=1' : ''}`)
      .then(res => res.json())
      .then(data => setClientes(data));
  };

  useEffect(() => {
    cargarClientes();
    setPagina(1); // Reinicia a la primera página al cambiar filtro
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  const abrirFormNuevo = () => {
    setEditCliente(null);
    setNombre("");
    setApellido("");
    setTelefono("");
    setCorreo("");
    setError("");
    setShowForm(true);
  };

  const abrirFormEditar = (cliente: Cliente) => {
    setEditCliente(cliente);
    setNombre(cliente.nombre);
    setApellido(cliente.apellido);
    setTelefono(cliente.telefono);
    setCorreo(cliente.correo);
    setError("");
    setShowForm(true);
  };

  // Validaciones profesionales
  const validarCampos = () => {
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{2,}$/.test(nombre.trim()))
      return "El nombre debe tener al menos 2 letras y solo letras.";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{2,}$/.test(apellido.trim()))
      return "El apellido debe tener al menos 2 letras y solo letras.";
    if (!/^[0-9]{8,}$/.test(telefono.trim()))
      return "El teléfono debe tener al menos 8 dígitos y solo números.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
      return "Ingrese un correo electrónico válido.";
    // Validación de email único en frontend
    const emailExiste = clientes.some(
      c =>
        c.correo.toLowerCase() === correo.trim().toLowerCase() &&
        (!editCliente || c.id !== editCliente.id)
    );
    if (emailExiste) return "Ya existe un cliente con ese correo.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mensaje = validarCampos();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError("");
    const body = { nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim(), correo: correo.trim() };
    if (editCliente) {
      await fetch(`http://localhost:3001/api/clientes/${editCliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } else {
      await fetch("http://localhost:3001/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }
    setShowForm(false);
    cargarClientes();
  };

  const [confirmarDesactivar, setConfirmarDesactivar] = useState<Cliente | null>(null);
  const [confirmarReactivar, setConfirmarReactivar] = useState<Cliente | null>(null);

  const cambiarEstado = (cliente: Cliente) => {
    if (cliente.activo) {
      setConfirmarDesactivar(cliente);
    } else {
      setConfirmarReactivar(cliente);
    }
  };

  // Filtro y paginación
  const clientesFiltrados = clientes
    .filter(c =>
      (c.nombre + " " + c.apellido).toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono.includes(busqueda) ||
      c.correo.toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter(c => mostrarInactivos ? c.activo === 0 : c.activo === 1);

  const totalPaginas = Math.ceil(clientesFiltrados.length / CLIENTES_POR_PAGINA);
  const clientesPagina = clientesFiltrados.slice(
    (pagina - 1) * CLIENTES_POR_PAGINA,
    pagina * CLIENTES_POR_PAGINA
  );

  return (
    <>
      <div className="clientes-container">
        <div style={{ position: "fixed", top: 32, left: 32, zIndex: 100, display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            className="inicio-btn"
            style={{
              fontSize: "1.18rem",
              padding: "10px 28px",
              borderRadius: 8,
              fontWeight: 700,
              background: "#a32020",
              color: "#fff",
              border: "none",
              boxShadow: "0 2px 8px rgba(163,32,32,0.08)",
              cursor: "pointer",
              transition: "background 0.18s, box-shadow 0.18s"
            }}
            onClick={() => navigate("/menu")}
          >
            INICIO
          </button>
          <button
            className="inicio-btn"
            style={{
              fontSize: "1.18rem",
              padding: "10px 28px",
              borderRadius: 8,
              fontWeight: 700,
              background: "#a32020",
              color: "#fff",
              border: "none",
              boxShadow: "0 2px 8px rgba(163,32,32,0.08)",
              cursor: "pointer",
              transition: "background 0.18s, box-shadow 0.18s"
            }}
            onClick={() => navigate("/ventas")}
          >
            VOLVER A VENTAS
          </button>
        </div>
        <h1>Clientes</h1>
        <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
          <button
            className="clientes-btn agregar"
            onClick={abrirFormNuevo}
          >
            <span style={{display: "inline-flex", alignItems: "center", gap: 8}}>
              <svg width="20" height="20" viewBox="0 0 22 22" style={{marginRight: 2}}>
                <circle cx="11" cy="11" r="11" fill="#a32020"/>
                <rect x="10" y="5" width="2" height="12" rx="1" fill="white"/>
                <rect x="5" y="10" width="12" height="2" rx="1" fill="white"/>
              </svg>
              Agregar Cliente
            </span>
          </button>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={e => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: "1.5px solid #a32020",
              background: "#232526",
              color: "#fff",
              fontSize: "1rem",
              minWidth: 220
            }}
          />
          <button
            className="clientes-btn"
            style={{ marginLeft: 8, background: "#353535" }}
            onClick={() => {
              setMostrarInactivos(v => !v);
              setPagina(1);
            }}
            title={mostrarInactivos ? "Ver activos" : "Ver inactivos"}
          >
            {mostrarInactivos ? (
              // Cruz para inactivos
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#a32020"/>
                <path d="M7 7l8 8M15 7l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              // Tilde para activos
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#80c481ff"/>
                <path d="M6 12l4 4 6-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            )}
          </button>
        </div>
        <ul className="clientes-lista">
          {clientesPagina.map(cliente => (
            <li
              key={cliente.id}
              className={cliente.activo ? "cliente-activo" : "cliente-inactivo"}
            >
              <span>
                <b>{cliente.nombre} {cliente.apellido}</b> - {cliente.telefono} - {cliente.correo}
                {cliente.activo ? "" : " (Inactivo)"}
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button
                  className="clientes-btn editar"
                  onClick={() => abrirFormEditar(cliente)}
                  title="Editar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button
                  className="clientes-btn"
                  style={{ background: cliente.activo ? "#a32020" : "#353535" }}
                  onClick={() => cambiarEstado(cliente)}
                  title={cliente.activo ? "Inactivar" : "Activar"}
                >
                  {cliente.activo ? "Inactivar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
            <button
              className="clientes-btn"
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
            >
              {"<"}
            </button>
            <span style={{ color: "#fff", alignSelf: "center" }}>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              className="clientes-btn"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina(p => p + 1)}
            >
              {">"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="clientes-modal-backdrop">
            <form className="clientes-modal" onSubmit={handleSubmit}>
              <h2>{editCliente ? "Editar Cliente" : "Agregar Cliente"}</h2>
              {error && (
                <div style={{
                  background: "#fff3cd",
                  color: "#a32020",
                  border: "1.5px solid #a32020",
                  borderRadius: 8,
                  padding: "10px 18px",
                  marginBottom: 12,
                  fontWeight: "bold",
                  fontSize: "1.08rem",
                  textAlign: "center"
                }}>
                  {error}
                </div>
              )}
              <label>
                Nombre:
                <input value={nombre} onChange={e => setNombre(e.target.value)} required />
              </label>
              <label>
                Apellido:
                <input value={apellido} onChange={e => setApellido(e.target.value)} required />
              </label>
              <label>
                Teléfono:
                <input value={telefono} onChange={e => setTelefono(e.target.value)} required />
              </label>
              <label>
                Correo:
                <input value={correo} onChange={e => setCorreo(e.target.value)} required type="email" />
              </label>
              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button className="clientes-btn agregar" type="submit">
                  {editCliente ? "Guardar cambios" : "Agregar"}
                </button>
                <button
                  className="clientes-btn"
                  type="button"
                  style={{ background: "#353535" }}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {confirmarDesactivar && (
          <div className="clientes-modal-backdrop">
            <div className="clientes-modal" style={{ maxWidth: 340, textAlign: "center" }}>
              <h2 style={{ color: "#a32020" }}>Desactivar cliente</h2>
              <p>
                ¿Seguro que deseas desactivar a<br />
                <b>{confirmarDesactivar.nombre} {confirmarDesactivar.apellido}</b>?
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 18 }}>
                <button
                  className="clientes-btn"
                  style={{ background: "#a32020" }}
                  onClick={async () => {
                    await fetch(`http://localhost:3001/api/clientes/${confirmarDesactivar.id}/activo`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ activo: 0 })
                    });
                    setConfirmarDesactivar(null);
                    cargarClientes();
                  }}
                >
                  Sí, desactivar
                </button>
                <button
                  className="clientes-btn"
                  style={{ background: "#353535" }}
                  onClick={() => setConfirmarDesactivar(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmarReactivar && (
          <div className="clientes-modal-backdrop">
            <div className="clientes-modal" style={{ maxWidth: 340, textAlign: "center" }}>
              <h2 style={{ color: "#80c481" }}>Reactivar cliente</h2>
              <p>
                ¿Seguro que deseas reactivar a<br />
                <b>{confirmarReactivar.nombre} {confirmarReactivar.apellido}</b>?
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 18 }}>
                <button
                  className="clientes-btn"
                  style={{ background: "#80c481", color: "#232526" }}
                  onClick={async () => {
                    await fetch(`http://localhost:3001/api/clientes/${confirmarReactivar.id}/activo`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ activo: 1 })
                    });
                    setConfirmarReactivar(null);
                    cargarClientes();
                  }}
                >
                  Sí, reactivar
                </button>
                <button
                  className="clientes-btn"
                  style={{ background: "#353535" }}
                  onClick={() => setConfirmarReactivar(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Clientes;