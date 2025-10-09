import React, { useEffect, useState } from "react";
import "./Reportes.css";
import jsPDF from "jspdf";
import PaginacionUnificada from "./PaginacionUnificada";

type Venta = {
  id: number;
  fecha: string;
  cliente: string;
  productos: string;
  total: number;
  descripcion: string;
  metodo_pago?: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_telefono?: string;
  cliente_correo?: string;
  detalles: {
    nombre: string;
    descripcion: string;
    marca: string;
    tipo: string;  // ← AGREGAR
    cantidad: number;
    precio: number;
    metodo_pago?: string;
  }[];
};

type Compra = {
  id: number;
  fecha: string;
  fecha_emision?: string;  // ← AGREGAR
  tipo_comprobante?: string;  // ← AGREGAR
  numero_comprobante?: string;  // ← AGREGAR
  proveedor: string;
  total: number;
  observaciones?: string;  // ← AGREGAR
  detalles: {
    nombre: string;
    tipo: string;  // ← AGREGAR
    marca: string;
    cantidad: number;
    precio?: number;
    observaciones?: string;
  }[];
};

// Agrupa productos por nombre+observación y suma cantidades
function agruparYSumarProductos(productos: any[]) {
  const agrupados: { [key: string]: any } = {};
  productos.forEach(p => {
    const key = `${p.nombre}__${p.observaciones || ""}`;
    if (!agrupados[key]) {
      agrupados[key] = { ...p };
    } else {
      agrupados[key].cantidad += p.cantidad;
    }
  });
  return Object.values(agrupados);
}

const iconoOjo = (
  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
);

const flecha = (
  <svg width="22" height="22" viewBox="0 0 22 22" style={{verticalAlign: "middle"}}>
    <path d="M7 11h8M13 7l4 4-4 4" stroke="#a32020" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 11H7M11 15l-4-4 4-4" stroke="#a32020" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Reportes: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [detalleDia, setDetalleDia] = useState<any>(null);
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [pagina, setPagina] = useState(1);
  const [tipo, setTipo] = useState<"ventas" | "compras">("ventas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [mostrarCliente, setMostrarCliente] = useState(false);

  // Cargar ventas y compras
  useEffect(() => {
    fetch("http://localhost:3001/api/ventas")
      .then(res => res.json())
      .then(data => setVentas(Array.isArray(data) ? data : []));
    fetch("http://localhost:3001/api/compras")
      .then(res => res.json())
      .then((data) => setCompras(Array.isArray(data) ? data : []));
  }, []);

  // Limpiar filtros y paginación al cambiar tipo
  const handleTipo = () => {
    setTipo(tipo === "ventas" ? "compras" : "ventas");
    setBusqueda("");
    setDesde("");
    setHasta("");
    setPagina(1);
    setDetalleDia(null);
  };

  // Filtrado y agrupado según tipo
  const registros = tipo === "ventas" ? ventas : compras;
  const filtrados = registros.filter(r => {
    const fecha = tipo === "compras" 
      ? new Date(r.fecha_emision || r.fecha)  // ← CAMBIAR ESTA LÍNEA
      : new Date(r.fecha);
    let ok = true;
    if (desde) ok = ok && fecha >= new Date(desde + "T00:00:00");
    if (hasta) ok = ok && fecha <= new Date(hasta + "T23:59:59");
    if (busqueda.trim() !== "") {
      const texto = busqueda.toLowerCase();
      if (tipo === "ventas") {
        return ok && (
          r.cliente?.toLowerCase().includes(texto) ||
          r.detalles?.some((d: any) =>
            d.nombre?.toLowerCase().includes(texto) ||
            d.descripcion?.toLowerCase().includes(texto)
          )
        );
      } else {
        // Compras: buscar por nombre de producto o proveedor
        return ok && (
          r.proveedor?.toLowerCase().includes(texto) ||
          r.detalles?.some((d: any) =>
            d.nombre?.toLowerCase().includes(texto) ||
            (d.observaciones?.toLowerCase().includes(texto))
          )
        );
      }
    }
    return ok;
  });

  // Agrupar por fecha
  const agrupadas = filtrados.reduce((acc: any, r: any) => {
    const fecha = tipo === "compras"
      ? new Date(r.fecha_emision || r.fecha).toLocaleDateString()  // ← CAMBIAR ESTA LÍNEA
      : new Date(r.fecha).toLocaleDateString();
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(r);
    return acc;
  }, {});
  const fechas = Object.keys(agrupadas);
  const diasPorPagina = 5;
  const totalPaginas = Math.ceil(fechas.length / diasPorPagina);
  const fechasPagina = fechas.slice((pagina - 1) * diasPorPagina, pagina * diasPorPagina);

  // ✅ AGRUPAR COMPRAS POR FECHA Y TIPO (USANDO CAMPO 'tipo')
  const agrupadasCompras: {
    [fecha: string]: {
      [proveedor: string]: {
        compra: Compra;
        productos: any[];
      };
    };
  } = {};

  if (tipo === "compras") {
    filtrados.forEach((compra: Compra) => {
      const fecha = new Date(compra.fecha_emision || compra.fecha).toLocaleDateString();
      const proveedor = compra.proveedor?.trim() || "Proveedor no especificado";
      
      if (!agrupadasCompras[fecha]) {
        agrupadasCompras[fecha] = {};
      }
      
      // ✅ AGRUPAR POR PROVEEDOR (sin importar el tipo)
      if (!agrupadasCompras[fecha][proveedor]) {
        agrupadasCompras[fecha][proveedor] = {
          compra: compra, // Guardar referencia a la compra completa
          productos: []
        };
      }
      
      // Agregar todos los productos del proveedor
      compra.detalles.forEach(d => {
        agrupadasCompras[fecha][proveedor].productos.push({ ...d, compra });
      });
    });
  }

  const handleVolverInicio = () => {
    window.location.href = "/menu";
  };

  return (
    <div className="reportes-container">
      {/* Botón volver al inicio */}
      <div style={{ position: "fixed", top: 32, left: 32, zIndex: 100 }}>
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
          onClick={handleVolverInicio}
        >
          INICIO
        </button>
      </div>
      <div className="reportes-box">
        <h1 className="reportes-titulo">REPORTES</h1>
        
        {/* Minitítulo con flecha */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 8 }}>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a32020",
              fontSize: 18,
              marginRight: 4,
              padding: 0,
              display: "flex",
              alignItems: "center"
            }}
            title="Cambiar entre ventas y compras"
            onClick={handleTipo}
          >
            {flecha}
          </button>
          <span style={{ fontSize: 18, color: "#bdbdbd", fontWeight: 600, letterSpacing: 1 }}>
            {tipo === "ventas" ? "Ventas" : "Compras"}
          </span>
          
          {/* Buscador */}
          <input
            type="text"
            placeholder={
              tipo === "ventas"
                ? "Buscar producto, cliente, etc..."
                : "Buscar producto, proveedor, etc..."
            }
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            style={{
              marginLeft: "auto",
              padding: "7px 14px",
              borderRadius: 8,
              border: "1.5px solid #a32020",
              background: "#232526",
              color: "#fff",
              fontWeight: 600,
              minWidth: 220
            }}
          />
        </div>
        <hr className="reportes-divisor" />
        
        {/* Filtros compacto */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ color: "#fff", fontWeight: 600 }}>
              Desde:{" "}
              <input
                type="date"
                value={desde}
                onChange={e => { setDesde(e.target.value); setPagina(1); }}
                style={{ borderRadius: 8, border: "1.5px solid #a32020", background: "#232526", color: "#fff", padding: "6px 10px", fontWeight: 600 }}
              />
            </label>
            <label style={{ color: "#fff", fontWeight: 600 }}>
              Hasta:{" "}
              <input
                type="date"
                value={hasta}
                onChange={e => { setHasta(e.target.value); setPagina(1); }}
                style={{ borderRadius: 8, border: "1.5px solid #a32020", background: "#232526", color: "#fff", padding: "6px 10px", fontWeight: 600 }}
              />
            </label>
          </div>
        </div>
        
        {fechasPagina.length === 0 ? (
          <div className="reportes-vacio">
            <span role="img" aria-label="historial" style={{ fontSize: 40, marginBottom: 12 }}>📄</span>
            <div>
              No hay {tipo === "ventas" ? "ventas" : "compras"} registradas aún.
            </div>
          </div>
        ) : (
          fechasPagina.map(fecha => {
            
            /* ========================================
               ✅ VENTAS - TARJETAS SIMPLIFICADAS
               ======================================== */
            if (tipo === "ventas") {
              const ventasDelDia = agrupadas[fecha];
              const accesorios = ventasDelDia.filter(v => v.cliente === "Consumidor final");
              const clientesMotos = ventasDelDia.filter(v => v.cliente !== "Consumidor final");
              const motosPorCliente: { [cliente: string]: Venta[] } = {};
              clientesMotos.forEach(v => {
                if (!motosPorCliente[v.cliente]) motosPorCliente[v.cliente] = [];
                motosPorCliente[v.cliente].push(v);
              });

              const tieneEfectivo = accesorios.some(v => v.metodo_pago === "efectivo");
              const totalAccesorios = tieneEfectivo
                ? accesorios.filter(v => v.metodo_pago === "efectivo").reduce((acc, v) => acc + Number(v.total), 0)
                : accesorios.reduce((acc, v) => acc + Number(v.total), 0);

              const totalPorCliente: { [cliente: string]: number } = {};
              Object.entries(motosPorCliente).forEach(([cliente, ventasCliente]) => {
                const efectivo = ventasCliente
                  .filter(v => v.metodo_pago !== "tarjeta" && v.metodo_pago !== "transferencia")
                  .reduce((acc, v) => acc + Number(v.total), 0);
                const tarjTransf = ventasCliente
                  .filter(v => v.metodo_pago === "tarjeta" || v.metodo_pago === "transferencia")
                  .reduce((acc, v) => acc + Number(v.total), 0);
                totalPorCliente[cliente] = efectivo > 0 ? efectivo : tarjTransf;
              });

              return (
                <div key={fecha} style={{ width: "100%", marginBottom: 32 }}>
                  <div className="mini-titulo-fecha">{fecha}</div>
                  <div className="reportes-grid-cuadrada">
                    
                    {/* ✅ CONSUMIDOR FINAL - SIMPLIFICADO */}
                    {accesorios.length > 0 && (
                      <div className="reporte-cuadro">
                        <div className="reporte-cuadro-fecha">{fecha}</div>
                        <div className="reporte-cuadro-total">
                          ${Number(totalAccesorios).toFixed(2)}
                        </div>
                        
                        {/* ✅ CLIENTE */}
                        <div className="reporte-cuadro-cliente" style={{ 
                          fontSize: 14, 
                          marginBottom: 4 
                        }}>
                          Consumidor final
                        </div>
                        
                        {/* ✅ MÉTODO DE PAGO (lo más importante) */}
                        <div style={{
                          fontSize: 12,
                          color: tieneEfectivo ? "#4caf50" : "#b36aff",
                          fontWeight: 600,
                          marginBottom: 8
                        }}>
                          {tieneEfectivo ? "💰 Efectivo" : "💳 Tarjeta/Transf"}
                        </div>
                        
                        <div className="reporte-cuadro-botones">
                          <button
                            className="ver-btn"
                            onClick={() => {
                              const productos = accesorios.flatMap(v => v.detalles.map(d => ({
                                ...d,
                                metodo_pago: v.metodo_pago,
                                cliente: v.cliente,
                                total: v.total
                              })));
                              setDetalleDia({ fecha: accesorios[0]?.fecha || fecha, productos, cliente: "Consumidor final" });
                            }}
                            title="Ver detalle"
                          >
                            {iconoOjo}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* ✅ CLIENTES - SIMPLIFICADO */}
                    {Object.entries(motosPorCliente).map(([cliente, ventasCliente]) => {
                      const tieneEfectivoCliente = ventasCliente.some(v => 
                        v.metodo_pago !== "tarjeta" && v.metodo_pago !== "transferencia"
                      );
                      
                      return (
                        <div className="reporte-cuadro" key={cliente}>
                          <div className="reporte-cuadro-fecha">{fecha}</div>
                          <div className="reporte-cuadro-total">
                            ${Number(totalPorCliente[cliente]).toFixed(2)}
                          </div>
                          
                          {/* ✅ SOLO NOMBRE Y APELLIDO */}
                          <div className="reporte-cuadro-cliente" style={{
                            fontSize: 14,
                            lineHeight: 1.3,
                            marginBottom: 4,
                            maxHeight: 36,
                            overflow: "hidden"
                          }}>
                            <b>
                              {ventasCliente[0].cliente_nombre} {ventasCliente[0].cliente_apellido}
                            </b>
                          </div>
                          
                          {/* ✅ MÉTODO DE PAGO */}
                          <div style={{
                            fontSize: 12,
                            color: tieneEfectivoCliente ? "#4caf50" : "#b36aff",
                            fontWeight: 600,
                            marginBottom: 8
                          }}>
                            {tieneEfectivoCliente ? "💰 Efectivo" : "💳 Tarjeta/Transf"}
                          </div>
                          
                          <div className="reporte-cuadro-botones">
                            <button
                              className="ver-btn"
                              onClick={() => {
                                const productos = ventasCliente.flatMap(v =>
                                  v.detalles.map(d => ({
                                    ...d,
                                    metodo_pago: v.metodo_pago,
                                    cliente: v.cliente,
                                    total: v.total,
                                    cliente_nombre: v.cliente_nombre,
                                    cliente_apellido: v.cliente_apellido,
                                    cliente_telefono: v.cliente_telefono,
                                    cliente_correo: v.cliente_correo
                                  }))
                                );
                                setDetalleDia({ fecha: ventasCliente[0]?.fecha || fecha, productos, cliente });
                              }}
                              title="Ver detalle"
                            >
                              {iconoOjo}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            /* ========================================
               ✅ COMPRAS - TARJETAS SIMPLIFICADAS
               ======================================== */
            if (tipo === "compras") {
              const comprasPorProveedor = agrupadasCompras[fecha] || {};
              
              return (
                <div key={fecha} style={{ width: "100%", marginBottom: 32 }}>
                  <div className="mini-titulo-fecha">{fecha}</div>
                  <div className="reportes-grid-cuadrada">
                    
                    {Object.entries(comprasPorProveedor).map(([proveedor, datos]) => {
                      const { compra, productos } = datos;
                      const comprobante = compra ? {
                        tipo: compra.tipo_comprobante,
                        numero: compra.numero_comprobante,
                        fecha_emision: compra.fecha_emision
                      } : null;
                      
                      const totalProveedor = productos.reduce(
                        (acc, d) => acc + (Number(d.precio || 0) * d.cantidad), 
                        0
                      );

                      return (
                        <div className="reporte-cuadro" key={proveedor}>
                          <div className="reporte-cuadro-fecha">{fecha}</div>
                          
                          {/* ✅ TOTAL */}
                          <div className="reporte-cuadro-total">
                            ${totalProveedor.toFixed(2)}
                          </div>
                          
                          {/* ✅ PROVEEDOR */}
                          <div className="reporte-cuadro-cliente" style={{ 
                            color: "#a32020", 
                            fontWeight: 700,
                            fontSize: 14,
                            lineHeight: 1.3,
                            marginBottom: 6,
                            maxHeight: 36,
                            overflow: "hidden"
                          }}>
                            🔧 {proveedor}
                          </div>
                          
                          {/* ✅ COMPROBANTE COMPACTO */}
                          {comprobante && (
                            <div style={{ 
                              fontSize: 11,
                              color: "#888", 
                              textAlign: "center",
                              lineHeight: 1.2,
                              marginBottom: 10
                            }}>
                              <div style={{ fontWeight: 600, color: "#bbb" }}>
                                {comprobante.tipo}
                              </div>
                              {comprobante.numero && (
                                <div style={{ fontSize: 10, marginTop: 2 }}>
                                  Nº {comprobante.numero}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="reporte-cuadro-botones">
                            <button
                              className="ver-btn"
                              onClick={() =>
                                setDetalleDia({
                                  fecha,
                                  proveedor,
                                  comprobante,
                                  detalles: agruparYSumarProductos(productos)
                                })
                              }
                              title="Ver detalle"
                            >
                              {iconoOjo}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
        
        {/* Paginación */}
        {totalPaginas > 1 && (
          <PaginacionUnificada
            pagina={pagina}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina(p => Math.max(1, p - 1))}
            onSiguiente={() => setPagina(p => Math.min(totalPaginas, p + 1))}
          />
        )}
      </div>
      
      /* ========================================
         ✅ MODAL COMPACTO - COMPRAS Y VENTAS
         ======================================== */
      {detalleDia && (
        <div className="reporte-modal">
          <div className="reporte-modal-content"
            style={{
              maxWidth: 480,  // ← Reducir de 520 a 480
              minWidth: 320,
              width: "100%",
            }}
          >
            {/* Header compacto */}
            <div style={{
              position: "relative",
              marginTop: 18,  // ← Reducir de 24 a 18
              marginBottom: 24,  // ← Reducir de 32 a 24
              minHeight: 40
            }}>
              {/* Botón cliente (solo ventas) */}
              {tipo === "ventas" && detalleDia.productos[0]?.cliente !== "Consumidor final" && (
                <button
                  style={{
                    position: "absolute",
                    right: -28,  // ← Ajustar de -32 a -28
                    top: -28,
                    background: "#232526",
                    color: "#a32020",
                    border: "1.5px solid #a32020",
                    borderRadius: "50%",
                    width: 40,  // ← Reducir de 44 a 40
                    height: 40,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    padding: 0,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.18)"
                  }}
                  onClick={() => setMostrarCliente(v => !v)}
                  title="Ver datos del cliente"
                >
                  <span style={{
                    display: "inline-block",
                    transform: mostrarCliente ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    fontSize: 22,  // ← Reducir de 26 a 22
                    color: "#a32020"
                  }}>▶</span>
                </button>
              )}
              
              {/* Título */}
              <h2 style={{
                color: "#a32020",
                margin: 0,
                fontSize: 26,  // ← Reducir de 30 a 26
                fontWeight: 700,
                letterSpacing: 1,
                width: "100%",
                textAlign: "center",
              }}>
                {tipo === "compras" ? "Detalle de Compra" : "Detalle Venta"}
              </h2>
              
              {/* Fecha */}
              <div style={{
                position: "absolute",
                right: 0,
                top: 36,  // ← Ajustar de 44 a 36
                color: "#bdbdbd",
                fontWeight: 600,
                fontSize: 14,  // ← Reducir de 16 a 14
                minWidth: 100,
                textAlign: "right"
              }}>
                {detalleDia.fecha && !isNaN(new Date(detalleDia.fecha).getTime())
                  ? new Date(detalleDia.fecha).toLocaleDateString("es-AR")
                  : detalleDia.productos?.[0]?.fecha && !isNaN(new Date(detalleDia.productos[0].fecha).getTime())
                    ? new Date(detalleDia.productos[0].fecha).toLocaleDateString("es-AR")
                    : ""}
              </div>
            </div>
            
            {/* ========== COMPRAS ========== */}
            {tipo === "compras" && Array.isArray(detalleDia?.detalles) && (
              <>
                {/* Proveedor */}
                <div style={{
                  background: "#1a1a1a",
                  borderRadius: 8,
                  padding: "8px 16px",  // ← Reducir padding
                  marginBottom: 10,
                  color: "#ffd700",
                  border: "1px solid #353535",
                  fontSize: 14,  // ← Reducir de 15 a 14
                  fontWeight: 600,
                  textAlign: "center"
                }}>
                  🔧 {detalleDia.proveedor}
                </div>
                
                {/* Comprobante */}
                {detalleDia.comprobante && (
                  <div style={{
                    background: "#1a1a1a",
                    borderRadius: 8,
                    padding: "10px 16px",  // ← Reducir padding
                    marginBottom: 16,  // ← Reducir de 20 a 16
                    color: "#fff",
                    border: "1px solid #353535"
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#ffd700", marginBottom: 4 }}>
                      Comprobante
                    </div>
                    <div style={{ fontSize: 13 }}><b>Tipo:</b> {detalleDia.comprobante.tipo}</div>
                    {detalleDia.comprobante.numero && (
                      <div style={{ fontSize: 13 }}><b>Número:</b> {detalleDia.comprobante.numero}</div>
                    )}
                    {detalleDia.comprobante.fecha_emision && (
                      <div style={{ fontSize: 13 }}>
                        <b>Emisión:</b> {new Date(detalleDia.comprobante.fecha_emision).toLocaleDateString("es-AR")}
                      </div>
                    )}
                  </div>
                )}
                
                {/* ✅ PRODUCTOS CON SCROLL */}
                <div style={{
                  maxHeight: 340,  // ← Reducir de 400 a 340
                  overflowY: "auto",
                  paddingRight: 8,
                  marginBottom: 10
                }}>
                  {detalleDia.detalles.map((d: any, i: number) => (
                    <div key={i} style={{ 
                      marginBottom: 14,  // ← Reducir de 16 a 14
                      color: "#fff", 
                      paddingBottom: 10,  // ← Reducir de 12 a 10
                      borderBottom: "1px solid #333",
                      fontSize: 13  // ← Reducir de 14 a 13
                    }}>
                      <div><b>Producto:</b> {d.nombre}</div>
                      <div><b>Marca:</b> {d.marca || "Sin marca"}</div>
                      <div><b>Cantidad:</b> {d.cantidad}</div>
                      {d.precio && (
                        <>
                          <div><b>Precio unitario:</b> ${Number(d.precio).toFixed(2)}</div>
                          <div style={{ fontWeight: 700, color: "#ffd700" }}>
                            <b>Subtotal:</b> ${(Number(d.precio) * d.cantidad).toFixed(2)}
                          </div>
                        </>
                      )}
                      {d.observaciones && d.observaciones.trim() !== "" && (
                        <div style={{ marginTop: 3, fontStyle: "italic", color: "#bdbdbd", fontSize: 12 }}>
                          <b>Obs:</b> {d.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Total */}
                <div style={{
                  marginTop: 14,  // ← Reducir de 18 a 14
                  paddingTop: 10,  // ← Reducir de 12 a 10
                  borderTop: "2px solid #a32020",
                  fontWeight: 700,
                  fontSize: 16,  // ← Reducir de 18 a 16
                  color: "#ffd700",
                  textAlign: "right"
                }}>
                  Total: ${detalleDia.detalles.reduce(
                    (acc: number, d: any) => acc + (Number(d.precio || 0) * d.cantidad),
                    0
                  ).toFixed(2)}
                </div>
              </>
            )}

            {/* ========== VENTAS ========== */}
            {tipo === "ventas" && Array.isArray(detalleDia?.productos) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* ✅ PRODUCTOS CON SCROLL */}
                <div style={{
                  maxHeight: 360,  // ← Reducir de 420 a 360
                  overflowY: "auto",
                  paddingRight: 8,
                }}>
                  {detalleDia.productos.map((d: any, i: number) => {
                    const esTarjeta = d.metodo_pago === "tarjeta";
                    const esTransferencia = d.metodo_pago === "transferencia";
                    const esMorado = esTarjeta || esTransferencia;
                    const totalProducto = Number(d.precio) * Number(d.cantidad);

                    return (
                      <div
                        key={i}
                        style={{
                          marginBottom: 18,  // ← Reducir de 22 a 18
                          color: esMorado ? "#b36aff" : "#fff",
                          background: esMorado ? "#232526" : "inherit",
                          paddingBottom: 10,  // ← Reducir de 12 a 10
                          borderBottom: "1px solid #333",
                          fontSize: 13  // ← Reducir tamaño de fuente
                        }}
                      >
                        <div><b>Producto:</b> {d.nombre}</div>
                        {d.marca && <div><b>Marca:</b> {d.marca}</div>}
                        <div><b>Precio unitario:</b> ${Number(d.precio).toFixed(2)}</div>
                        <div><b>Cantidad:</b> {d.cantidad}</div>
                        <div><b>Método de pago:</b> {d.metodo_pago}</div>
                        <div style={{ fontWeight: 700, color: esMorado ? "#b36aff" : "#ffd700" }}>
                          <b>Subtotal:</b> ${totalProducto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          {esTarjeta && (
                            <span style={{ fontWeight: 400, fontSize: 12 }}> (incluye recargo)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Totales */}
                <div style={{ paddingTop: 10, borderTop: "2px solid #a32020" }}>
                  <div style={{ fontWeight: 700, color: "#4caf50", fontSize: 15, textAlign: "right", marginBottom: 4 }}>
                    💰 Efectivo: $
                    {detalleDia.productos
                      .filter((d: any) => d.metodo_pago === "efectivo")
                      .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0)
                      .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontWeight: 700, color: "#b36aff", fontSize: 15, textAlign: "right" }}>
                    💳 TJ/TF: $
                    {detalleDia.productos
                      .filter((d: any) => d.metodo_pago === "tarjeta" || d.metodo_pago === "transferencia")
                      .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0)
                      .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              gap: 48,  // ← Reducir de 64 a 48
              marginTop: 20  // ← Reducir de 28 a 20
            }}>
              <button
                className="exportar-pdf-btn"
                style={{
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 20px",  // ← Reducir padding
                  fontWeight: 700,
                  fontSize: 14,  // ← Reducir de 16 a 14
                  cursor: "pointer",
                  minHeight: 40  // ← Reducir de 48 a 40
                }}
                onClick={() => tipo === "compras"
                  ? exportarDetalleCompraAPDF(detalleDia)
                  : exportarDetalleAPDF(detalleDia)
                }
              >
                Exportar a PDF
              </button>
              <button
                className="cerrar-modal-btn"
                style={{
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 20px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  minHeight: 40
                }}
                onClick={() => setDetalleDia(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
          
          {/* Modal de datos del cliente (ventas) */}
          {mostrarCliente && detalleDia.productos[0]?.cliente !== "Consumidor final" && (
            <div style={{
              position: "fixed",
              top: "50%",
              left: "calc(50% + 300px)",  // ← Ajustar de 340px a 300px
              transform: "translateY(-50%)",
              background: "#232526",
              borderRadius: 12,
              boxShadow: "0 2px 18px rgba(0,0,0,0.22)",
              padding: "22px 28px",  // ← Reducir padding
              minWidth: 280,  // ← Reducir de 320 a 280
              zIndex: 9999,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 8,  // ← Reducir de 10 a 8
            }}>
              <div style={{
                marginBottom: 8,
                fontWeight: 700,
                fontSize: 17,  // ← Reducir de 19 a 17
                color: "#a32020",
                letterSpacing: 0.5,
              }}>
                Datos del Cliente
              </div>
              <div style={{ fontSize: 13 }}>
                <b>Nombre y Apellido:</b><br />
                {(detalleDia.productos[0].cliente_nombre || "") + " " + (detalleDia.productos[0].cliente_apellido || "")}
              </div>
              {detalleDia.productos[0].cliente_correo && (
                <div style={{ fontSize: 13 }}>
                  <b>Correo:</b><br />{detalleDia.productos[0].cliente_correo}
                </div>
              )}
              {detalleDia.productos[0].cliente_telefono && (
                <div style={{ fontSize: 13 }}>
                  <b>Teléfono:</b><br />{detalleDia.productos[0].cliente_telefono}
                </div>
              )}
              <button
                style={{
                  marginTop: 14,  // ← Reducir de 18 a 14
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 20px",  // ← Reducir padding
                  fontWeight: 700,
                  fontSize: 14,  // ← Reducir de 15 a 14
                  cursor: "pointer"
                }}
                onClick={() => setMostrarCliente(false)}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ FUNCIONES DE EXPORTACIÓN A PDF ACTUALIZADAS

function exportarDetalleAPDF(detalle: any) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(20);
  doc.setTextColor(163, 32, 32);
  doc.text("Detalle de Venta", 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Fecha: ${
      detalle.fecha
        ? new Date(detalle.fecha).toLocaleDateString("es-AR")
        : ""
    }`,
    105,
    y,
    { align: "center" }
  );

  y += 12;

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  detalle.productos.forEach((d: any, i: number) => {
    doc.text(`Producto: ${d.nombre}`, 20, y);
    y += 7;
    if (d.marca) {
      doc.text(`Marca: ${d.marca}`, 20, y);
      y += 7;
    }
    doc.text(`Precio unitario: $${Number(d.precio).toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${d.cantidad}`, 20, y);
    y += 7;
    doc.text(`Método de pago: ${d.metodo_pago}`, 20, y);
    y += 7;
    doc.text(
      `Subtotal: $${(Number(d.precio) * Number(d.cantidad)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
      20,
      y
    );
    y += 10;
    if (y > 230) {
      doc.addPage();
      y = 18;
    }
  });

  const total = detalle.productos
    .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0);

  y += 4;
  doc.setDrawColor(163, 32, 32);
  doc.line(15, y, 195, y);

  y += 10;

  doc.setFontSize(15);
  doc.setTextColor(163, 32, 32);
  doc.text(
    `Total vendido: $${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
    20,
    y
  );

  const cliente = detalle.productos[0];
  if (
    cliente?.cliente_nombre ||
    cliente?.cliente_apellido ||
    cliente?.cliente_telefono ||
    cliente?.cliente_correo
  ) {
    let datos = "";
    if (cliente.cliente_nombre || cliente.cliente_apellido)
      datos += `${cliente.cliente_nombre || ""} ${cliente.cliente_apellido || ""}\n`;
    if (cliente.cliente_telefono)
      datos += `${cliente.cliente_telefono}\n`;
    if (cliente.cliente_correo)
      datos += `${cliente.cliente_correo}\n`;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(datos.trim(), 150, y);
  }

  doc.save("detalle-venta.pdf");
}

function exportarDetalleCompraAPDF(detalle: any) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(20);
  doc.setTextColor(163, 32, 32);
  doc.text("Detalle de Compra", 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fecha: ${detalle.fecha}`, 105, y, { align: "center" });

  // ✅ AGREGAR DATOS DEL COMPROBANTE
  if (detalle.comprobante) {
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Comprobante: ${detalle.comprobante.tipo}`, 20, y);
    if (detalle.comprobante.numero) {
      y += 6;
      doc.text(`Nº: ${detalle.comprobante.numero}`, 20, y);
    }
    if (detalle.comprobante.fecha_emision) {
      y += 6;
      doc.text(
        `Emisión: ${new Date(detalle.comprobante.fecha_emision).toLocaleDateString("es-AR")}`,
        20,
        y
      );
    }
  }

  y += 12;
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);

  let totalGeneral = 0;

  detalle.detalles.forEach((d: any, i: number) => {
    doc.text(`Producto: ${d.nombre}`, 20, y);
    y += 7;
    doc.text(`Marca: ${d.marca || "Sin marca"}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${d.cantidad}`, 20, y);
    y += 7;
    
    // ✅ AGREGAR PRECIOS
    if (d.precio) {
      doc.text(`Precio unitario: $${Number(d.precio).toFixed(2)}`, 20, y);
      y += 7;
      const subtotal = Number(d.precio) * d.cantidad;
      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 20, y);
      totalGeneral += subtotal;
      y += 7;
    }
    
    if (d.observaciones && d.observaciones.trim() !== "") {
      doc.text(`Obs: ${d.observaciones}`, 20, y);
      y += 7;
    }
    y += 3;
    if (y > 230) {
      doc.addPage();
      y = 18;
    }
  });

  // ✅ AGREGAR TOTAL GENERAL
  y += 4;
  doc.setDrawColor(163, 32, 32);
  doc.line(15, y, 195, y);

  y += 10;
  doc.setFontSize(15);
  doc.setTextColor(163, 32, 32);
  doc.text(`Total compra: $${totalGeneral.toFixed(2)}`, 20, y);

  doc.save("detalle-compra.pdf");
}

export default Reportes;