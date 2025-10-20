import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Patentamiento.css";
import PaginacionUnificada from "./PaginacionUnificada";
import IndicadorCarga from "./IndicadorCarga";
import Navbar from "./Navbar"; 

const estados = ["Todos los estados", "Pendiente", "En Proceso", "Completado", "Entregado"];

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
  const [mensajeModal, setMensajeModal] = useState<string>("");
  const [tipoMensajeModal, setTipoMensajeModal] = useState<"error" | "success">("success");
  const [tramites, setTramites] = useState<any[]>([]);
  const [tramiteEdit, setTramiteEdit] = useState<any | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("Pendiente");
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargandoEstado, setCargandoEstado] = useState(false);
  const [numeroChasis, setNumeroChasis] = useState("");
  const [numeroMotor, setNumeroMotor] = useState("");
  const [certificadoOrigen, setCertificadoOrigen] = useState("");
  const [numeroExpediente, setNumeroExpediente] = useState("");
  const [datosMoto, setDatosMoto] = useState<any | null>(null);
  const tramitesPorPagina = 10;

  // Auto-ocultar mensaje del modal
  useEffect(() => {
    if (mensajeModal) {
      const timer = setTimeout(() => setMensajeModal(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensajeModal]);

  // Función para traer trámites con datos únicos
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

  // Traer ventas disponibles para patentamiento
  useEffect(() => {
    fetch("http://localhost:3001/api/ventas-disponibles-patentamiento")
      .then(res => res.json())
      .then(data => setVentasDisponibles(data));
  }, []);

  // Traer trámites existentes con datos únicos
  useEffect(() => {
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
      !certificadoOrigen.trim()
    ) {
      setMensaje("Debe ingresar chasis, motor y certificado de origen.");
      setTipoMensaje("error");
      return;
    }

    const validarCampo = (valor: string, nombre: string, min: number, max: number) => {
      if (!valor.trim()) return `El campo ${nombre} es obligatorio.`;
      if (valor.length < min || valor.length > max) 
        return `${nombre} debe tener entre ${min} y ${max} caracteres.`;
      if (!/^[A-Za-z0-9\-\.]+$/.test(valor)) 
        return `${nombre} solo puede contener letras, números, guiones o puntos.`;
      return null;
    };

    const errorChasis = validarCampo(numeroChasis, "Chasis", 10, 20);
    const errorMotor = validarCampo(numeroMotor, "Motor", 5, 20);
    const errorCertificado = validarCampo(certificadoOrigen, "Certificado de Origen", 5, 30);

    if (errorChasis || errorMotor || errorCertificado) {
      setMensaje(errorChasis || errorMotor || errorCertificado);
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
          numero_chasis: numeroChasis.trim().toUpperCase(),
          numero_motor: numeroMotor.trim().toUpperCase(),
          certificado_origen: certificadoOrigen.trim().toUpperCase()
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
        setCertificadoOrigen("");
        // Actualizar lista de trámites con datos únicos
        await actualizarTramitesConDatos();
        
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
      setMensajeModal("");
    }
  }, [tramiteEdit]);

  return (
    <div className="patentamiento-container">
      {/* NAVBAR */}
      <Navbar />
      
      {/* PADDING TOP PARA NO QUEDAR DETRÁS DEL NAVBAR */}
      <div style={{ paddingTop: "84px" }}>
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
            maxWidth: 1600, 
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
              minWidth: "380px", 
              maxWidth: "480px"  
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

              {/* ACTUALIZAR el campo en el formulario */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>
                  Certificado de Origen
                </label>
                <input
                  type="text"
                  value={certificadoOrigen}
                  onChange={e => setCertificadoOrigen(e.target.value)}
                  required
                  placeholder="Ej: COF-2024-001234"
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "1em"
                  }}
                />
                <small style={{ color: "#888", fontSize: "0.82rem", marginTop: "2px" }}>
                  Número que viene de fábrica con la moto
                </small>
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
                    border: "none",
                    cursor: "pointer"
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
              minWidth: "600px" 
            }}>
            <div className="patentamiento-list-header" style={{ marginBottom: 10 }}>
              <h3 className="patentamiento-subtitulo" style={{ 
                color: "#a32020", 
                fontWeight: 700, 
                fontSize: "2rem", 
                margin: 0 
              }}>
                Trámites de Patentamiento
              </h3>
            </div>

            {/* Filtros de trámites */}
            <div className="patentamiento-list-filtros" style={{ 
              marginBottom: 24, 
              display: "flex", 
              gap: "18px",
              flexWrap: "wrap" 
            }}>
              <select
                value={estadoFiltro}
                onChange={e => setEstadoFiltro(e.target.value)}
                style={{
                  background: "#181818",
                  color: "#fff",
                  border: "1.5px solid #a32020",
                  borderRadius: "8px",
                  padding: "10px 14px", 
                  fontSize: "0.95rem", 
                  fontWeight: 500,
                  minWidth: "180px" 
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
                  flex: 1, 
                  minWidth: "250px", 
                  background: "#181818",
                  color: "#fff",
                  border: "1.5px solid #a32020",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "0.95rem",
                  fontWeight: 500
                }}
              />
            </div>

            <div style={{ overflowX: "auto", width: "100%" }}>
              <table
                className="patentamiento-table"
                style={{
                  width: "100%", 
                  background: "#232526",
                  color: "#fff",
                  minWidth: 1400,
                  tableLayout: "auto", 
                  borderCollapse: "collapse"
                }}
              >
                <thead>
                  <tr>
                    <th style={{ minWidth: 120, padding: "12px 8px" }}>Cliente</th>
                    <th style={{ minWidth: 120, padding: "12px 8px" }}>Moto</th>
                    <th style={{ minWidth: 100, padding: "12px 8px" }}>Fecha Solicitud</th>
                    <th style={{ minWidth: 110, padding: "12px 8px" }}>Fecha Completado</th>
                    <th style={{ minWidth: 110, padding: "12px 8px" }}>Fecha Entrega</th>
                    <th style={{ minWidth: 90, padding: "12px 8px" }}>Estado</th>
                    <th style={{ minWidth: 150, padding: "12px 8px" }}>Observaciones</th>
                    <th style={{ minWidth: 140, padding: "12px 8px" }}>Chasis</th>
                    <th style={{ minWidth: 140, padding: "12px 8px" }}>Motor</th>
                    <th style={{ minWidth: 140, padding: "12px 8px" }}>Certificado Origen</th>
                    {/* ✅ NUEVA COLUMNA */}
                    <th style={{ minWidth: 140, padding: "12px 8px" }}>N° Expediente</th>
                    <th style={{ minWidth: 90, padding: "12px 8px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tramitesPagina.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                        {/**/}
                        No hay trámites para mostrar
                      </td>
                    </tr>
                  ) : (
                    tramitesPagina.map((t) => (
                      <tr key={t.id}>
                        <td 
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 150
                          }} 
                          title={t.cliente}
                        >
                          {t.cliente}
                        </td>
                        <td 
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 150
                          }} 
                          title={t.moto}
                        >
                          {t.moto}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          {t.fechaSolicitud?.slice(0, 10)}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          {(t.estado === "Completado" || t.estado === "Entregado") && t.fechaFinalizacion
                            ? t.fechaFinalizacion.slice(0, 10)
                            : <span style={{ color: "#888" }}>-</span>}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          {t.estado === "Entregado" && t.fechaEntrega
                            ? t.fechaEntrega.slice(0, 10)
                            : <span style={{ color: "#888" }}>-</span>}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <span className={`estado-badge estado-${t.estado.toLowerCase().replace(/\s/g, "-")}`}>
                            {t.estado}
                          </span>
                        </td>
                        <td
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 180
                          }}
                          title={t.observaciones || "-"}
                        >
                          {t.observaciones || <span style={{ color: "#888" }}>-</span>}
                        </td>
                        <td
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                            fontSize: "0.9em"
                          }}
                          title={t.datosMoto?.numero_chasis || "-"}
                        >
                          {t.datosMoto?.numero_chasis || <span style={{ color: "#888" }}>-</span>}
                        </td>
                        <td
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                            fontSize: "0.9em"
                          }}
                          title={t.datosMoto?.numero_motor || "-"}
                        >
                          {t.datosMoto?.numero_motor || <span style={{ color: "#888" }}>-</span>}
                        </td>
                        <td
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                            fontSize: "0.9em"
                          }}
                          title={t.datosMoto?.certificado_origen || "-"}
                        >
                          {t.datosMoto?.certificado_origen || <span style={{ color: "#888" }}>-</span>}
                        </td>
                        {/*CELDA PARA N° EXPEDIENTE */}
                        <td
                          style={{ 
                            padding: "10px 8px", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                            fontSize: "0.9em",
                            color: t.datosMoto?.numero_expediente ? "#7ed481" : "#888",
                            fontStyle: t.datosMoto?.numero_expediente ? "normal" : "italic"
                          }}
                          title={t.datosMoto?.numero_expediente || "Pendiente de asignación"}
                        >
                          {t.datosMoto?.numero_expediente || "Pendiente"}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <button
                            className="btn-agencia btn-accion"
                            onClick={() => {
                              setTramiteEdit(t);
                              setNuevoEstado(t.estado);
                            }}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.85em",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Actualizar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
            onClick={() => {
              setTramiteEdit(null);
              setNumeroExpediente("");
              setMensajeModal("");
            }}
          >
            <div
              style={{
                background: "#232526",
                border: "2px solid #a32020",
                borderRadius: "16px",
                padding: "28px 32px",
                minWidth: "420px",
                maxWidth: "500px",
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
                  zIndex: 10,
                  borderRadius: "16px"
                }}>
                  <IndicadorCarga mensaje="Actualizando estado..." />
                </div>
              )}

              <h3 style={{ color: "#a32020", fontWeight: 700, marginBottom: 16, fontSize: "1.3rem" }}>
                Actualizar Trámite
              </h3>

              {/* MENSAJE DE ERROR/ÉXITO EN EL MODAL */}
              {mensajeModal && (
                <div style={{
                  marginBottom: 16,
                  padding: "12px 16px",
                  background: tipoMensajeModal === "error" ? "rgba(220, 53, 69, 0.15)" : "rgba(40, 167, 69, 0.15)",
                  border: `1px solid ${tipoMensajeModal === "error" ? "#dc3545" : "#28a745"}`,
                  borderRadius: 8,
                  color: tipoMensajeModal === "error" ? "#ff6b6b" : "#7ed481",
                  fontSize: "0.9rem",
                  fontWeight: 500
                }}>
                  {mensajeModal}
                </div>
              )}

              {/* Selector de Estado */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: "#fff", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Estado:
                </label>
                <select
                  value={nuevoEstado}
                  onChange={e => setNuevoEstado(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "1em"
                  }}
                >
                  {estados.filter(e => e !== "Todos los estados").map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Datos de la Moto */}
              {datosMoto && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    background: "#181818",
                    borderRadius: 8,
                    fontSize: "0.9rem"
                  }}
                >
                  <div style={{ marginBottom: 6 }}><b>Chasis:</b> {datosMoto.numero_chasis}</div>
                  <div style={{ marginBottom: 6 }}><b>Motor:</b> {datosMoto.numero_motor}</div>
                  <div style={{ marginBottom: 6 }}><b>Certificado:</b> {datosMoto.certificado_origen}</div>
                  <div style={{
                    color: datosMoto.numero_expediente ? "#7ed481" : "#888",
                    fontWeight: datosMoto.numero_expediente ? "600" : "normal"
                  }}>
                    <b>Expediente:</b> {datosMoto.numero_expediente || "No asignado"}
                  </div>
                  {tramiteEdit?.observaciones && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #333" }}>
                      <b>Obs:</b> {tramiteEdit.observaciones}
                    </div>
                  )}
                </div>
              )}

              {/* CAMPO DE EXPEDIENTE (solo si estado es "En Proceso" y no está asignado) */}
              {nuevoEstado === "En Proceso" && !datosMoto?.numero_expediente && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    color: "#ffd700",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                    fontSize: "0.95rem"
                  }}>
                    📋 Número de Expediente
                  </label>
                  <input
                    type="text"
                    value={numeroExpediente}
                    onChange={e => setNumeroExpediente(e.target.value)}
                    placeholder="Ej: EXP-2024-12345-A"
                    maxLength={32}
                    style={{
                      width: "100%",
                      background: "#181818",
                      color: "#fff",
                      border: "1.5px solid #a32020",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "1em"
                    }}
                  />
                  <small style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginTop: 6 }}>
                    Asignado por el Registro del Automotor (máx. 32 caracteres)
                  </small>
                </div>
              )}

              {/* MENSAJE SI YA TIENE EXPEDIENTE */}
              {nuevoEstado === "En Proceso" && datosMoto?.numero_expediente && (
                <div style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  background: "rgba(126, 212, 129, 0.12)",
                  borderRadius: 6,
                  border: "1px solid #7ed481"
                }}>
                  <p style={{ color: "#7ed481", fontSize: "0.88rem", margin: 0 }}>
                    Expediente: <b>{datosMoto.numero_expediente}</b>
                  </p>
                </div>
              )}

              {/* Botones */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  className="btn-agencia"
                  style={{
                    background: "#a32020",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "9px 24px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                  onClick={async () => {
                    setMensajeModal(""); 

                    // VALIDAR EXPEDIENTE SI EL ESTADO ES "En Proceso"
                    if (nuevoEstado === "En Proceso" && !datosMoto?.numero_expediente) {
                      if (!numeroExpediente.trim()) {
                        setMensajeModal("Debe ingresar el número de expediente para cambiar a 'En Proceso'");
                        setTipoMensajeModal("error");
                        return;
                      }
                    
                      // CAMBIAR: Validar mínimo de caracteres solamente
                      if (numeroExpediente.trim().length < 5) {
                        setMensajeModal("El número de expediente debe tener al menos 5 caracteres");
                        setTipoMensajeModal("error");
                        return;
                      }

                      // Validar formato alfanumérico
                      if (!/^[A-Za-z0-9\-]+$/.test(numeroExpediente.trim())) {
                        setMensajeModal("El expediente solo puede contener letras, números y guiones");
                        setTipoMensajeModal("error");
                        return;
                      }
                    }

                    setCargandoEstado(true);
                    try {
                      // Actualizar el estado a "En Proceso"
                      const res = await fetch(`http://localhost:3001/api/patentamientos/${tramiteEdit.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ estado: nuevoEstado })
                      });
                      const data = await res.json();
                    
                      if (!data.success) {
                        setMensajeModal("❌ " + (data.error || "No se pudo actualizar el estado"));
                        setTipoMensajeModal("error");
                        setCargandoEstado(false);
                        return;
                      }

                      // Guardar expediente si es necesario
                      if (nuevoEstado === "En Proceso" && numeroExpediente.trim() && !datosMoto?.numero_expediente) {
                        const resExp = await fetch(
                          `http://localhost:3001/api/patentamientos/${tramiteEdit.id}/expediente`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ numero_expediente: numeroExpediente.trim() })
                          }
                        );
                      
                        const dataExp = await resExp.json();
                      
                        if (!dataExp.success) {
                          setMensajeModal("Estado actualizado pero no se pudo guardar el expediente: " + (dataExp.error || "Error desconocido"));
                          setTipoMensajeModal("error");
                          setCargandoEstado(false);
                          return;
                        }
                      }

                      // Mostrar mensaje y cerrar modal
                      setMensaje(`Estado actualizado a "${nuevoEstado}" correctamente`);
                      setTipoMensaje("success");
                      setNumeroExpediente("");
                      setTramiteEdit(null);
                      await actualizarTramitesConDatos(); 
                    } catch (error) {
                      console.error("Error:", error);
                      setMensajeModal("Error de conexión con el servidor");
                      setTipoMensajeModal("error");
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
                    padding: "9px 24px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setTramiteEdit(null);
                    setNumeroExpediente("");
                    setMensajeModal("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patentamiento;