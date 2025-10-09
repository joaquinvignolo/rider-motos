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
    descripcion?: string;
    marca: string;
    cantidad: number;
    precio: number;
    metodo_pago?: string;
  }[];
};

type Compra = {
  id: number;
  fecha: string;
  fecha_emision?: string;
  tipo_comprobante?: string;
  numero_comprobante?: string;
  proveedor: string;
  total: number;
  observaciones?: string;
  detalles: {
    nombre: string;
    tipo: string;
    marca: string;
    cantidad: number;
    precio?: number;
    observaciones?: string;
  }[];
};

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

  useEffect(() => {
    fetch("http://localhost:3001/api/ventas")
      .then(res => res.json())
      .then(data => setVentas(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Error cargando ventas:", err);
        setVentas([]);
      });
      
    fetch("http://localhost:3001/api/compras")
      .then(res => res.json())
      .then(data => setCompras(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Error cargando compras:", err);
        setCompras([]);
      });
  }, []);

  const handleTipo = () => {
    setTipo(tipo === "ventas" ? "compras" : "ventas");
    setBusqueda("");
    setDesde("");
    setHasta("");
    setPagina(1);
    setDetalleDia(null);
  };

  const registros = tipo === "ventas" ? ventas : compras;
  const filtrados = registros.filter(r => {
    const fecha = tipo === "compras" 
      ? new Date(r.fecha_emision || r.fecha)
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

  const agrupadas = filtrados.reduce((acc: any, r: any) => {
    const fecha = tipo === "compras"
      ? new Date(r.fecha_emision || r.fecha).toLocaleDateString()
      : new Date(r.fecha).toLocaleDateString();
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(r);
    return acc;
  }, {});
  const fechas = Object.keys(agrupadas);
  const diasPorPagina = 5;
  const totalPaginas = Math.ceil(fechas.length / diasPorPagina);
  const fechasPagina = fechas.slice((pagina - 1) * diasPorPagina, pagina * diasPorPagina);

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
      
      if (!agrupadasCompras[fecha][proveedor]) {
        agrupadasCompras[fecha][proveedor] = {
          compra: compra,
          productos: []
        };
      }
      
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
            
            if (tipo === "ventas") {
              const ventasDelDia = agrupadas[fecha];
              const accesorios = ventasDelDia.filter((v: Venta) => v.cliente === "Consumidor final");
              const clientesMotos = ventasDelDia.filter((v: Venta) => v.cliente !== "Consumidor final");
              const motosPorCliente: { [cliente: string]: Venta[] } = {};
              clientesMotos.forEach((v: Venta) => {
                if (!motosPorCliente[v.cliente]) motosPorCliente[v.cliente] = [];
                motosPorCliente[v.cliente].push(v);
              });

              // ✅ CALCULAR MÉTODOS DE PAGO CORRECTAMENTE
              const calcularMetodosPago = (ventas: Venta[]) => {
                const productos = ventas.flatMap(v => v.detalles);
                const tieneEfectivo = productos.some(p => p.metodo_pago === "efectivo");
                const tieneTarjeta = productos.some(p => p.metodo_pago === "tarjeta");
                const tieneTransferencia = productos.some(p => p.metodo_pago === "transferencia");
                
                const totalEfectivo = productos
                  .filter(p => p.metodo_pago === "efectivo")
                  .reduce((acc, p) => acc + Number(p.precio) * p.cantidad, 0);
                
                const totalTarjetaTransf = productos
                  .filter(p => p.metodo_pago === "tarjeta" || p.metodo_pago === "transferencia")
                  .reduce((acc, p) => acc + Number(p.precio) * p.cantidad, 0);
                
                return {
                  tieneEfectivo,
                  tieneTarjeta,
                  tieneTransferencia,
                  esMixto: (tieneEfectivo && (tieneTarjeta || tieneTransferencia)),
                  totalEfectivo,
                  totalTarjetaTransf,
                  totalGeneral: totalEfectivo + totalTarjetaTransf
                };
              };

              const metodosAccesorios = calcularMetodosPago(accesorios);

              return (
                <div key={fecha} style={{ width: "100%", marginBottom: 32 }}>
                  <div className="mini-titulo-fecha">{fecha}</div>
                  <div className="reportes-grid-cuadrada">
                    
                    {accesorios.length > 0 && (
                      <div className="reporte-cuadro">
                        <div className="reporte-cuadro-fecha">{fecha}</div>
                        <div className="reporte-cuadro-total">
                          ${metodosAccesorios.totalGeneral.toFixed(2)}
                        </div>
                        
                        <div className="reporte-cuadro-cliente" style={{ 
                          fontSize: 15,
                          marginBottom: 4 
                        }}>
                          Consumidor final
                        </div>
                        
                        {/* ✅ MOSTRAR MÉTODO DE PAGO CORRECTO O MIXTO */}
                        {metodosAccesorios.esMixto ? (
                          <div style={{
                            fontSize: 12,
                            color: "#ffd700",
                            fontWeight: 600,
                            marginBottom: 8,
                            lineHeight: 1.3,
                            textAlign: "center"
                          }}>
                            <div>💰 ${metodosAccesorios.totalEfectivo.toFixed(2)}</div>
                            <div>💳 ${metodosAccesorios.totalTarjetaTransf.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div style={{
                            fontSize: 13,
                            color: metodosAccesorios.tieneEfectivo ? "#4caf50" : "#b36aff",
                            fontWeight: 600,
                            marginBottom: 8
                          }}>
                            {metodosAccesorios.tieneEfectivo ? "💰 Efectivo" : "💳 Tarjeta/Transf"}
                          </div>
                        )}
                        
                        <div className="reporte-cuadro-botones">
                          <button
                            className="ver-btn"
                            onClick={() => {
                              const productos = accesorios.flatMap(v => v.detalles.map(d => ({
                                ...d,
                                metodo_pago: d.metodo_pago || v.metodo_pago,
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
                    
                    {Object.entries(motosPorCliente).map(([cliente, ventasCliente]) => {
                      const metodosCliente = calcularMetodosPago(ventasCliente);
                      
                      return (
                        <div className="reporte-cuadro" key={cliente}>
                          <div className="reporte-cuadro-fecha">{fecha}</div>
                          <div className="reporte-cuadro-total">
                            ${metodosCliente.totalGeneral.toFixed(2)}
                          </div>
                          
                          <div className="reporte-cuadro-cliente" style={{
                            fontSize: 15,
                            lineHeight: 1.3,
                            marginBottom: 4,
                            maxHeight: 36,
                            overflow: "hidden"
                          }}>
                            <b>
                              {ventasCliente[0].cliente_nombre} {ventasCliente[0].cliente_apellido}
                            </b>
                          </div>
                          
                          {/* ✅ MOSTRAR MÉTODO DE PAGO CORRECTO O MIXTO */}
                          {metodosCliente.esMixto ? (
                            <div style={{
                              fontSize: 12,
                              color: "#ffd700",
                              fontWeight: 600,
                              marginBottom: 8,
                              lineHeight: 1.3,
                              textAlign: "center"
                            }}>
                              <div>💰 ${metodosCliente.totalEfectivo.toFixed(2)}</div>
                              <div>💳 ${metodosCliente.totalTarjetaTransf.toFixed(2)}</div>
                            </div>
                          ) : (
                            <div style={{
                              fontSize: 13,
                              color: metodosCliente.tieneEfectivo ? "#4caf50" : "#b36aff",
                              fontWeight: 600,
                              marginBottom: 8
                            }}>
                              {metodosCliente.tieneEfectivo ? "💰 Efectivo" : "💳 Tarjeta/Transf"}
                            </div>
                          )}
                          
                          <div className="reporte-cuadro-botones">
                            <button
                              className="ver-btn"
                              onClick={() => {
                                const productos = ventasCliente.flatMap(v =>
                                  v.detalles.map(d => ({
                                    ...d,
                                    metodo_pago: d.metodo_pago || v.metodo_pago,
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
                      
                      // ✅ VERIFICAR SI HAY PRODUCTOS SIN PRECIO
                      const tieneSinPrecio = productos.some(p => !p.precio || p.precio === 0);

                      return (
                        <div className="reporte-cuadro" key={proveedor}>
                          <div className="reporte-cuadro-fecha">{fecha}</div>
                          
                          <div className="reporte-cuadro-total">
                            {tieneSinPrecio && totalProveedor === 0 ? (
                              <span style={{ fontSize: 12, color: "#888" }}>Sin precio</span>
                            ) : (
                              `$${totalProveedor.toFixed(2)}`
                            )}
                          </div>
                          
                          <div className="reporte-cuadro-cliente" style={{ 
                            color: "#a32020", 
                            fontWeight: 700,
                            fontSize: 15,
                            lineHeight: 1.3,
                            marginBottom: 6,
                            maxHeight: 36,
                            overflow: "hidden"
                          }}>
                            🔧 {proveedor}
                          </div>
                          
                          {comprobante && (
                            <div style={{ 
                              fontSize: 12,
                              color: "#888", 
                              textAlign: "center",
                              lineHeight: 1.2,
                              marginBottom: 10
                            }}>
                              <div style={{ fontWeight: 600, color: "#bbb" }}>
                                {comprobante.tipo}
                              </div>
                              {comprobante.numero && (
                                <div style={{ fontSize: 11, marginTop: 2 }}>
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
        
        {totalPaginas > 1 && (
          <PaginacionUnificada
            pagina={pagina}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina(p => Math.max(1, p - 1))}
            onSiguiente={() => setPagina(p => Math.min(totalPaginas, p + 1))}
          />
        )}
      </div>
      
      {detalleDia && (
        <div className="reporte-modal">
          <div className="reporte-modal-content"
            style={{
              maxWidth: 480,
              minWidth: 320,
              width: "100%",
            }}
          >
            <div style={{
              position: "relative",
              marginTop: 18,
              marginBottom: 24,
              minHeight: 40
            }}>
              {tipo === "ventas" && detalleDia.productos?.[0]?.cliente !== "Consumidor final" && (
                <button
                  style={{
                    position: "absolute",
                    right: -28,
                    top: -28,
                    background: "#232526",
                    color: "#a32020",
                    border: "1.5px solid #a32020",
                    borderRadius: "50%",
                    width: 40,
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
                    fontSize: 22,
                    color: "#a32020"
                  }}>▶</span>
                </button>
              )}
              
              <h2 style={{
                color: "#a32020",
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 1,
                width: "100%",
                textAlign: "center",
              }}>
                {tipo === "compras" ? "Detalle de Compra" : "Detalle Venta"}
              </h2>
              
              <div style={{
                position: "absolute",
                right: 0,
                top: 36,
                color: "#bdbdbd",
                fontWeight: 600,
                fontSize: 14,
                minWidth: 100,
                textAlign: "right"
              }}>
                {detalleDia.fecha 
                  ? new Date(detalleDia.fecha).toLocaleDateString("es-AR")
                  : ""}
              </div>
            </div>
            
            {tipo === "compras" && detalleDia?.detalles && (
              <>
                <div style={{
                  background: "#1a1a1a",
                  borderRadius: 8,
                  padding: "8px 16px",
                  marginBottom: 10,
                  color: "#ffd700",
                  border: "1px solid #353535",
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: "center"
                }}>
                  🔧 {detalleDia.proveedor}
                </div>
                
                {detalleDia.comprobante && (
                  <div style={{
                    background: "#1a1a1a",
                    borderRadius: 8,
                    padding: "10px 16px",
                    marginBottom: 16,
                    color: "#fff",
                    border: "1px solid #353535"
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#ffd700", marginBottom: 4 }}>
                      Comprobante
                    </div>
                    <div style={{ fontSize: 14 }}><b>Tipo:</b> {detalleDia.comprobante.tipo}</div>
                    {detalleDia.comprobante.numero && (
                      <div style={{ fontSize: 14 }}><b>Número:</b> {detalleDia.comprobante.numero}</div>
                    )}
                    {detalleDia.comprobante.fecha_emision && (
                      <div style={{ fontSize: 14 }}>
                        <b>Emisión:</b> {new Date(detalleDia.comprobante.fecha_emision).toLocaleDateString("es-AR")}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{
                  maxHeight: 340,
                  overflowY: "auto",
                  paddingRight: 8,
                  marginBottom: 10
                }}>
                  {detalleDia.detalles.map((d: any, i: number) => (
                    <div key={i} style={{ 
                      marginBottom: 14,
                      color: "#fff", 
                      paddingBottom: 10,
                      borderBottom: "1px solid #333",
                      fontSize: 14
                    }}>
                      <div><b>Producto:</b> {d.nombre}</div>
                      <div><b>Marca:</b> {d.marca || "Sin marca"}</div>
                      <div><b>Cantidad:</b> {d.cantidad}</div>
                      {d.precio && d.precio > 0 ? (
                        <>
                          <div><b>Precio unitario:</b> ${Number(d.precio).toFixed(2)}</div>
                          <div style={{ fontWeight: 700, color: "#ffd700" }}>
                            <b>Subtotal:</b> ${(Number(d.precio) * d.cantidad).toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: "#888", fontStyle: "italic" }}>Sin precio registrado</div>
                      )}
                      {d.observaciones && d.observaciones.trim() !== "" && (
                        <div style={{ marginTop: 3, fontStyle: "italic", color: "#bdbdbd", fontSize: 13 }}>
                          <b>Obs:</b> {d.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={{
                  marginTop: 14,
                  paddingTop: 10,
                  borderTop: "2px solid #a32020",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "#ffd700",
                  textAlign: "right"
                }}>
                  {detalleDia.detalles.reduce((acc: number, d: any) => acc + (Number(d.precio || 0) * d.cantidad), 0) > 0 ? (
                    <>Total: ${detalleDia.detalles.reduce((acc: number, d: any) => acc + (Number(d.precio || 0) * d.cantidad), 0).toFixed(2)}</>
                  ) : (
                    <span style={{ fontSize: 14, color: "#888" }}>Sin precio total</span>
                  )}
                </div>
              </>
            )}

            {tipo === "ventas" && detalleDia?.productos && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                <div style={{
                  maxHeight: 360,
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
                          marginBottom: 18,
                          color: esMorado ? "#b36aff" : "#fff",
                          background: esMorado ? "#232526" : "inherit",
                          paddingBottom: 10,
                          borderBottom: "1px solid #333",
                          fontSize: 14
                        }}
                      >
                        <div><b>Producto:</b> {d.nombre}</div>
                        {d.descripcion && <div><b>Descripción:</b> {d.descripcion}</div>}
                        {d.marca && <div><b>Marca:</b> {d.marca}</div>}
                        <div><b>Precio unitario:</b> ${Number(d.precio).toFixed(2)}</div>
                        <div><b>Cantidad:</b> {d.cantidad}</div>
                        <div><b>Método de pago:</b> {d.metodo_pago}</div>
                        <div style={{ fontWeight: 700, color: esMorado ? "#b36aff" : "#ffd700" }}>
                          <b>Subtotal:</b> ${totalProducto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          {esTarjeta && (
                            <span style={{ fontWeight: 400, fontSize: 13 }}> (incluye recargo)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ paddingTop: 10, borderTop: "2px solid #a32020" }}>
                  <div style={{ fontWeight: 700, color: "#4caf50", fontSize: 16, textAlign: "right", marginBottom: 4 }}>
                    💰 Efectivo: $
                    {detalleDia.productos
                      .filter((d: any) => d.metodo_pago === "efectivo")
                      .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0)
                      .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontWeight: 700, color: "#b36aff", fontSize: 16, textAlign: "right" }}>
                    💳 TJ/TF: $
                    {detalleDia.productos
                      .filter((d: any) => d.metodo_pago === "tarjeta" || d.metodo_pago === "transferencia")
                      .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0)
                      .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ BOTONES ALINEADOS CORRECTAMENTE */}
            <div style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 20
            }}>
              <button
                className="exportar-pdf-btn"
                style={{
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  minHeight: 44,
                  width: 160  // ← ANCHO FIJO
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
                  padding: "10px 24px",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  minHeight: 44,
                  width: 120  // ← ANCHO FIJO (más pequeño)
                }}
                onClick={() => setDetalleDia(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
          
          {mostrarCliente && detalleDia.productos?.[0]?.cliente !== "Consumidor final" && (
            <div style={{
              position: "fixed",
              top: "50%",
              left: "calc(50% + 300px)",
              transform: "translateY(-50%)",
              background: "#232526",
              borderRadius: 12,
              boxShadow: "0 2px 18px rgba(0,0,0,0.22)",
              padding: "22px 28px",
              minWidth: 280,
              zIndex: 9999,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{
                marginBottom: 8,
                fontWeight: 700,
                fontSize: 17,
                color: "#a32020",
                letterSpacing: 0.5,
              }}>
                Datos del Cliente
              </div>
              <div style={{ fontSize: 14 }}>
                <b>Nombre y Apellido:</b><br />
                {(detalleDia.productos[0].cliente_nombre || "") + " " + (detalleDia.productos[0].cliente_apellido || "")}
              </div>
              {detalleDia.productos[0].cliente_correo && (
                <div style={{ fontSize: 14 }}>
                  <b>Correo:</b><br />{detalleDia.productos[0].cliente_correo}
                </div>
              )}
              {detalleDia.productos[0].cliente_telefono && (
                <div style={{ fontSize: 14 }}>
                  <b>Teléfono:</b><br />{detalleDia.productos[0].cliente_telefono}
                </div>
              )}
              <button
                style={{
                  marginTop: 14,
                  background: "#a32020",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 20px",
                  fontWeight: 700,
                  fontSize: 14,
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

  doc.setFontSize(20);
  doc.setTextColor(163, 32, 32);
  doc.text("Detalle de Venta", 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Fecha: ${detalle.fecha ? new Date(detalle.fecha).toLocaleDateString("es-AR") : ""}`,
    105,
    y,
    { align: "center" }
  );

  y += 12;

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  detalle.productos.forEach((d: any) => {
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

  detalle.detalles.forEach((d: any) => {
    doc.text(`Producto: ${d.nombre}`, 20, y);
    y += 7;
    doc.text(`Marca: ${d.marca || "Sin marca"}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${d.cantidad}`, 20, y);
    y += 7;
    
    if (d.precio && d.precio > 0) {
      doc.text(`Precio unitario: $${Number(d.precio).toFixed(2)}`, 20, y);
      y += 7;
      const subtotal = Number(d.precio) * d.cantidad;
      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 20, y);
      totalGeneral += subtotal;
      y += 7;
    } else {
      doc.setTextColor(128, 128, 128);
      doc.text('Sin precio registrado', 20, y);
      doc.setTextColor(0, 0, 0);
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

  y += 4;
  doc.setDrawColor(163, 32, 32);
  doc.line(15, y, 195, y);

  y += 10;
  doc.setFontSize(15);
  doc.setTextColor(163, 32, 32);
  
  if (totalGeneral > 0) {
    doc.text(`Total compra: $${totalGeneral.toFixed(2)}`, 20, y);
  } else {
    doc.setTextColor(128, 128, 128);
    doc.text('Sin precio total', 20, y);
  }

  doc.save("detalle-compra.pdf");
}

export default Reportes;