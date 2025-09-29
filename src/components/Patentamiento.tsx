import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Patentamiento.css";
import PaginacionUnificada from "./PaginacionUnificada";

const estados = ["Todos los estados", "Pendiente", "En Proceso", "Completado"];

const Patentamiento: React.FC = () => {
  const navigate = useNavigate();
  const [estadoFiltro, setEstadoFiltro] = useState(estados[0]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [ventasDisponibles, setVentasDisponibles] = useState<any[]>([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<string | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");
  const [motoSeleccionada, setMotoSeleccionada] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [tipoMensaje, setTipoMensaje] = useState<"error" | "success">("success");
  const [tramites, setTramites] = useState<any[]>([]);
  const [tramiteEdit, setTramiteEdit] = useState<any | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("Pendiente");
  const [paginaActual, setPaginaActual] = useState(1);
  const tramitesPorPagina = 10;

  // Traer ventas disponibles para patentamiento
  useEffect(() => {
    fetch("http://localhost:3001/api/ventas-disponibles-patentamiento")
      .then(res => res.json())
      .then(data => setVentasDisponibles(data));
  }, []);

  // Traer trámites existentes
  useEffect(() => {
    fetch("http://localhost:3001/api/patentamientos")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTramites(data);
        else setTramites([]);
      });
  }, []);

  // Al seleccionar una venta, autocompletar cliente y moto
  const handleVentaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ventaId = e.target.value;
    setVentaSeleccionada(ventaId);
    const venta = ventasDisponibles.find(v => String(v.id) === ventaId);
    if (venta) {
      setClienteSeleccionado(`${venta.cliente_nombre} ${venta.cliente_apellido}`);
      setMotoSeleccionada(`${venta.marca} ${venta.moto_nombre}`);
    } else {
      setClienteSeleccionado("");
      setMotoSeleccionada("");
    }
  };

  // Enviar trámite
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    if (!ventaSeleccionada) {
      setMensaje("Debe seleccionar una venta para iniciar el trámite.");
      setTipoMensaje("error");
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/api/patentamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venta_id: ventaSeleccionada,
          observaciones
        })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje("Trámite iniciado correctamente.");
        setTipoMensaje("success");
        setVentaSeleccionada(null);
        setClienteSeleccionado("");
        setMotoSeleccionada("");
        setObservaciones("");
        // Actualizar lista de trámites
        fetch("http://localhost:3001/api/patentamientos")
          .then(res => res.json())
          .then(data => setTramites(data));
        // Actualizar ventas disponibles
        fetch("http://localhost:3001/api/ventas-disponibles-patentamiento")
          .then(res => res.json())
          .then(data => setVentasDisponibles(data));
      } else {
        setMensaje(data.error || "No se pudo iniciar el trámite.");
        setTipoMensaje("error");
      }
    } catch {
      setMensaje("Error de conexión con el servidor.");
      setTipoMensaje("error");
    }
  };

  const actualizarEstado = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/patentamientos/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Completado" }) // <-- CAMBIÁ ESTO
      });
      const data = await res.json();
      if (data.success) {
        setTramites(tramites.map(t => t.id === id ? { ...t, estado: "Completado" } : t));
      } else {
        setMensaje("No se pudo actualizar el estado.");
        setTipoMensaje("error");
      }
    } catch {
      setMensaje("Error de conexión al actualizar.");
      setTipoMensaje("error");
    }
  };

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Filtrado y paginación
  const tramitesFiltrados = tramites
    .filter(t =>
      (estadoFiltro === "Todos los estados" || t.estado === estadoFiltro) &&
      (busquedaCliente === "" || t.cliente.toLowerCase().includes(busquedaCliente.toLowerCase()))
    );

  const totalPaginas = Math.ceil(tramitesFiltrados.length / tramitesPorPagina);
  const tramitesPagina = tramitesFiltrados.slice(
    (paginaActual - 1) * tramitesPorPagina,
    paginaActual * tramitesPorPagina
  );

  return (
    <div className="patentamiento-container">
      {/* Botón Inicio */}
      <button
        className="inicio-btn"
        style={{
          position: "fixed",
          top: 32,
          left: 32,
          zIndex: 100,
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
      {/* Título */}
      <h1 style={{
        color: "#fff",
        fontWeight: 700,
        fontSize: "2.5rem",
        marginBottom: "32px",
        letterSpacing: "2px",
        textAlign: "center"
      }}>
        Patentamiento
      </h1>
      <div
        className="patentamiento-main-card"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "#232526",
          border: "2px solid #a32020",
          borderRadius: "24px",
          boxShadow: "0 6px 32px rgba(0,0,0,0.28)",
          padding: "48px 56px 40px 56px",
          display: "flex",
          gap: "32px",
          justifyContent: "space-between"
        }}
      >
        {/* Nuevo Trámite */}
        <div
          className="nuevo-tramite-card"
          style={{
            flex: 1,
            background: "#222",
            borderRadius: "10px",
            padding: "24px",
            marginRight: "24px",
            boxShadow: "0 1px 6px rgba(193,18,31,0.08)",
            border: "2px solid #a32020",
            minWidth: "340px",
            maxWidth: "420px"
          }}
        >
          <h2 style={{
            color: "#a32020",
            fontWeight: 700,
            fontSize: "2rem",
            marginBottom: "24px",
            textAlign: "center",
            letterSpacing: "1px"
          }}>
            Nuevo Trámite
          </h2>
          {mensaje && (
            <div className={`alert ${tipoMensaje === "error" ? "alert-error" : "alert-success"}`}>
              {mensaje}
            </div>
          )}
          <form className="patentamiento-form" autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "18px" }} onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "18px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>Venta de Moto</label>
                <select
                  value={ventaSeleccionada || ""}
                  onChange={handleVentaChange}
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "1em"
                  }}>
                  <option value="">Seleccione una venta...</option>
                  {ventasDisponibles.map(v => (
                    <option key={v.id} value={v.id}>
                      {`${v.fecha.slice(0,10)} - ${v.cliente_nombre} ${v.cliente_apellido} - ${v.marca} ${v.moto_nombre}`}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>Fecha de Solicitud</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  readOnly
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "1em"
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "18px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>Cliente</label>
                <input
                  type="text"
                  value={clienteSeleccionado || ""}
                  readOnly
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "1em"
                  }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>Moto</label>
                <input
                  type="text"
                  value={motoSeleccionada || ""}
                  readOnly
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "1em"
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "#fff", fontWeight: 600 }}>Observaciones</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Observaciones del trámite..."
                style={{
                  background: "#181818",
                  color: "#fff",
                  border: "1.5px solid #a32020",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "1em",
                  resize: "none",
                  minHeight: 60
                }}
                maxLength={32}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                className="btn-agencia"
                style={{
                  background: "#a32020",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "10px 28px",
                  fontSize: "1.1em",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px #0003",
                  border: "none"
                }}
              >
                Iniciar Trámite
              </button>
            </div>
          </form>
        </div>

        {/* Trámites de Patentamiento */}
        <div className="patentamiento-card"
          style={{
            flex: 2,
            background: "#222",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 1px 6px rgba(193,18,31,0.08)",
            border: "2px solid #a32020",
            minWidth: "420px"
          }}>
          <div className="patentamiento-list-header" style={{ marginBottom: 10 }}>
            <h3 className="patentamiento-subtitulo" style={{ color: "#a32020", fontWeight: 700, fontSize: "1.3rem" }}>Trámites de Patentamiento</h3>
            <button className="btn-agencia btn-reporte" style={{ float: "right" }}>
              <span role="img" aria-label="reporte" style={{ marginRight: 6 }}></span>
              Imprimir Reporte
            </button>
          </div>
          {/* Filtros de trámites */}
          <div className="patentamiento-list-filtros" style={{ marginBottom: 14, display: "flex", gap: "18px" }}>
            <select
              value={estadoFiltro}
              onChange={e => setEstadoFiltro(e.target.value)}
              style={{
                background: "#181818",
                color: "#fff",
                border: "1.5px solid #a32020",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "1em",
                fontWeight: 500,
                minWidth: "170px"
              }}
            >
              {estados.map(e => <option key={e}>{e}</option>)}
            </select>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busquedaCliente}
              onChange={e => setBusquedaCliente(e.target.value)}
              style={{
                background: "#181818",
                color: "#fff",
                border: "1.5px solid #a32020",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "1em",
                fontWeight: 500,
                minWidth: "170px"
              }}
            />
          </div>
          <table className="patentamiento-table" style={{ background: "#232526", color: "#fff" }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Moto</th>
                <th>Fecha Solicitud</th>
                <th>Fecha Finalización</th>
                <th>Estado</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
<<<<<<< HEAD
              {tramites
                .filter(t =>
                  (estadoFiltro === "Todos los estados" || t.estado === estadoFiltro) &&
                  (busquedaCliente === "" || t.cliente.toLowerCase().includes(busquedaCliente.toLowerCase()))
                )
                .map((t, i) => (
                  <tr key={t.id}>
                    <td>{t.cliente}</td>
                    <td>{t.moto}</td>
                    <td>{t.fechaSolicitud ? new Date(t.fechaSolicitud).toLocaleDateString() : "-"}</td>
                    <td>
                      {(t.estado === "Completado" || t.estado === "Finalizado")
                        ? (t.fechaFinalizacion
                            ? new Date(t.fechaFinalizacion).toLocaleDateString()
                            : (t.ultimaActualizacion
                                ? new Date(t.ultimaActualizacion).toLocaleDateString()
                                : "-"))
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`estado-badge estado-${t.estado.toLowerCase()}`}
                        style={t.estado === "Completado" ? { background: "#a32020", color: "#fff" } : {}}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td>{t.observaciones || "-"}</td>
                    <td>
                      {t.estado === "Pendiente" ? (
                        <button
                          className="btn-agencia btn-accion"
                          onClick={() => actualizarEstado(t.id)}
                        >
                          Actualizar
                        </button>
                      ) : (
                        <span style={{ color: "#a32020", fontWeight: 700 }}>Finalizado</span>
                      )}
                    </td>
                  </tr>
                ))}
=======
              {tramitesPagina.map((t, i) => (
                <tr key={t.id}>
                  <td>{t.cliente}</td>
                  <td>{t.moto}</td>
                  <td>{t.fechaSolicitud?.slice(0, 10)}</td>
                  <td>{t.estado === "Completado" && t.fechaFinalizacion ? t.fechaFinalizacion.slice(0, 10) : "-"}</td>
                  <td>
                    <span className={`estado-badge estado-${t.estado.toLowerCase().replace(/\s/g, "-")}`}>{t.estado}</span>
                  </td>
                  <td>{t.observaciones || "-"}</td>
                  <td>
                    <button
                      className="btn-agencia btn-accion"
                      onClick={() => {
                        setTramiteEdit(t);
                        setNuevoEstado(t.estado);
                      }}
                    >
                      Actualizar
                    </button>
                  </td>
                </tr>
              ))}
>>>>>>> 7bb1f1993f39456a3e7b524ed4fcb6205920ffe3
            </tbody>
          </table>
          <div className="patentamiento-paginacion" style={{ marginTop: 18, display: "flex", gap: 8, alignItems: "center" }}>
            <PaginacionUnificada
              pagina={paginaActual}
              totalPaginas={totalPaginas}
              onAnterior={() => setPaginaActual(paginaActual - 1)}
              onSiguiente={() => setPaginaActual(paginaActual + 1)}
            />
          </div>
        </div>
      </div>

      {/* Modal de actualización de estado */}
      {tramiteEdit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
          onClick={() => setTramiteEdit(null)}
        >
          <div
            style={{
              background: "#232526",
              border: "2px solid #a32020",
              borderRadius: "16px",
              padding: "32px 36px",
              minWidth: "340px",
              boxShadow: "0 4px 24px #0008",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: "#a32020", fontWeight: 700, marginBottom: 18 }}>
              Actualizar estado de trámite
            </h3>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: "#fff", fontWeight: 600, marginRight: 12 }}>
                Estado:
              </label>
              <select
                value={nuevoEstado}
                onChange={e => setNuevoEstado(e.target.value)}
                style={{
                  background: "#181818",
                  color: "#fff",
                  border: "1.5px solid #a32020",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "1em"
                }}
              >
                {estados.filter(e => e !== "Todos los estados").map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                className="btn-agencia"
                style={{
                  background: "#a32020",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 24px",
                  fontWeight: 700,
                  border: "none"
                }}
                onClick={async () => {
                  try {
                    const res = await fetch(`http://localhost:3001/api/patentamientos/${tramiteEdit.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ estado: nuevoEstado })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setMensaje("Estado actualizado correctamente.");
                      setTipoMensaje("success");
                      setTramiteEdit(null);
                      // Refrescar trámites
                      fetch("http://localhost:3001/api/patentamientos")
                        .then(res => res.json())
                        .then(data => setTramites(data));
                    } else {
                      setMensaje(data.error || "No se pudo actualizar el estado.");
                      setTipoMensaje("error");
                    }
                  } catch {
                    setMensaje("Error de conexión con el servidor.");
                    setTipoMensaje("error");
                  }
                }}
              >
                Guardar
              </button>
              <button
                className="btn-agencia"
                style={{
                  background: "#555",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 24px",
                  fontWeight: 700,
                  border: "none"
                }}
                onClick={() => setTramiteEdit(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patentamiento;