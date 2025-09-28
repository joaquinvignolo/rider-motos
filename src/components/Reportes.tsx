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
  cliente_telefono?: string;
  cliente_email?: string;
  detalles: {
    nombre: string;
    descripcion: string;
    marca: string;
    cantidad: number;
    precio: number;
    metodo_pago?: string; 
  }[];
};

type Compra = {
  id: number;
  fecha: string;
  proveedor: string;
  total: number;
  detalles: {
    nombre: string;
    cantidad: number;
    observaciones?: string;
    precio?: number;
  }[];
};

function agruparPorFecha(ventas: Venta[]) {
  const agrupadas: { [fecha: string]: Venta[] } = {};
  ventas.forEach(v => {
    const fecha = new Date(v.fecha).toLocaleDateString();
    if (!agrupadas[fecha]) agrupadas[fecha] = [];
    agrupadas[fecha].push(v);
  });
  return agrupadas;
}

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
  const [mostrarClienteDatos, setMostrarClienteDatos] = useState(false);

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
    const fecha = new Date(r.fecha);
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
    const fecha = new Date(r.fecha).toLocaleDateString();
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(r);
    return acc;
  }, {});
  const fechas = Object.keys(agrupadas);
  const diasPorPagina = 5;
  const totalPaginas = Math.ceil(fechas.length / diasPorPagina);
  const fechasPagina = fechas.slice((pagina - 1) * diasPorPagina, pagina * diasPorPagina);

  // Agrupar compras por fecha y tipo (motos, accesorios, repuestos)
  const agrupadasCompras: {
    [fecha: string]: {
      motos: any[];
      accesorios: any[];
      [proveedor: string]: any[];
    };
  } = {};

  if (tipo === "compras") {
    filtrados.forEach((compra: Compra) => {
      const fecha = new Date(compra.fecha).toLocaleDateString();
      if (!agrupadasCompras[fecha]) agrupadasCompras[fecha] = { motos: [], accesorios: [] };

      // Separar detalles por tipo
      const motos: typeof compra.detalles = [];
      const accesorios: typeof compra.detalles = [];
      const repuestos: typeof compra.detalles = [];

      compra.detalles.forEach(d => {
        const nombre = d.nombre?.toLowerCase() || "";
        if (
          nombre.includes("moto") ||
          nombre.includes("xtz") ||
          nombre.includes("ninja") ||
          nombre.includes("cb") ||
          nombre.includes("cg") ||
          nombre.includes("xr") ||
          nombre.includes("wave") ||
          nombre.includes("z400") ||
          nombre.includes("tornado") ||
          nombre.includes("crypton") ||
          nombre.includes("fazer") ||
          nombre.includes("fz") ||
          nombre.includes("titan")
        ) {
          motos.push(d);
        } else if (d.observaciones && (d.observaciones.toLowerCase().includes("accesorio") || nombre.includes("accesorio"))) {
          accesorios.push(d);
        } else {
          repuestos.push(d);
        }
      });

      // Motos: agrupar todos los detalles de motos en una sola tarjeta por día
      if (motos.length > 0) {
        agrupadasCompras[fecha].motos.push(...motos);
      }
      // Accesorios: agrupar todos los detalles de accesorios en una sola tarjeta por día
      if (accesorios.length > 0) {
        agrupadasCompras[fecha].accesorios.push(...accesorios);
      }
      // Repuestos: siguen agrupados por proveedor
      if (repuestos.length > 0) {
        const prov = compra.proveedor?.trim() || "Sin proveedor";
        if (!agrupadasCompras[fecha][prov]) agrupadasCompras[fecha][prov] = [];
        agrupadasCompras[fecha][prov].push(...repuestos);
      }
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
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: 18, gap: 12 }}>
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
        {fechasPagina.length === 0 ? (
          <div className="reportes-vacio">
            <span role="img" aria-label="historial" style={{ fontSize: 40, marginBottom: 12 }}>📄</span>
            <div>
              No hay {tipo === "ventas" ? "ventas" : "compras"} registradas aún.
            </div>
          </div>
        ) : (
          fechasPagina.map(fecha => {
            if (tipo === "ventas") {
              const ventasDelDia = agrupadas[fecha];

              // Agrupar: accesorios/repuestos (consumidor final) y motos (otros clientes)
              const accesorios = ventasDelDia.filter(v => v.cliente === "Consumidor final");
              const clientesMotos = ventasDelDia.filter(v => v.cliente !== "Consumidor final");
              // Agrupar motos por cliente
              const motosPorCliente: { [cliente: string]: Venta[] } = {};
              clientesMotos.forEach(v => {
                if (!motosPorCliente[v.cliente]) motosPorCliente[v.cliente] = [];
                motosPorCliente[v.cliente].push(v);
              });

              // Calcular total del día para cada grupo
              const totalAccesoriosEfectivo = accesorios
                .filter(v => v.metodo_pago !== "tarjeta de crédito" && v.metodo_pago !== "transferencia")
                .reduce((acc, v) => acc + Number(v.total), 0);
              const totalAccesoriosTarjTransf = accesorios
                .filter(v => v.metodo_pago === "tarjeta de crédito" || v.metodo_pago === "transferencia")
                .reduce((acc, v) => acc + Number(v.total), 0);

              const tieneEfectivo = accesorios.some(v => v.metodo_pago === "efectivo");
              const totalAccesorios = tieneEfectivo
                ? accesorios
                    .filter(v => v.metodo_pago === "efectivo")
                    .reduce((acc, v) => acc + Number(v.total), 0)
                : accesorios.reduce((acc, v) => acc + Number(v.total), 0);

              const totalPorCliente: { [cliente: string]: number } = {};
              Object.entries(motosPorCliente).forEach(([cliente, ventasCliente]) => {
                const efectivo = ventasCliente
                  .filter(v => v.metodo_pago !== "tarjeta de crédito" && v.metodo_pago !== "transferencia")
                  .reduce((acc, v) => acc + Number(v.total), 0);
                const tarjTransf = ventasCliente
                  .filter(v => v.metodo_pago === "tarjeta de crédito" || v.metodo_pago === "transferencia")
                  .reduce((acc, v) => acc + Number(v.total), 0);
                totalPorCliente[cliente] = efectivo > 0 ? efectivo : tarjTransf;
              });

              return (
                <div key={fecha} style={{ width: "100%", marginBottom: 32 }}>
                  <div className="mini-titulo-fecha">{fecha}</div>
                  <div className="reportes-grid-cuadrada">
                    {/* Accesorios/Repuestos - Consumidor final */}
                    {accesorios.length > 0 && (
                      <div className="reporte-cuadro">
                        <div className="reporte-cuadro-fecha">{fecha}</div>
                        <div className="reporte-cuadro-total">
                          ${Number(totalAccesorios).toFixed(2)}
                        </div>
                        <div className="reporte-cuadro-cliente">Consumidor final</div>
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
                    {/* Motos - por cliente */}
                    {Object.entries(motosPorCliente).map(([cliente, ventasCliente]) => (
                      <div className="reporte-cuadro" key={cliente}>
                        <div className="reporte-cuadro-fecha">{fecha}</div>
                        <div className="reporte-cuadro-total">
                          ${Number(totalPorCliente[cliente]).toFixed(2)}
                        </div>
                        {/* Datos del cliente */}
                        <div className="reporte-cuadro-cliente" style={{ marginBottom: 20 }}>
                          <b style={{ display: "block", marginBottom: 4 }}>
                            {(ventasCliente[0].cliente_nombre || "") + " " + (ventasCliente[0].cliente_apellido || "")}
                          </b>
                          {ventasCliente[0].cliente_telefono && (
                            <div style={{ marginBottom: 4 }}>{ventasCliente[0].cliente_telefono}</div>
                          )}
                          {ventasCliente[0].cliente_correo && (
                            <div style={{ marginBottom: 4 }}>{ventasCliente[0].cliente_correo}</div>
                          )}
                        </div>
                        <div className="reporte-cuadro-botones">
                          <button
                            className="ver-btn"
                            onClick={() => {
                              // Calcula el método de pago principal
                              const efectivo = ventasCliente
                                .filter(v => v.metodo_pago !== "tarjeta de crédito" && v.metodo_pago !== "transferencia");
                              const tarjTransf = ventasCliente
                                .filter(v => v.metodo_pago === "tarjeta de crédito" || v.metodo_pago === "transferencia");
                              const ventasFiltradas = efectivo.length > 0 ? efectivo : tarjTransf;

                              // Solo incluí los productos de las ventas filtradas
                              const productos = ventasFiltradas.flatMap(v =>
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

                              setDetalleDia({ fecha: ventasFiltradas[0]?.fecha || fecha, productos, cliente });
                            }}
                            title="Ver detalle"
                          >
                            {iconoOjo}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (tipo === "compras") {
              const comprasPorTipo = agrupadasCompras[fecha] || {};
              return (
                <div key={fecha} style={{ width: "100%", marginBottom: 32 }}>
                  <div className="mini-titulo-fecha">{fecha}</div>
                  <div className="reportes-grid-cuadrada">
                    {/* Motos */}
                    {comprasPorTipo.motos && comprasPorTipo.motos.length > 0 && (
                      <div className="reporte-cuadro" key="motos">
                        <div className="reporte-cuadro-fecha">{fecha}</div>
                        <div
                          className="reporte-cuadro-cliente"
                          style={{
                            color: "#a32020",
                            fontWeight: 700
                          }}
                        >
                          Motos
                        </div>
                        <div className="reporte-cuadro-botones">
                          <button
                            className="ver-btn"
                            onClick={() =>
                              setDetalleDia({
                                fecha,
                                proveedor: "Motos",
                                detalles: agruparYSumarProductos(comprasPorTipo.motos)
                              })
                            }
                            title="Ver detalle"
                          >
                            {iconoOjo}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Accesorios */}
                    {comprasPorTipo.accesorios && comprasPorTipo.accesorios.length > 0 && (
                      <div className="reporte-cuadro" key="accesorios">
                        <div className="reporte-cuadro-fecha">{fecha}</div>
                        <div
                          className="reporte-cuadro-cliente"
                          style={{
                            color: "#a32020",
                            fontWeight: 700
                          }}
                        >
                          Accesorios
                        </div>
                        <div className="reporte-cuadro-botones">
                          <button
                            className="ver-btn"
                            onClick={() =>
                              setDetalleDia({
                                fecha,
                                proveedor: "Accesorios",
                                detalles: agruparYSumarProductos(comprasPorTipo.accesorios)
                              })
                            }
                            title="Ver detalle"
                          >
                            {iconoOjo}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Repuestos por proveedor */}
                    {Object.entries(comprasPorTipo)
                      .filter(([prov]) => prov !== "motos" && prov !== "accesorios")
                      .map(([prov, detallesProveedor]) => (
                        <div className="reporte-cuadro" key={prov}>
                          <div className="reporte-cuadro-fecha">{fecha}</div>
                          <div
                            className="reporte-cuadro-cliente"
                            style={{
                              color: "#a32020",
                              fontWeight: 700
                            }}
                          >
                            {prov}
                          </div>
                          <div className="reporte-cuadro-botones">
                            <button
                              className="ver-btn"
                              onClick={() =>
                                setDetalleDia({
                                  fecha,
                                  proveedor: prov,
                                  detalles: agruparYSumarProductos(detallesProveedor)
                                })
                              }
                              title="Ver detalle"
                            >
                              {iconoOjo}
                            </button>
                          </div>
                        </div>
                      ))}
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
      {/* MODAL DE DETALLE (para compras y ventas) */}
      {detalleDia && (
        <div className="reporte-modal">
          <div className="reporte-modal-content">
            <div style={{
              position: "relative",
              marginTop: 24,
              marginBottom: 32,
              minHeight: 48
            }}>
              {}
              {tipo === "ventas" && detalleDia.productos[0]?.cliente !== "Consumidor final" && (
                <button
                  style={{
                    position: "absolute",
                    right: -32, 
                    top: -32,  
                    background: "#232526",
                    color: "#a32020",
                    border: "1.5px solid #a32020",
                    borderRadius: "50%",
                    width: 44,
                    height: 44,
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
                    fontSize: 26,
                    color: "#a32020"
                  }}>▶</span>
                </button>
              )}
              {/* Título centrado */}
              <h2 style={{
                color: "#a32020",
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 1,
                width: "100%",
                textAlign: "center",
              }}>
                {tipo === "compras" ? "Detalle de Compra" : "Detalle Venta"}
              </h2>
              {/* Fecha en diagonal abajo a la derecha del título */}
              <div style={{
                position: "absolute",
                right: 0,
                top: 44,
                color: "#bdbdbd",
                fontWeight: 600,
                fontSize: 16,
                minWidth: 120,
                textAlign: "right"
              }}>
                {detalleDia.fecha && !isNaN(new Date(detalleDia.fecha).getTime())
                  ? new Date(detalleDia.fecha).toLocaleDateString("es-AR")
                  : detalleDia.productos?.[0]?.fecha && !isNaN(new Date(detalleDia.productos[0].fecha).getTime())
                    ? new Date(detalleDia.productos[0].fecha).toLocaleDateString("es-AR")
                    : ""}
              </div>
            </div>
            {/* ----------- COMPRAS ----------- */}
            {tipo === "compras" && Array.isArray(detalleDia?.detalles) && (
              <>
                {/* Proveedor real o tipo */}
                {detalleDia.proveedor && detalleDia.proveedor !== "Motos" && detalleDia.proveedor !== "Accesorios" && (
                  <div style={{
                    marginBottom: 18,
                    background: "#232526",
                    borderRadius: 8,
                    padding: "10px 18px",
                    color: "#fff"
                  }}>
                    <b>Proveedor:</b> {detalleDia.proveedor}
                  </div>
                )}
                {(detalleDia.proveedor === "Motos" || detalleDia.proveedor === "Accesorios") && (
                  <div style={{
                    marginBottom: 18,
                    background: "#232526",
                    borderRadius: 8,
                    padding: "10px 18px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 18
                  }}>
                    {detalleDia.proveedor}
                  </div>
                )}
                {/* Detalles de productos */}
                {detalleDia.detalles.map((d: any, i: number) => (
                  <div key={i} style={{ marginBottom: 12, color: "#fff" }}>
                    <div><b>Nombre:</b> {d.nombre}</div>
                    <div><b>Cantidad:</b> {d.cantidad}</div>
                    {/* Si es accesorio, mostrar calidad */}
                    {detalleDia.proveedor === "Accesorios" && (
                      <div>
                        <b>Calidad:</b>{" "}
                        {d.observaciones?.toLowerCase().includes("primera")
                          ? "Primera marca"
                          : d.observaciones?.toLowerCase().includes("segunda")
                          ? "Segunda marca"
                          : "-"}
                      </div>
                    )}
                    {/* Si es moto, mostrar marca */}
                    {detalleDia.proveedor === "Motos" && d.marca && (
                      <div>
                        <b>Marca:</b> {d.marca}
                      </div>
                    )}
                    {/* Si es repuesto, mostrar proveedor */}
                    {detalleDia.proveedor !== "Motos" && detalleDia.proveedor !== "Accesorios" && (
                      <div>
                        <b>Proveedor:</b> {detalleDia.proveedor}
                      </div>
                    )}
                    {/* Observación para todos si existe */}
                    {d.observaciones && (
                      <div><b>Observación:</b> {d.observaciones}</div>
                    )}
                    {d.precio && (
                      <div><b>Precio unitario:</b> ${Number(d.precio).toFixed(2)}</div>
                    )}
                  </div>
                ))}
                {/* Total general de la compra */}
                <div style={{
                  marginTop: 18,
                  fontWeight: 700,
                  color: "#a32020",
                  fontSize: 18,
                  textAlign: "right"
                }}>
                  Total: $
                  {detalleDia.detalles
                    .reduce((acc: number, d: any) => acc + (Number(d.precio) || 0) * (Number(d.cantidad) || 0), 0)
                    .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </div>
              </>
            )}

            {/* ----------- VENTAS ----------- */}
            {tipo === "ventas" && Array.isArray(detalleDia?.productos) && (
              <div style={{ display: "flex", flexDirection: "row", gap: 24 }}>
                <div style={{ flex: 2 }}>
                  {detalleDia.productos.map((d: any, i: number) => {
                    // Detecta tarjeta de crédito y transferencia
                    const esTarjeta = d.metodo_pago?.toLowerCase().includes("tarjeta");
                    const esTransferencia = d.metodo_pago?.toLowerCase().includes("transferencia");
                    const esMorado = esTarjeta || esTransferencia;

                    // Si el recargo ya viene aplicado desde ventas, no lo sumes de nuevo
                    // Si NO viene aplicado, descomenta la línea siguiente y ajusta el porcentaje
                    // const recargo = esTarjeta ? 0.2 : 0;
                    // const totalProducto = (Number(d.precio) * Number(d.cantidad)) * (1 + recargo);

                    const totalProducto = Number(d.precio) * Number(d.cantidad);

                    return (
                      <div
                        key={i}
                        style={{
                          marginBottom: 22,
                          color: esMorado ? "#b36aff" : "#fff",
                          background: esMorado ? "#232526" : "inherit",
                          paddingBottom: 12,
                          borderBottom: "1px solid #333",
                        }}
                      >
                        <div>
                          <b style={{ color: esMorado ? "#b36aff" : "#fff" }}>Nombre:</b> {d.nombre}
                        </div>
                        <div>
                          <b style={{ color: esMorado ? "#b36aff" : "#fff" }}>Cantidad:</b> {d.cantidad}
                        </div>
                        <div>
                          <b style={{ color: esMorado ? "#b36aff" : "#fff" }}>Método de pago:</b>{" "}
                          <span style={{ color: esMorado ? "#b36aff" : "#fff" }}>{d.metodo_pago}</span>
                        </div>
                        <div>
                          <b style={{ color: esMorado ? "#b36aff" : "#fff" }}>Total producto:</b>{" "}
                          ${totalProducto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          {esTarjeta && (
                            <span style={{ color: "#b36aff", fontWeight: 400, fontSize: 13 }}>
                              {" "} (incluye recargo)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Total efectivo: solo suma productos con método de pago efectivo */}
                  <div style={{ marginTop: 18, fontWeight: 700, color: "#a32020", fontSize: 18, textAlign: "right" }}>
                    Total efectivo: $
                    {detalleDia.productos
                      .filter((d: any) => d.metodo_pago?.toLowerCase() === "efectivo")
                      .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0)
                      .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                  {/* Total en TJ/TF: suma tarjeta y transferencia, solo tarjeta lleva recargo */}
                  <div style={{ fontWeight: 700, color: "#b36aff", fontSize: 18, textAlign: "right" }}>
                    Total en TJ/TF: $
                    {detalleDia.productos
                      .filter((d: any) =>
                        d.metodo_pago?.toLowerCase().includes("tarjeta") ||
                        d.metodo_pago?.toLowerCase().includes("transferencia")
                      )
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
              alignItems: "flex-end",
              gap: 64,
              marginTop: 28
            }}>
              <button
                className="exportar-pdf-btn"
                style={{
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 22px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  minHeight: 48
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
                  padding: "8px 22px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  minHeight: 48
                }}
                onClick={() => setDetalleDia(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
          {/* MODAL APARTE DE DATOS DEL CLIENTE */}
          {mostrarCliente && detalleDia.productos[0]?.cliente !== "Consumidor final" && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "calc(50% + 340px)", // Ajusta según el ancho de tu modal principal
                transform: "translateY(-50%)",
                background: "#232526",
                borderRadius: 12,
                boxShadow: "0 2px 18px rgba(0,0,0,0.22)",
                padding: "28px 32px",
                minWidth: 320,
                zIndex: 9999,
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                  fontWeight: 700,
                  fontSize: 19,
                  color: "#a32020",
                  letterSpacing: 0.5,
                }}
              >
                Datos del Cliente
              </div>
              <div>
                <b>Nombre y Apellido:</b>
                <br />
                {(detalleDia.productos[0].cliente_nombre || "") +
                  " " +
                  (detalleDia.productos[0].cliente_apellido || "")}
              </div>
              {detalleDia.productos[0].cliente_correo && (
                <div>
                  <b>Correo:</b>
                  <br />
                  {detalleDia.productos[0].cliente_correo}
                </div>
              )}
              {detalleDia.productos[0].cliente_telefono && (
                <div>
                  <b>Teléfono:</b>
                  <br />
                  {detalleDia.productos[0].cliente_telefono}
                </div>
              )}
              <button
                style={{
                  marginTop: 18,
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 22px",
                  fontWeight: 700,
                  fontSize: 15,
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

function exportarDetalleAPDF(detalle: any) {
  const doc = new jsPDF();
  let y = 18;

  // Título
  doc.setFontSize(20);
  doc.setTextColor(163, 32, 32);
  doc.text("Detalle de Venta", 105, y, { align: "center" });

  // Fecha (centrada, sin datos de cliente al lado)
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

  // Productos
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  detalle.productos.forEach((d: any, i: number) => {
    doc.text(`Nombre: ${d.nombre}`, 20, y);
    y += 7;
    if (d.descripcion) {
      doc.text(`Descripción: ${d.descripcion}`, 20, y);
      y += 7;
    }
    doc.text(`Precio: $${Number(d.precio).toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${d.cantidad}`, 20, y);
    y += 7;
    doc.text(`Precio unitario: $${Number(d.precio).toFixed(2)}`, 20, y);
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

  // Total general
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

  // Datos del cliente (solo abajo a la derecha si existe)
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

  y += 12;
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);

  detalle.detalles.forEach((d: any, i: number) => {
    doc.text(`Nombre: ${d.nombre}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${d.cantidad}`, 20, y);
    y += 7;
    if (d.observaciones) {
      doc.text(`Observación: ${d.observaciones}`, 20, y);
      y += 7;
    }
    // Marca para accesorios y repuestos
    if (
      detalle.proveedor === "Accesorios" ||
      (detalle.proveedor !== "Motos" && detalle.proveedor !== "Motos")
    ) {
      let marca = "-";
      if (d.observaciones?.toLowerCase().includes("primera")) marca = "Primera marca";
      else if (d.observaciones?.toLowerCase().includes("segunda")) marca = "Segunda marca";
      doc.text(`Marca: ${marca}`, 20, y);
      y += 7;
    }
    y += 3;
    if (y > 230) {
      doc.addPage();
      y = 18;
    }
  });

  y += 4;
  doc.setDrawColor(163, 32, 32);
  doc.line(15, y, 195, y);

  doc.save("detalle-compra.pdf");
}

export default Reportes;