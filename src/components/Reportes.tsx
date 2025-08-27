import React, { useEffect, useState } from "react";
import "./Reportes.css";

type Venta = {
  id: number;
  fecha: string; // formato ISO
  cliente: string;
  productos: string;
  total: number;
  descripcion: string;
  detalles: {
    nombre: string;
    descripcion: string;
    marca: string;
    cantidad: number;
    precio: number;
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

const Reportes: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:3001/api/ventas")
      .then(res => res.json())
      .then(data => setVentas(Array.isArray(data) ? data : []));
  }, []);

  // Filtrado
  const ventasFiltradas = ventas.filter(v => {
    const fechaVenta = new Date(v.fecha);
    let ok = true;
    if (desde) {
      ok = ok && fechaVenta >= new Date(desde + "T00:00:00");
    }
    if (hasta) {
      ok = ok && fechaVenta <= new Date(hasta + "T23:59:59");
    }
    return ok;
  });

  // Agrupar por fecha
  const agrupadas = agruparPorFecha(ventasFiltradas);

  // Eliminar venta
  const eliminarVenta = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta venta?")) return;
    await fetch(`http://localhost:3001/api/ventas/${id}`, { method: "DELETE" });
    setVentas(ventas.filter(v => v.id !== id));
  };

  return (
    <div className="reportes-container">
      <div className="reportes-box">
        <h1 className="reportes-titulo">REPORTES</h1>
        <hr className="reportes-divisor" />
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: 18, gap: 12 }}>
          <label style={{ color: "#fff", fontWeight: 600 }}>
            Desde:{" "}
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              style={{ borderRadius: 8, border: "1.5px solid #a32020", background: "#232526", color: "#fff", padding: "6px 10px", fontWeight: 600 }}
            />
          </label>
          <label style={{ color: "#fff", fontWeight: 600 }}>
            Hasta:{" "}
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              style={{ borderRadius: 8, border: "1.5px solid #a32020", background: "#232526", color: "#fff", padding: "6px 10px", fontWeight: 600 }}
            />
          </label>
        </div>
        {Object.keys(agrupadas).length === 0 ? (
          <div className="reportes-vacio">
            <span role="img" aria-label="historial" style={{fontSize: 40, marginBottom: 12}}>📄</span>
            <div>No hay ventas registradas aún.</div>
          </div>
        ) : (
          Object.entries(agrupadas).map(([fecha, ventasDelDia]) => (
            <div key={fecha} style={{ width: "100%", marginBottom: 32 }}>
              <div className="mini-titulo-fecha">{fecha}</div>
              <div className="reportes-grid-cuadrada">
                {ventasDelDia.map(v => (
                  <div key={v.id} className="reporte-cuadro">
                    <div className="reporte-cuadro-fecha">{fecha}</div>
                    <div className="reporte-cuadro-total">${v.total}</div>
                    <div className="reporte-cuadro-cliente">{v.cliente}</div>
                    <div className="reporte-cuadro-botones">
                      <button className="ver-btn" onClick={() => setVentaSeleccionada(v)}>Ver</button>
                      <button className="eliminar-btn" onClick={() => eliminarVenta(v.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {ventaSeleccionada && (
        <div className="reporte-modal">
          <div className="reporte-modal-content">
            <h2 style={{ color: "#a32020", marginBottom: 18 }}>Detalle</h2>
            {ventaSeleccionada.detalles.map((d, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div><b>Nombre:</b> {d.nombre}</div>
                <div><b>Descripción:</b> {d.descripcion}</div>
                <div><b>Marca:</b> {d.marca}</div>
                <div><b>Cantidad:</b> {d.cantidad}</div>
                <div><b>Precio:</b> ${d.precio.toFixed(2)}</div>
              </div>
            ))}
            <div style={{ display: "flex", width: "100%", justifyContent: "flex-end", alignItems: "center" }}>
              <button
                className="imprimir-btn"
                style={{
                  background: "#353535",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: "0.98rem",
                  marginRight: 8,
                  cursor: "pointer"
                }}
                onClick={() => {/* sin función aún */}}
              >
                Imprimir
              </button>
              <button
                className="cerrar-modal-btn"
                onClick={() => setVentaSeleccionada(null)}
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

export default Reportes;