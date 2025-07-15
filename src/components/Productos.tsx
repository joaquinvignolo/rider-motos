import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import riderLogo from "../assets/rider-logo.png";
import "./Productos.css";

// Tipo de producto
type Producto = {
  id: number;
  nombre: string;
  precio: string;
  cantidad: string;
  marca: string;
  descripcion: string;
  proveedor?: string;
  tipo: "moto" | "accesorio" | "repuesto";
};

type Marca = {
  id: number;
  nombre: string;
};

type Proveedor = {
  id: number;
  nombre: string;
};

const Productos: React.FC = () => {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<"motos" | "accesorios" | "repuestos">("motos");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showVerModal, setShowVerModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

  // Listas desde la base de datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [marca, setMarca] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [proveedor, setProveedor] = useState("");

  const [filtroMarca, setFiltroMarca] = useState<string | null>(null);
  const [mostrarFiltroMarcas, setMostrarFiltroMarcas] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  const [filtroProveedor, setFiltroProveedor] = useState<string | null>(null);
  const [mostrarFiltroProveedor, setMostrarFiltroProveedor] = useState(false);

  // Cargar productos, marcas y proveedores desde el backend
  useEffect(() => {
    fetch("http://localhost:3001/api/productos?tipo=" + (
      seccion === "motos" ? "moto" :
      seccion === "accesorios" ? "accesorio" :
      "repuesto"
    ))
      .then(res => res.json())
      .then(data => setProductos(data));
  }, [seccion]);

  useEffect(() => {
    fetch("http://localhost:3001/api/marcas")
      .then(res => res.json())
      .then(data => setMarcas(data));
  }, []);

  useEffect(() => {
    if (seccion === "repuestos") {
      fetch("http://localhost:3001/api/proveedores")
        .then(res => res.json())
        .then(data => setProveedores(data));
    }
  }, [seccion]);

  // Abrir modal para agregar o editar
  const handleAgregar = () => {
    setEditId(null);
    setNombre("");
    setPrecio("");
    setCantidad("");
    setMarca("");
    setDescripcion("");
    setProveedor("");
    setShowModal(true);
  };

  // Guardar producto (nuevo o editado)
  const handleGuardar = async () => {
    if (!nombre.trim() || !marca.trim()) return;
    const nuevoProducto: Producto = {
      id: editId ?? 0,
      nombre,
      precio,
      cantidad,
      marca,
      descripcion,
      tipo: seccion === "motos" ? "moto" : seccion === "accesorios" ? "accesorio" : "repuesto",
      ...(seccion === "repuestos" ? { proveedor } : {})
    };

    if (editId !== null) {
      // Editar producto
      await fetch(`http://localhost:3001/api/productos/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto)
      });
      setProductos(productos.map(p => p.id === editId ? { ...nuevoProducto, id: editId } : p));
    } else {
      // Agregar producto
      const res = await fetch("http://localhost:3001/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto)
      });
      const data = await res.json();
      setProductos([...productos, { ...nuevoProducto, id: data.id }]);
    }
    setShowModal(false);
  };

  // Eliminar producto
  const handleEliminar = async (id: number) => {
    await fetch(`http://localhost:3001/api/productos/${id}`, { method: "DELETE" });
    setProductos(productos.filter(p => p.id !== id));
  };

  // Editar producto
  const handleEditar = (producto: Producto) => {
    setEditId(producto.id);
    setNombre(producto.nombre);
    setPrecio(producto.precio);
    setCantidad(producto.cantidad);
    setMarca(producto.marca);
    setDescripcion(producto.descripcion);
    setProveedor(producto.proveedor ?? "");
    setShowModal(true);
  };

  // Ver detalle del producto
  const handleVerDetalle = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setShowVerModal(true);
  };

  // Renderiza el modal de agregar/editar
  const renderModal = () => (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{editId !== null ? "Modificar" : "Agregar"} {seccion === "motos" ? "Moto" : seccion === "accesorios" ? "Accesorio" : "Repuesto"}</h2>
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
            <option value="">Seleccionar marca</option>
            {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </label>
        <label>
          Descripción:
          <input
            type="text"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            maxLength={120}
          />
        </label>
        {seccion === "repuestos" && (
          <label>
            Proveedor:
            <select value={proveedor} onChange={e => setProveedor(e.target.value)}>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
          </label>
        )}
        <div className="modal-actions">
          <button className="motos-bar-btn agregar-btn" onClick={handleGuardar}>
            {editId !== null ? "Modificar" : "Agregar"}
          </button>
          <button className="motos-bar-btn" onClick={() => setShowModal(false)}>Cancelar</button>
        </div>
      </div>
    </div>
  );

  // Renderiza el modal de ver detalle
  const renderVerModal = () => (
    <div className="modal-backdrop">
      <div className="modal mini-modal">
        <h2 style={{marginBottom: 12, color: "#a32020"}}>Detalle</h2>
        <div>
          <strong>Nombre:</strong> {productoSeleccionado?.nombre}
        </div>
        <div>
          <strong>Descripción:</strong> {productoSeleccionado?.descripcion}
        </div>
        <div>
          <strong>Marca:</strong> {productoSeleccionado?.marca}
        </div>
        <div>
          <strong>Cantidad:</strong> {productoSeleccionado?.cantidad}
        </div>
        {seccion === "repuestos" && (
          <div>
            <strong>Proveedor:</strong> {productoSeleccionado?.proveedor}
          </div>
        )}
        {seccion === "motos" && (
          <div>
            <strong>Precio:</strong> ${productoSeleccionado?.precio}
          </div>
        )}
        <button
          className="motos-bar-btn"
          style={{marginTop: 18, background: "#353535"}}
          onClick={() => setShowVerModal(false)}
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  // Filtrado de productos
  const productosFiltrados = productos.filter(producto => {
    const coincideMarca = !filtroMarca || producto.marca === filtroMarca || producto.marca == null;
    const coincideBusqueda =
      !busqueda ||
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideProveedor =
      seccion !== "repuestos" || !filtroProveedor || producto.proveedor === filtroProveedor;
    return coincideMarca && coincideBusqueda && coincideProveedor;
  });

  return (
    <div className="productos-container">
      <aside className="productos-sidebar">
        <img src={riderLogo} alt="Rider Motos" className="logo-productos" />
        <button
          className={`sidebar-btn${seccion === "todos" ? " activo" : ""}`}
          onClick={() => setSeccion("todos")}
        >
          TODOS
        </button>
        <button
          className={`sidebar-btn${seccion === "motos" ? " activo" : ""}`}
          onClick={() => setSeccion("motos")}
        >
          MOTOS
        </button>
        <button
          className={`sidebar-btn${seccion === "accesorios" ? " activo" : ""}`}
          onClick={() => setSeccion("accesorios")}
        >
          ACCESORIOS
        </button>
        <button
          className={`sidebar-btn${seccion === "repuestos" ? " activo" : ""}`}
          onClick={() => setSeccion("repuestos")}
        >
          REPUESTOS
        </button>
        <button className="sidebar-btn inicio-btn" onClick={() => navigate("/menu")}>
          INICIO
        </button>
      </aside>
      <div className="separador-vertical"></div>
      <main className="productos-main">
        <h1>
          {seccion === "motos"
            ? "Motos"
            : seccion === "accesorios"
            ? "Accesorios"
            : "Repuestos"}
        </h1>
        <div className="motos-bar">
          <button className="motos-bar-btn agregar-btn" onClick={handleAgregar}>AGREGAR</button>
          <div style={{ display: "flex", gap: "16px" }}>
            {/* Botón Proveedor (solo habilitado en repuestos) */}
            <div style={{ position: "relative" }}>
              <button
                className="motos-bar-btn proveedor-btn"
                disabled={seccion !== "repuestos"}
                style={{
                  opacity: seccion === "repuestos" ? 1 : 0.5,
                  cursor: seccion === "repuestos" ? "pointer" : "not-allowed"
                }}
                onClick={() => setMostrarFiltroProveedor(p => !p)}
              >
                Proveedor
              </button>
              {mostrarFiltroProveedor && seccion === "repuestos" && (
                <div
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    background: "#232526",
                    border: "1px solid #a32020",
                    borderRadius: 8,
                    zIndex: 10,
                    padding: 8,
                    minWidth: 120,
                  }}
                >
                  <button
                    style={{
                      background: filtroProveedor === null ? "#a32020" : "#353535",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      marginBottom: 4,
                      width: "100%",
                      cursor: "pointer",
                    }}
                    onClick={() => setFiltroProveedor(null)}
                  >
                    Todos
                  </button>
                  {proveedores.map(p => (
                    <button
                      key={p.id}
                      style={{
                        background: filtroProveedor === p.nombre ? "#a32020" : "#353535",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        marginBottom: 4,
                        width: "100%",
                        cursor: "pointer",
                      }}
                      onClick={() => setFiltroProveedor(p.nombre)}
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Marcas */}
            <div style={{ position: "relative" }}>
              <button
                className="motos-bar-btn marcas-btn"
                onClick={() => setMostrarFiltroMarcas(m => !m)}
              >
                Marcas
              </button>
              {mostrarFiltroMarcas && (
                <div
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    background: "#232526",
                    border: "1px solid #a32020",
                    borderRadius: 8,
                    zIndex: 10,
                    padding: 8,
                    minWidth: 120,
                  }}
                >
                  <button
                    style={{
                      background: filtroMarca === null ? "#a32020" : "#353535",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      marginBottom: 4,
                      width: "100%",
                      cursor: "pointer",
                    }}
                    onClick={() => setFiltroMarca(null)}
                  >
                    Todas
                  </button>
                  {seccion === "motos"
                    ? marcas.map(m => (
                        <button
                          key={m.id}
                          style={{
                            background: filtroMarca === m.nombre ? "#a32020" : "#353535",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            marginBottom: 4,
                            width: "100%",
                            cursor: "pointer",
                          }}
                          onClick={() => setFiltroMarca(m.nombre)}
                        >
                          {m.nombre}
                        </button>
                      ))
                    : ["Primera marca", "Segunda marca"].map(m => (
                        <button
                          key={m}
                          style={{
                            background: filtroMarca === m ? "#a32020" : "#353535",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            marginBottom: 4,
                            width: "100%",
                            cursor: "pointer",
                          }}
                          onClick={() => setFiltroMarca(m)}
                        >
                          {m}
                        </button>
                      ))}
                </div>
              )}
            </div>

            {/* Botón Buscar */}
            <button
              className="motos-bar-btn buscar-btn"
              onClick={() => setMostrarBusqueda(b => !b)}
            >
              Buscar
            </button>
            {mostrarBusqueda && (
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  marginLeft: 0,
                  marginTop: 12,
                  borderRadius: 6,
                  border: "1px solid #a32020",
                  padding: "6px 12px",
                  background: "#232526",
                  color: "#fff",
                  width: 180,
                  zIndex: 10,
                  display: "block"
                }}
                autoFocus
              />
            )}
          </div>
        </div>
        <hr className="separador-productos" />
        {/* Lista de productos */}
        <ul className="productos-lista">
          {productosFiltrados.map(producto => (
            <li
              key={producto.id}
              className={
                `producto-item` +
                (producto.cantidad === "0"
                  ? " producto-sin-stock"
                  : " producto-con-stock")
              }
            >
              <span>{producto.nombre.toUpperCase()}</span>
              <span className="producto-descripcion">{producto.descripcion.toUpperCase()}</span>
              <span className="producto-previsualizacion">
                {producto.marca.toUpperCase()} | STOCK: {producto.cantidad} | ${producto.precio}
              </span>
              <div className="producto-actions">
                <button className="ver-btn motos-bar-btn" onClick={() => handleVerDetalle(producto)}>
                  Ver
                </button>
                <button className="modificar-btn motos-bar-btn" onClick={() => handleEditar(producto)}>Modificar</button>
                <button
                  className="eliminar-btn motos-bar-btn"
                  onClick={() => setProductoAEliminar(producto)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
        {showModal && renderModal()}
        {showVerModal && productoSeleccionado && renderVerModal()}
        {productoAEliminar && (
          <div className="modal-backdrop">
            <div className="modal mini-modal" style={{textAlign: "center"}}>
              <h2 style={{color: "#a32020", marginBottom: 18}}>¿Estás seguro?</h2>
              <p style={{marginBottom: 24, color: "#fff"}}>
                Vas a eliminar <b>{productoAEliminar.nombre}</b>.<br />
                Esta acción no se puede deshacer.
              </p>
              <div style={{display: "flex", justifyContent: "center", gap: 16}}>
                <button
                  className="eliminar-btn motos-bar-btn"
                  style={{minWidth: 110}}
                  onClick={() => {
                    handleEliminar(productoAEliminar.id);
                    setProductoAEliminar(null);
                  }}
                >
                  Eliminar
                </button>
                <button
                  className="motos-bar-btn"
                  style={{background: "#353535", minWidth: 110}}
                  onClick={() => setProductoAEliminar(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Productos;