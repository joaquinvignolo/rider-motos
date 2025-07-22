import React, { useState, useEffect } from "react";
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
  nombre: string;
  correo: string;
  telefono: string;
};

const Ventas: React.FC = () => {
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"moto" | "accesorio" | "repuesto">("moto");
  const [productosEnVenta, setProductosEnVenta] = useState<ProductoVenta[]>([]);
  const [cliente, setCliente] = useState<Cliente>({ nombre: "", correo: "", telefono: "" });
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState<number>(0);

  // Cargar productos según tipo seleccionado
  useEffect(() => {
    fetch("http://localhost:3001/api/productos?tipo=" + tipoSeleccionado)
      .then(res => res.json())
      .then(data => setProductos(data));
  }, [tipoSeleccionado]);

  // Agregar producto a la venta
  const agregarProductoAVenta = (producto: ProductoVenta) => {
    // Para motos, solo permite una
    if (tipoSeleccionado === "moto") {
      setProductosEnVenta([ { ...producto, cantidad: 1 } ]);
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

  // Registrar venta (simulado)
  const registrarVenta = () => {
    // Validaciones básicas
    if (!cliente.nombre.trim()) return alert("Ingrese el nombre del cliente.");
    if (tipoSeleccionado === "moto" && (!cliente.correo.trim() || !cliente.telefono.trim()))
      return alert("Correo y teléfono son obligatorios para venta de motos.");
    if (productosEnVenta.length === 0) return alert("Agregue al menos un producto.");

    // Aquí iría el fetch al backend para registrar la venta
    alert("Venta registrada correctamente.");
    // Limpiar formulario
    setProductosEnVenta([]);
    setCliente({ nombre: "", correo: "", telefono: "" });
    setMetodoPago("efectivo");
    setPorcentajeTarjeta(0);
  };

  return (
    <div className="ventas-container">
      <h1>REGISTRAR VENTA</h1>
      <form className="venta-form" onSubmit={e => { e.preventDefault(); registrarVenta(); }}>
        {/* Datos del cliente */}
        <section className="datos-cliente">
          <label>
            NOMBRE DEL CLIENTE:
            <input
              type="text"
              value={cliente.nombre}
              onChange={e => setCliente({ ...cliente, nombre: e.target.value })}
              required
            />
          </label>
          <label>
            CORREO:
            <input
              type="email"
              value={cliente.correo}
              onChange={e => setCliente({ ...cliente, correo: e.target.value })}
              required={tipoSeleccionado === "moto"}
            />
          </label>
          <label>
            TELÉFONO:
            <input
              type="text"
              value={cliente.telefono}
              onChange={e => setCliente({ ...cliente, telefono: e.target.value })}
              required={tipoSeleccionado === "moto"}
            />
          </label>
          <label>
            FECHA:
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </label>
        </section>

        {/* Selección de productos */}
        <section className="productos-venta">
          <h2>PRODUCTOS</h2>
          <div className="tipo-selector">
            <button
              type="button"
              className={tipoSeleccionado === "moto" ? "tipo-btn activo" : "tipo-btn"}
              onClick={() => setTipoSeleccionado("moto")}
            >
              MOTO
            </button>
            <button
              type="button"
              className={tipoSeleccionado === "accesorio" ? "tipo-btn activo" : "tipo-btn"}
              onClick={() => setTipoSeleccionado("accesorio")}
            >
              ACCESORIO
            </button>
            <button
              type="button"
              className={tipoSeleccionado === "repuesto" ? "tipo-btn activo" : "tipo-btn"}
              onClick={() => setTipoSeleccionado("repuesto")}
            >
              REPUESTO
            </button>
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
                    value={item.cantidad}
                    onChange={e => cambiarCantidad(item.id, Number(e.target.value))}
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
                value={porcentajeTarjeta}
                onChange={e => setPorcentajeTarjeta(Number(e.target.value))}
                style={{ width: 60, marginLeft: 8 }}
              />
            </label>
          )}
        </section>

        <button className="confirmar-venta-btn" type="submit">
          CONFIRMAR VENTA
        </button>
      </form>
    </div>
  );
};

export default Ventas;