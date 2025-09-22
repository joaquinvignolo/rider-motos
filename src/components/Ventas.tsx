import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Ventas.css";

type ProductoVenta = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  marca: string;
  tipo: "moto" | "accesorio" | "repuesto";
};

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  activo: number;
};

const Ventas: React.FC = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"moto" | "accesorio" | "repuesto">("moto");
  const [productosEnVenta, setProductosEnVenta] = useState<ProductoVenta[]>([]);
  const [cliente, setCliente] = useState<Cliente>({ id: 0, nombre: "", apellido: "", telefono: "", correo: "", activo: 1 });
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mensajeError, setMensajeError] = useState<string>("");
  const [mensajeExito, setMensajeExito] = useState<string>("");

  // Cargar productos según tipo seleccionado y término de búsqueda
  useEffect(() => {
    let url = `http://localhost:3001/api/productos?tipo=${tipoSeleccionado}`;
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const term = searchTerm.toLowerCase();
        setProductos(
          data.filter(
            p =>
              p.nombre.toLowerCase().includes(term) ||
              p.marca.toLowerCase().includes(term) ||
              (p.proveedor && p.proveedor.toLowerCase().includes(term))
          )
        );
      });
  }, [tipoSeleccionado, searchTerm]);

  // Cargar clientes
  useEffect(() => {
    fetch("http://localhost:3001/api/clientes")
      .then(res => res.json())
      .then(data => setClientes(data));
  }, []);

  // Buscar clientes en tiempo real por nombre
  useEffect(() => {
    if (busquedaCliente.length > 1) {
      fetch(`http://localhost:3001/api/clientes?search=${encodeURIComponent(busquedaCliente)}`)
        .then(res => res.json())
        .then(data => setClientesSugeridos(data));
    } else {
      setClientesSugeridos([]);
    }
  }, [busquedaCliente]);

  // Agregar producto a la venta
  const agregarProductoAVenta = (producto: ProductoVenta) => {
    const enVenta = productosEnVenta.find(p => p.id === producto.id);
    const cantidadEnVenta = enVenta ? enVenta.cantidad : 0;
    if (cantidadEnVenta + 1 > producto.cantidad) {
      setMensajeError(`No hay suficiente stock disponible para "${producto.nombre}".`);
      return;
    }
    setMensajeError(""); 
    if (producto.tipo === "moto") {
      const otros = productosEnVenta.filter(p => p.tipo !== "moto");
      setProductosEnVenta([ ...otros, { ...producto, cantidad: 1 } ]);
    } else {
      // Para accesorios/repuestos, permite varios y suma cantidad si ya está
      const existe = productosEnVenta.find(p => p.id === producto.id);
      if (existe) {
        setProductosEnVenta(productosEnVenta.map(p =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        ));
      } else {
        setProductosEnVenta([ ...productosEnVenta, { ...producto, cantidad: 1 } ]);
      }
    }
  };

  // Cambiar cantidad de producto en venta
  const cambiarCantidad = (id: number, cantidad: number) => {
    const producto = productos.find(p => p.id === id);
    if (producto && cantidad > producto.cantidad) {
      setMensajeError(`No hay suficiente stock disponible para "${producto.nombre}".`);
      return;
    }
    setMensajeError("");
    setProductosEnVenta(productosEnVenta.map(p =>
      p.id === id ? { ...p, cantidad: cantidad } : p
    ));
  };

  // Eliminar producto de la venta
  const eliminarProductoDeVenta = (id: number) => {
    setProductosEnVenta(productosEnVenta.filter(p => p.id !== id));
  };

  // Calcular totales
  const totalSinExtra = productosEnVenta.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);
  const totalFinal = metodoPago === "tarjeta"
    ? totalSinExtra * (1 + porcentajeTarjeta / 100)
    : totalSinExtra;

  // Registrar venta
  const registrarVenta = async () => {
    if (productosEnVenta.length === 0) {
      setMensajeError("Agregue al menos un producto.");
      return;
    }

    const incluyeMoto = productosEnVenta.some(p => p.tipo === "moto");

    if (incluyeMoto) {
      if (!clienteSeleccionado) {
        setMensajeError("Debe seleccionar un cliente para ventas de motos.");
        return;
      }
      if (!clienteSeleccionado.nombre.trim() || clienteSeleccionado.nombre.trim().length < 2) {
        setMensajeError("Ingrese un nombre válido.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clienteSeleccionado.correo)) {
        setMensajeError("Ingrese un correo válido.");
        return;
      }
      const telRegex = /^[0-9]{8,}$/;
      if (!telRegex.test(clienteSeleccionado.telefono)) {
        setMensajeError("Ingrese un teléfono válido (solo números, mínimo 8 dígitos).");
        return;
      }
    }

    if (incluyeMoto && !clienteSeleccionado) {
      setMensajeError("Debe seleccionar un cliente para ventas de motos.");
      return;
    }
    const cliente_id = incluyeMoto && clienteSeleccionado ? clienteSeleccionado.id : null;

    const payload = {
      cliente_id,
      total: totalFinal,
      tipo_venta: incluyeMoto ? "moto" : "accesorio/repuesto",
      metodo_pago: metodoPago,
      productos: productosEnVenta.map(p => ({
        id: p.id,
        cantidad: p.cantidad,
        precio: p.precio
      }))
    };

    try {
      const res = await fetch("http://localhost:3001/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMensajeExito(data.mailEnviado
          ? "¡Venta registrada y comprobante enviado al cliente!"
          : "¡Venta registrada! No se pudo enviar el comprobante por email.");
        setProductosEnVenta([]);
        setClienteSeleccionado(null);
        setMetodoPago("efectivo");
        setPorcentajeTarjeta(0);
        setBusquedaCliente("");
        setClientesSugeridos([]);

        // Recargar productos para actualizar el stock visual
        let url = `http://localhost:3001/api/productos?tipo=${tipoSeleccionado}`;
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        fetch(url)
          .then(res => res.json())
          .then(data => {
            const term = searchTerm.toLowerCase();
            setProductos(
              data.filter(
                p =>
                  p.nombre.toLowerCase().includes(term) ||
                  p.marca.toLowerCase().includes(term) ||
                  (p.proveedor && p.proveedor.toLowerCase().includes(term))
              )
            );
          });
      } else {
        setMensajeError(data.error || "Error al registrar la venta.");
      }
    } catch (err) {
      setMensajeError("Error de conexión al registrar la venta.");
    }
  };

  const incluyeMoto = productosEnVenta.some(p => p.tipo === "moto");

  useEffect(() => {
    if (mensajeExito) {
      const timer = setTimeout(() => setMensajeExito(""), 2500);
      return () => clearTimeout(timer);
    }
  }, [mensajeExito]);

  useEffect(() => {
    if (mensajeError) {
      const timer = setTimeout(() => setMensajeError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensajeError]);

  return (
    <div className="ventas-container">
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
      <h1>REGISTRAR VENTA</h1>
      <form className="venta-form" onSubmit={e => { e.preventDefault(); registrarVenta(); }}>
        
        {}
        <section className="productos-venta">
          <h2>PRODUCTOS</h2>
          <div className="tipo-selector">
            <button
              type="button"
              className={tipoSeleccionado === "moto" ? "tipo-btn activo" : "tipo-btn"}
              onClick={() => {
                setTipoSeleccionado("moto");
                setSearchTerm("");
              }}
            >
              MOTO
            </button>
            <button
              type="button"
              className={tipoSeleccionado === "accesorio" ? "tipo-btn activo" : "tipo-btn"}
              onClick={() => {
                setTipoSeleccionado("accesorio");
                setSearchTerm("");
              }}
            >
              ACCESORIO
            </button>
            <button
              type="button"
              className={tipoSeleccionado === "repuesto" ? "tipo-btn activo" : "tipo-btn"}
              onClick={() => {
                setTipoSeleccionado("repuesto");
                setSearchTerm("");
              }}
            >
              REPUESTO
            </button>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="buscador-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="productos-lista-venta">
            {productos.map(prod => (
              <li key={prod.id} className="producto-venta-item">
                <span>{prod.nombre.toUpperCase()}</span>
                <span className="producto-venta-preview">
                  MARCA: {prod.marca.toUpperCase()} | STOCK: {prod.cantidad} | PRECIO: ${prod.precio}
                </span>
                <button type="button" className="agregar-btn" onClick={() => agregarProductoAVenta(prod)}>
                  AGREGAR
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Resumen de la venta */}
        <section className="resumen-venta">
          <h2>RESUMEN</h2>
          <ul>
            {productosEnVenta.map(item => (
              <li key={item.id} className="resumen-item">
                <span>{item.nombre.toUpperCase()}</span>
                <span> x {item.cantidad} = ${item.precio * item.cantidad}</span>
                {tipoSeleccionado !== "moto" && (
                  <input
                    type="number"
                    min={1}
                    value={item.cantidad === 0 ? "" : item.cantidad}
                    onChange={e => {
                      const val = e.target.value;
                      cambiarCantidad(item.id, val === "" ? 0 : Number(val));
                    }}
                    style={{ width: 60, marginLeft: 8 }}
                  />
                )}
                <button type="button" className="eliminar-btn" onClick={() => eliminarProductoDeVenta(item.id)}>
                  ELIMINAR
                </button>
              </li>
            ))}
          </ul>
          <div className="total-venta">
            TOTAL: ${totalFinal.toFixed(2)}
          </div>
          <label>
            MÉTODO DE PAGO:
            <select value={metodoPago} onChange={e => setMetodoPago(e.target.value as any)}>
              <option value="efectivo">EFECTIVO</option>
              <option value="tarjeta">TARJETA DE CRÉDITO</option>
              <option value="transferencia">TRANSFERENCIA</option>
            </select>
          </label>
          {metodoPago === "tarjeta" && (
            <label>
              % EXTRA POR TARJETA:
              <input
                type="number"
                min={0}
                max={30}
                value={porcentajeTarjeta === 0 ? "" : porcentajeTarjeta}
                onChange={e => {
                  const val = e.target.value;
                  setPorcentajeTarjeta(val === "" ? 0 : Number(val));
                }}
                style={{ width: 60, marginLeft: 8 }}
              />
            </label>
          )}
        </section>

        <div style={{
          marginBottom: 24,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}>
          {!incluyeMoto ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: "#181818",
              borderRadius: 10,
              padding: "14px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#ffd700"
            }}>
              Cliente: <span style={{ color: "#fff" }}>Consumidor Final</span>
              <button
                type="button"
                title="Agregar cliente"
                onClick={() => navigate("/clientes?agregar=1")}
                style={{
                  background: "#2196f3",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: "#181818",
                borderRadius: 10,
                padding: "14px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                fontWeight: 700,
                fontSize: "1.1rem",
                position: "relative",
                width: 420
              }}
            >
              <input
                type="text"
                className="buscador-input"
                placeholder="Buscar cliente por nombre..."
                value={busquedaCliente}
                onChange={e => {
                  setBusquedaCliente(e.target.value);
                  setClienteSeleccionado(null);
                }}
                style={{ width: 260, zIndex: 11 }}
                autoComplete="off"
              />
              <button
                type="button"
                title="Agregar cliente"
                onClick={() => navigate("/clientes?agregar=1")}
                style={{
                  background: "#2196f3",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {}
              {busquedaCliente.length > 1 && clientesSugeridos.length > 0 && (
                <div
                  className="sugerencias-clientes"
                  style={{
                    position: "absolute",
                    top: 48,
                    left: 0,
                    width: 260,
                    background: "#232526",
                    borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(25,118,210,0.18)",
                    zIndex: 20,
                    marginTop: 2,
                    padding: "4px 0",
                    maxHeight: 320,
                    overflowY: "auto"
                  }}
                >
                  {clientesSugeridos.slice(0, 8).map(c => (
                    <div
                      key={c.id}
                      className="sugerencia-cliente"
                      onClick={() => {
                        setClienteSeleccionado(c);
                        setBusquedaCliente(`${c.nombre} ${c.apellido}`);
                        setClientesSugeridos([]);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        background: "#232526",
                        color: "#fff",
                        padding: "10px 18px",
                        cursor: "pointer",
                        borderBottom: "1px solid #353535",
                        fontSize: "1.08rem",
                        transition: "background 0.15s"
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = "#353535")}
                      onMouseOut={e => (e.currentTarget.style.background = "#232526")}
                    >
                      <span style={{ fontWeight: 700, color: "#80c481" }}>
                        {c.nombre} {c.apellido}
                      </span>
                      <span style={{ fontSize: "0.98rem", color: "#ffd700" }}>
                        {c.telefono} &nbsp;|&nbsp; {c.correo}
                      </span>
                    </div>
                  ))}
                  {clientesSugeridos.length > 8 && (
                    <div style={{
                      textAlign: "center",
                      color: "#bbb",
                      fontSize: "0.95rem",
                      padding: "6px 0"
                    }}>
                      Mostrando los primeros 8 resultados...
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {incluyeMoto && clienteSeleccionado && (
          <div style={{ marginTop: 8, color: "#fff" }}>
            <div><b>Correo:</b> {clienteSeleccionado.correo}</div>
            <div><b>Teléfono:</b> {clienteSeleccionado.telefono}</div>
          </div>
        )}
        {mensajeError && (
          <div className="alert alert-error">{mensajeError}</div>
        )}
        {mensajeExito && (
          <div className="alert alert-success">{mensajeExito}</div>
        )}

        <button className="confirmar-venta-btn" type="submit" disabled={!!mensajeExito}>
          CONFIRMAR VENTA
        </button>
      </form>
    </div>
  );
};

export default Ventas;