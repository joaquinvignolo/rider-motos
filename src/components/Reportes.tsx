import React, { useEffect, useState } from "react";
import "./Reportes.css";
import jsPDF from "jspdf";

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

  // Cargar ventas y compras solo una vez
  useEffect(() => {
    fetch("http://localhost:3001/api/ventas")
      .then(res => res.json())
      .then(data => setVentas(Array.isArray(data) ? data : []));
    fetch("http://localhost:3001/api/compras")
      .then(res => res.json())
      .then(data => setCompras(Array.isArray(data) ? data : []));
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
        // ...tu lógica de búsqueda de ventas...
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
            placeholder="Buscar producto, cliente, etc..."
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
<<<<<<< HEAD
            {ventas.length === 0
              ? "No hay ventas registradas aún."
              : "No se encontraron ventas para la búsqueda ingresada."}
=======
            <div>
              No hay {tipo === "ventas" ? "ventas" : "compras"} registradas aún.
            </div>
>>>>>>> 172af87c56dea2f3bfa8dfc2fcf91d5565a76e89
          </div>
        ) : (
          fechasPagina.map(fecha => {
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

            const totalAccesorios = totalAccesoriosEfectivo > 0
              ? totalAccesoriosEfectivo
              : totalAccesoriosTarjTransf;

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
                            setDetalleDia({ fecha, productos, cliente: "Consumidor final" });
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

                            setDetalleDia({ fecha, productos, cliente });
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
          })
        )}
        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 18, gap: 10 }}>
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#a32020", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Anterior
            </button>
            <span style={{ color: "#fff" }}>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#a32020", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
      {detalleDia && tipo === "compras" && (
        <div className="reporte-modal">
          <div className="reporte-modal-content">
            {/* Título y fecha */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              marginTop: 28, 
              marginBottom: 18,
              width: "100%"
            }}>
              <h2 style={{
                color: "#a32020",
                margin: 0,
                flex: "none",
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 1
              }}>
                Detalle
              </h2>
              <div style={{
                color: "#bdbdbd",
                fontWeight: 600,
                fontSize: 16,
                position: "absolute",
                right: 32,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: 110,
                textAlign: "right"
              }}>
                {detalleDia.fecha}
              </div>
            </div>
            {/* Detalle de productos */}
            <div style={{ marginTop: 20 }}>
              {Array.isArray(detalleDia?.detalles) && detalleDia.detalles.map((d: any, i: number) => (
                <div key={i} style={{ marginBottom: 12, color: "#fff" }}>
                  <div><b>Nombre:</b> {d.nombre}</div>
                  <div><b>Cantidad:</b> {d.cantidad}</div>
                  {d.observaciones && <div><b>Observación:</b> {d.observaciones}</div>}
                </div>
              ))}
            </div>
            {/* Total debajo de los productos */}
            <div style={{
              marginTop: 18,
              marginBottom: 8,
              color: "#bdbdbd",
              fontWeight: 600,
              fontSize: 16
            }}>
              Total: ${Array.isArray(detalleDia?.detalles)
                ? detalleDia.detalles.reduce((acc: number, d: any) => acc + (d.cantidad * (d.precio ?? 0)), 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })
                : "0,00"}
            </div>
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
                onClick={() => exportarDetalleCompraAPDF(detalleDia)}
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
  doc.text("Detalle", 105, y, { align: "center" });

  // Fecha
  y += 10;
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fecha: ${detalle.fecha}`, 105, y, { align: "center" });

  y += 12;

  // Productos
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  detalle.productos.forEach((d: any, i: number) => {
    doc.text(`Nombre: ${d.nombre}`, 20, y);
    y += 7;
    doc.text(`Descripción: ${d.descripcion}`, 20, y);
    y += 7;
    doc.text(`Precio: $${Number(d.precio).toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${d.cantidad}`, 20, y);
    y += 7;
    doc.text(`Precio unitario: $${Number(d.precio).toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Subtotal: $${(Number(d.precio) * Number(d.cantidad)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, 20, y);
    y += 10;
    if (y > 230) { 
      doc.addPage();
      y = 18;
    }
  });

  // Calcula el total con la misma lógica que el modal
  const totalEfectivo = detalle.productos
    .filter((d: any) => d.metodo_pago !== "tarjeta de crédito" && d.metodo_pago !== "transferencia")
    .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0);
  const totalTarjTransf = detalle.productos
    .filter((d: any) => d.metodo_pago === "tarjeta de crédito" || d.metodo_pago === "transferencia")
    .reduce((acc: number, d: any) => acc + Number(d.precio) * Number(d.cantidad), 0);
  const total = totalEfectivo > 0 ? totalEfectivo : totalTarjTransf;

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

  // Columna derecha: Datos del cliente (si no es consumidor final)
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
    doc.text(datos.trim(), 120, y);
  }

  doc.save("detalle.pdf");
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
  doc.text(
    `Total: $${detalle.detalles.reduce((acc: number, d: any) => acc + (d.cantidad * (d.precio ?? 0)), 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
    20,
    y
  );

  doc.save("detalle-compra.pdf");
}

export default Reportes;