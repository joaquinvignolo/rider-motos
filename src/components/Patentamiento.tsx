import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Patentamiento.css";

const estados = ["Todos los estados", "Pendiente", "Completado"];

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
                maxLength={50}
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
              {tramites
                .filter(t =>
                  (estadoFiltro === "Todos los estados" || t.estado === estadoFiltro) &&
                  (busquedaCliente === "" || t.cliente.toLowerCase().includes(busquedaCliente.toLowerCase()))
                )
                .map((t, i) => (
                  <tr key={t.id}>
                    <td>{t.cliente}</td>
                    <td>{t.moto}</td>
                    <td>{t.fechaSolicitud}</td>
                    <td>
                      {(t.estado === "Completado" || t.estado === "Finalizado")
                        ? (t.fechaFinalizacion || t.ultimaActualizacion)
                        : "-"}
                    </td>
                    <td>
                      <span className={`estado-badge estado-${t.estado.toLowerCase()}`}>{t.estado}</span>
                    </td>
                    <td>{t.observaciones || "-"}</td>
                    <td>
                      <button className="btn-agencia btn-accion">Actualizar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="patentamiento-paginacion">
            <button className="btn-agencia btn-pag">Anterior</button>
            <span className="pag-num">1</span>
            <button className="btn-agencia btn-pag">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patentamiento;