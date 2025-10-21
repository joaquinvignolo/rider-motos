import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config';
import PaginacionUnificada from "./PaginacionUnificada";
import Navbar from "./Navbar";
import "./Proveedores.css";

interface Proveedor {
  id: number;
  nombre: string;
  cuit_cuil: string | null;
  persona_contacto: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  activo: number;
}

const Proveedores: React.FC = () => {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"error" | "success">("success");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorEdit, setProveedorEdit] = useState<Proveedor | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Estado para modal de confirmación
  const [modalConfirmacion, setModalConfirmacion] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    accion: () => {},
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    cuit_cuil: "",
    persona_contacto: "",
    direccion: "",
    telefono: "",
    email: "",
  });

  const proveedoresPorPagina = 10;

  // Auto-ocultar mensaje
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Cargar proveedores
  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/proveedores`);
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      mostrarMensaje("Error al cargar proveedores", "error");
    }
  };

  // Filtrar proveedores
  const proveedoresFiltrados = proveedores.filter((p) => {
    const matchEstado = mostrarInactivos ? p.activo === 0 : p.activo === 1;
    const matchBusqueda = 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.cuit_cuil && p.cuit_cuil.includes(busqueda)) ||
      (p.persona_contacto && p.persona_contacto.toLowerCase().includes(busqueda.toLowerCase()));
    return matchEstado && matchBusqueda;
  });

  // Paginación
  const totalPaginas = Math.ceil(proveedoresFiltrados.length / proveedoresPorPagina);
  const indiceInicio = (paginaActual - 1) * proveedoresPorPagina;
  const proveedoresPaginados = proveedoresFiltrados.slice(indiceInicio, indiceInicio + proveedoresPorPagina);

  const mostrarMensaje = (texto: string, tipo: "error" | "success") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  // Función para mostrar modal de confirmación
  const mostrarModalConfirmacion = (titulo: string, mensaje: string, accion: () => void) => {
    setModalConfirmacion({
      visible: true,
      titulo,
      mensaje,
      accion,
    });
  };

  // Función para cerrar modal de confirmación
  const cerrarModalConfirmacion = () => {
    setModalConfirmacion({
      visible: false,
      titulo: "",
      mensaje: "",
      accion: () => {},
    });
  };

  // Función para confirmar acción
  const confirmarAccion = () => {
    modalConfirmacion.accion();
    cerrarModalConfirmacion();
  };

  // Validación de CUIT/CUIL
  const validarCuitCuil = (cuit: string): boolean => {
    if (!cuit) return true;
    const cuitLimpio = cuit.replace(/[-\s]/g, "");
    return /^\d{11}$/.test(cuitLimpio);
  };

  // Validación de email
  const validarEmail = (email: string): boolean => {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validación de teléfono
  const validarTelefono = (telefono: string): boolean => {
    if (!telefono) return true;
    const regex = /^[\d\s\-\(\)\+]+$/;
    return regex.test(telefono);
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setProveedorEdit(null);
    setFormData({
      nombre: "",
      cuit_cuil: "",
      persona_contacto: "",
      direccion: "",
      telefono: "",
      email: "",
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (proveedor: Proveedor) => {
    setModoEdicion(true);
    setProveedorEdit(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      cuit_cuil: proveedor.cuit_cuil || "",
      persona_contacto: proveedor.persona_contacto || "",
      direccion: proveedor.direccion || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
    });
    setMostrarModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      mostrarMensaje("El nombre del proveedor es obligatorio", "error");
      return;
    }

    if (formData.nombre.trim().length < 2) {
      mostrarMensaje("El nombre debe tener al menos 2 caracteres", "error");
      return;
    }

    if (!formData.cuit_cuil || formData.cuit_cuil.trim() === "") {
      mostrarMensaje("El CUIT/CUIL es obligatorio", "error");
      return;
    }

    if (!validarCuitCuil(formData.cuit_cuil)) {
      mostrarMensaje("El CUIT/CUIL debe tener 11 dígitos (formato: 20-12345678-9)", "error");
      return;
    }

    const tieneEmail = formData.email && formData.email.trim() !== "";
    const tieneTelefono = formData.telefono && formData.telefono.trim() !== "";
    
    if (!tieneEmail && !tieneTelefono) {
      mostrarMensaje("Debe ingresar al menos un método de contacto (email o teléfono)", "error");
      return;
    }

    if (tieneEmail && !validarEmail(formData.email)) {
      mostrarMensaje("El email ingresado no es válido", "error");
      return;
    }

    if (tieneTelefono && !validarTelefono(formData.telefono)) {
      mostrarMensaje("El teléfono solo puede contener números, espacios, guiones y paréntesis", "error");
      return;
    }

    if (!modoEdicion) {
      const nombreExiste = proveedores.some(
        p => p.nombre.toLowerCase() === formData.nombre.trim().toLowerCase()
      );
      if (nombreExiste) {
        mostrarMensaje("Ya existe un proveedor con ese nombre", "error");
        return;
      }
    }

    try {
      const url = modoEdicion
        ? `${API_URL}/api/proveedores/${proveedorEdit?.id}`
        : `${API_URL}/api/proveedores`;

      const response = await fetch(url, {
        method: modoEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        mostrarMensaje(
          modoEdicion ? "Proveedor actualizado correctamente" : "Proveedor registrado correctamente",
          "success"
        );
        setMostrarModal(false);
        setPaginaActual(1);
        cargarProveedores();
      } else {
        mostrarMensaje(data.message || "Error al guardar proveedor", "error");
      }
    } catch (error) {
      mostrarMensaje("Error de conexión", "error");
    }
  };

  const toggleActivo = (proveedor: Proveedor) => {
    const nuevoEstado = proveedor.activo === 1 ? 0 : 1;
    const accion = nuevoEstado === 0 ? "desactivar" : "activar";

    mostrarModalConfirmacion(
      `${accion.charAt(0).toUpperCase() + accion.slice(1)} Proveedor`,
      `¿Está seguro de ${accion} el proveedor "${proveedor.nombre}"?`,
      async () => {
        try {
          const response = await fetch(`${API_URL}/api/proveedores/${proveedor.id}/toggle`, {
            method: "PUT",
          });

          const data = await response.json();

          if (data.success) {
            mostrarMensaje(`Proveedor ${accion === "desactivar" ? "desactivado" : "activado"} correctamente`, "success");
            cargarProveedores();
          } else {
            mostrarMensaje(data.message || "Error al cambiar estado", "error");
          }
        } catch (error) {
          mostrarMensaje("Error de conexión", "error");
        }
      }
    );
  };

  return (
    <div className="proveedores-container">
      {/* AGREGAR NAVBAR */}
      <Navbar />

      {/* WRAPPER CON PADDING */}
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
          Gestión de Proveedores
        </h1>

        {/* Mensaje flotante */}
        {mensaje && (
          <div className={`mensaje-flotante ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}

        <div
          className="proveedores-main-card"
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            background: "#232526",
            border: "2px solid #a32020",
            borderRadius: "24px",
            boxShadow: "0 6px 32px rgba(0,0,0,0.28)",
            padding: "48px 56px 40px 56px"
          }}
        >
          {/* Header con botón */}
          <div className="proveedores-header" style={{ marginBottom: 24 }}>
            <h2 style={{ color: "#a32020", fontWeight: 700, fontSize: "2rem", margin: 0 }}>
              Proveedores {mostrarInactivos ? "(Inactivos)" : "(Activos)"}
            </h2>
            <button 
              className="btn-agencia"
              onClick={abrirModalNuevo}
              style={{
                background: "#a32020",
                color: "#fff",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "1.1em",
                fontWeight: 700,
                boxShadow: "0 2px 8px #0003",
                border: "none",
                cursor: "pointer"
              }}
            >
              + Agregar Proveedor
            </button>
          </div>

          {/* Filtros */}
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            marginBottom: 24, 
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            {/* Búsqueda */}
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              style={{
                flex: 1,
                minWidth: "300px",
                background: "#181818",
                color: "#fff",
                border: "1.5px solid #a32020",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "0.95rem"
              }}
            />

            {/* Toggle Activos/Inactivos */}
            <button
              onClick={() => {
                setMostrarInactivos(!mostrarInactivos);
                setPaginaActual(1);
                setBusqueda("");
              }}
              style={{
                background: mostrarInactivos ? "#555" : "#a32020",
                color: "#fff",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              {mostrarInactivos ? "Ver Activos" : "Ver Inactivos"}
            </button>
          </div>

          {/* Contador de resultados */}
          {busqueda && (
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "16px" }}>
              {proveedoresFiltrados.length} resultado(s) encontrado(s)
            </p>
          )}

          {/* Tabla */}
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              className="proveedores-table"
              style={{
                width: "100%",
                background: "#232526",
                color: "#fff",
                borderCollapse: "collapse",
                minWidth: "1200px" 
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "60px" }}>ID</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "150px" }}>Nombre</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "150px" }}>Persona de contacto</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "130px" }}>Teléfono</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "180px" }}>Correo</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "200px" }}>Dirección</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "130px" }}>CUIT</th>
                  <th style={{ padding: "12px 8px", background: "#181818", color: "#a32020", fontWeight: 600, minWidth: "120px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedoresPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                      {mostrarInactivos 
                        ? "No hay proveedores inactivos" 
                        : "No hay proveedores registrados"}
                    </td>
                  </tr>
                ) : (
                  proveedoresPaginados.map((proveedor) => (
                    <tr 
                      key={proveedor.id} 
                      className={proveedor.activo === 0 ? "fila-inactiva" : ""}
                      style={{ borderBottom: "1px solid #444" }}
                    >
                      <td style={{ padding: "10px 8px" }}>{proveedor.id}</td>
                      <td 
                        style={{ 
                          padding: "10px 8px",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={proveedor.nombre}
                      >
                        {proveedor.nombre}
                      </td>
                      <td 
                        style={{ 
                          padding: "10px 8px",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={proveedor.persona_contacto || "-"}
                      >
                        {proveedor.persona_contacto || "-"}
                      </td>
                      <td 
                        style={{ 
                          padding: "10px 8px",
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={proveedor.telefono || "-"}
                      >
                        {proveedor.telefono || "-"}
                      </td>
                      <td 
                        style={{ 
                          padding: "10px 8px",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={proveedor.email || "-"}
                      >
                        {proveedor.email || "-"}
                      </td>
                      <td 
                        style={{ 
                          padding: "10px 8px",
                          maxWidth: "250px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={proveedor.direccion || "-"}
                      >
                        {proveedor.direccion || "-"}
                      </td>
                                            <td 
                        style={{ 
                          padding: "10px 8px",
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={proveedor.cuit_cuil || "-"}
                      >
                        {proveedor.cuit_cuil || "-"}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <button
                          className="btn-accion"
                          onClick={() => abrirModalEditar(proveedor)}
                          title="Editar"
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "1.3rem",
                            cursor: "pointer",
                            margin: "0 6px",
                            color: "#4CAF50"
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="btn-accion"
                          onClick={() => toggleActivo(proveedor)}
                          title={proveedor.activo === 1 ? "Desactivar" : "Activar"}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "1.3rem",
                            cursor: "pointer",
                            margin: "0 6px",
                            color: proveedor.activo === 1 ? "#f44336" : "#4CAF50"
                          }}
                        >
                          {proveedor.activo === 1 ? "✖" : "✔"}
                        </button>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div style={{ marginTop: 18 }}>
          <PaginacionUnificada
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            onAnterior={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
            onSiguiente={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
          />
        </div>
      </div>
      </div>

      {/* Modal de formulario */}
      {mostrarModal && (
        <div 
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={() => setMostrarModal(false)}
        >
          <div
            style={{
              background: "#232526",
              border: "2px solid #a32020",
              borderRadius: "16px",
              padding: "28px 32px",
              minWidth: "500px",
              maxWidth: "600px",
              boxShadow: "0 4px 24px #0008"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#a32020", fontWeight: 700, marginBottom: 20, fontSize: "1.5rem" }}>
              {modoEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#fff", fontWeight: 600 }}>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    maxLength={30}
                    style={{
                      background: "#181818",
                      color: "#fff",
                      border: "1.5px solid #a32020",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "1em"
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#fff", fontWeight: 600 }}>CUIT/CUIL *</label>
                  <input
                    type="text"
                    name="cuit_cuil"
                    value={formData.cuit_cuil}
                    onChange={handleInputChange}
                    placeholder="20-12345678-9"
                    maxLength={13}
                    required
                    style={{
                      background: "#181818",
                      color: "#fff",
                      border: "1.5px solid #a32020",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "1em"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#fff", fontWeight: 600 }}>Persona de contacto</label>
                  <input
                    type="text"
                    name="persona_contacto"
                    value={formData.persona_contacto}
                    onChange={handleInputChange}
                    maxLength={30}
                    style={{
                      background: "#181818",
                      color: "#fff",
                      border: "1.5px solid #a32020",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "1em"
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#fff", fontWeight: 600 }}>Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="+54 9 11 1234-5678"
                    maxLength={30}
                    style={{
                      background: "#181818",
                      color: "#fff",
                      border: "1.5px solid #a32020",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "1em"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="proveedor@ejemplo.com"
                  maxLength={50}
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "1em"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#fff", fontWeight: 600 }}>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  maxLength={100}
                  style={{
                    background: "#181818",
                    color: "#fff",
                    border: "1.5px solid #a32020",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "1em"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  type="submit"
                  style={{
                    background: "#a32020",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {modoEdicion ? "Actualizar" : "Registrar"}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  style={{
                    background: "#555",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {modalConfirmacion.visible && (
        <div 
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001
          }}
          onClick={cerrarModalConfirmacion}
        >
          <div
            style={{
              background: "#232526",
              border: "2px solid #a32020",
              borderRadius: "16px",
              padding: "32px",
              minWidth: "400px",
              maxWidth: "500px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              animation: "slideIn 0.3s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ 
                fontSize: "3rem", 
                color: "#ff9800",
                marginBottom: "16px"
              }}>
                ⚠️
              </div>
              <h3 style={{ 
                color: "#a32020", 
                fontWeight: 700, 
                fontSize: "1.5rem",
                marginBottom: "12px"
              }}>
                {modalConfirmacion.titulo}
              </h3>
              <p style={{ 
                color: "#fff", 
                fontSize: "1rem",
                lineHeight: "1.5"
              }}>
                {modalConfirmacion.mensaje}
              </p>
            </div>

            <div style={{ 
              display: "flex", 
              gap: "12px", 
              justifyContent: "center"
            }}>
              <button
                onClick={confirmarAccion}
                style={{
                  background: "#a32020",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#8a1a1a"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#a32020"}
              >
                Confirmar
              </button>
              <button
                onClick={cerrarModalConfirmacion}
                style={{
                  background: "#555",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#444"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#555"}
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

export default Proveedores;