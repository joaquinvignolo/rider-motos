import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import riderLogo from "../assets/rider-logo.png";
import "./Productos.css";

type Producto = {
  id: number;
  nombre: string;
  precio: string;
  cantidad: string;
  marca: string;
};

const Productos: React.FC = () => {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<"motos" | "accesorios" | "repuestos">("motos");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Un estado para cada lista
  const [productosMotos, setProductosMotos] = useState<Producto[]>([]);
  const [productosAccesorios, setProductosAccesorios] = useState<Producto[]>([]);
  const [productosRepuestos, setProductosRepuestos] = useState<Producto[]>([]);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [marca, setMarca] = useState("Primera marca");

  // Obtiene la lista y el setter según la sección
  const getProductos = () => {
    if (seccion === "motos") return [productosMotos, setProductosMotos] as const;
    if (seccion === "accesorios") return [productosAccesorios, setProductosAccesorios] as const;
    return [productosRepuestos, setProductosRepuestos] as const;
  };

  const [productos, setProductos] = getProductos();

  // Abrir modal para agregar o editar
  const handleAgregar = () => {
    setEditId(null);
    setNombre("");
    setPrecio("");
    setCantidad("");
    setMarca("Primera marca");
    setShowModal(true);
  };

  // Guardar producto (nuevo o editado)
  const handleGuardar = () => {
    if (!nombre.trim()) return;
    if (editId !== null) {
      setProductos(productos.map(p =>
        p.id === editId ? { ...p, nombre, precio, cantidad, marca } : p
      ));
    } else {
      setProductos([
        ...productos,
        {
          id: Date.now(),
          nombre,
          precio,
          cantidad,
          marca,
        },
      ]);
    }
    setShowModal(false);
  };

  // Eliminar producto
  const handleEliminar = (id: number) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  // Editar producto
  const handleEditar = (producto: Producto) => {
    setEditId(producto.id);
    setNombre(producto.nombre);
    setPrecio(producto.precio);
    setCantidad(producto.cantidad);
    setMarca(producto.marca);
    setShowModal(true);
  };

  // Renderiza el modal
  const renderModal = () => (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Agregar {seccion === "motos" ? "Moto" : seccion === "accesorios" ? "Accesorio" : "Repuesto"}</h2>
        <label>
          Nombre {seccion === "motos" ? "de la moto" : seccion === "accesorios" ? "del accesorio" : "del repuesto"}:
          <input value={nombre} onChange={e => setNombre(e.target.value)} />
        </label>
        <label>
          Precio:
          <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} />
        </label>
        <label>
          Cantidad:
          <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} />
        </label>
        <label>
          Marca:
          <select value={marca} onChange={e => setMarca(e.target.value)}>
            <option>Primera marca</option>
            <option>Segunda marca</option>
          </select>
        </label>
        <div className="modal-actions">
          <button className="motos-bar-btn agregar-btn" onClick={handleGuardar}>
            {editId !== null ? "Modificar" : "Agregar"}
          </button>
          <button className="motos-bar-btn" onClick={() => setShowModal(false)}>Cancelar</button>
        </div>
      </div>
    </div>
  );

  // Renderiza el contenido principal según la sección
  const renderMainContent = () => (
    <>
      <h1>
        {seccion === "motos"
          ? "Motos"
          : seccion === "accesorios"
          ? "Accesorios"
          : "Repuestos"}
      </h1>
      <div className="motos-bar">
        <button className="motos-bar-btn agregar-btn" onClick={handleAgregar}>Agregar</button>
        <div style={{ display: "flex", gap: "16px" }}>
          <button className="motos-bar-btn marcas-btn">Marcas</button>
          <button className="motos-bar-btn buscar-btn">Buscar</button>
        </div>
      </div>
      {/* Lista de productos */}
      <ul className="productos-lista">
        {productos.map(producto => (
          <li key={producto.id} className="producto-item">
            <span>{producto.nombre}</span>
            <div className="producto-actions">
              <button className="ver-btn motos-bar-btn" onClick={() => alert(JSON.stringify(producto, null, 2))}>Ver</button>
              <button className="modificar-btn motos-bar-btn" onClick={() => handleEditar(producto)}>Modificar</button>
              <button className="eliminar-btn motos-bar-btn" onClick={() => handleEliminar(producto.id)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
      {showModal && renderModal()}
    </>
  );

  return (
    <div className="productos-container">
      <aside className="productos-sidebar">
        <img src={riderLogo} alt="Rider Motos" className="logo-productos" />
        <button className="sidebar-btn" onClick={() => navigate("/menu")}>Inicio</button>
        {seccion !== "motos" && (
          <button className="sidebar-btn" onClick={() => setSeccion("motos")}>Motos</button>
        )}
        {seccion !== "accesorios" && (
          <button className="sidebar-btn" onClick={() => setSeccion("accesorios")}>Accesorios</button>
        )}
        {seccion !== "repuestos" && (
          <button className="sidebar-btn" onClick={() => setSeccion("repuestos")}>Repuestos</button>
        )}
      </aside>
      <main className="productos-main">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default Productos;