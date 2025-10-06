import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Patentamiento.css";
import PaginacionUnificada from "./PaginacionUnificada";
import IndicadorCarga from "./IndicadorCarga";

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
  const [cargandoEstado, setCargandoEstado] = useState(false);
  const [numeroChasis, setNumeroChasis] = useState("");
  const [numeroMotor, setNumeroMotor] = useState("");
  const [numeroCertificado, setNumeroCertificado] = useState("");
  const [datosMoto, setDatosMoto] = useState<any | null>(null);
  const tramitesPorPagina = 10;

  // Traer ventas disponibles para patentamiento
  useEffect(() => {
    fetch("http://localhost:3001/api/ventas-disponibles-patentamiento")
      .then(res => res.json())
      .then(data => setVentasDisponibles(data));
  }, []);

  // Traer trámites existentes
  useEffect(() => {
    const actualizarTramitesConDatos = async () => {
      const res = await fetch("http://localhost:3001/api/patentamientos");
      const data = await res.json();
      const tramitesConDatos = await Promise.all(
        data.map(async tramite => {
          try {
            const res = await fetch(`http://localhost:3001/api/motos-entregadas/${tramite.id}`);
            if (res.ok) {
              const datosMoto = await res.json();
              return { ...tramite, datosMoto };
            }
          } catch {}
          return { ...tramite, datosMoto: null };
        })
      );
      setTramites(tramitesConDatos);
    };

    actualizarTramitesConDatos();
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
    if (
      !numeroChasis.trim() ||
      !numeroMotor.trim() ||
      !numeroCertificado.trim()
    ) {
      setMensaje("Debe ingresar chasis, motor y certificado.");
      setTipoMensaje("error");
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/api/patentamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venta_id: Number(ventaSeleccionada),
          observaciones,
          numero_chasis: numeroChasis.trim(),
          numero_motor: numeroMotor.trim(),
          numero_certificado: numeroCertificado.trim()
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
        setNumeroChasis("");
        setNumeroMotor("");
        setNumeroCertificado("");
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
        body: JSON.stringify({ estado: "Completado" }) 
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

  useEffect(() => {
    if (tramiteEdit) {
      fetch(`http://localhost:3001/api/motos-entregadas/${tramiteEdit.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setDatosMoto(data))
        .catch(() => setDatosMoto(null));
    } else {
      setDatosMoto(null);
    }
  }, [tramiteEdit]);

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
            <div style={{ display: "flex", gap: "18px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>N° Chasis</label>
                <input
                  type="text"
                  value={numeroChasis}
                  onChange={e => setNumeroChasis(e.target.value)}
                  required
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
                <label style={{ color: "#fff", fontWeight: 600 }}>N° Motor</label>
                <input
                  type="text"
                  value={numeroMotor}
                  onChange={e => setNumeroMotor(e.target.value)}
                  required
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "#fff", fontWeight: 600 }}>N° Certificado</label>
              <input
                type="text"
                value={numeroCertificado}
                onChange={e => setNumeroCertificado(e.target.value)}
                required
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
                <th>Chasis</th>
                <th>Motor</th>
                <th>Certificado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
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
                    {t.datosMoto
                      ? t.datosMoto.numero_chasis
                      : <span style={{ color: "#888" }}>-</span>}
                  </td>
                  <td>
                    {t.datosMoto
                      ? t.datosMoto.numero_motor
                      : <span style={{ color: "#888" }}>-</span>}
                  </td>
                  <td>
                    {t.datosMoto
                      ? t.datosMoto.numero_certificado
                      : <span style={{ color: "#888" }}>-</span>}
                  </td>
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
          className="patentamiento-modal-backdrop"
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
            {/* Indicador de carga superpuesto */}
            {cargandoEstado && (
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10
              }}>
                <IndicadorCarga mensaje="Actualizando estado..." />
              </div>
            )}
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
            {datosMoto && (
              <div style={{ margin: "18px 0 0 0", padding: "12px", background: "#181818", borderRadius: 8 }}>
                <div><b>Chasis:</b> {datosMoto.numero_chasis}</div>
                <div><b>Motor:</b> {datosMoto.numero_motor}</div>
                <div><b>Certificado:</b> {datosMoto.numero_certificado}</div>
              </div>
            )}
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
                  setCargandoEstado(true);
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
                  } finally {
                    setCargandoEstado(false);
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