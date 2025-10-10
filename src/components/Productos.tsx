import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import riderLogo from "../assets/rider-logo.png";
import "./Productos.css";
import PaginacionUnificada from "./PaginacionUnificada";

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
  activo: number;
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
  const [productoAReactivar, setProductoAReactivar] = useState<Producto | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

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

  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  // Cargar productos, marcas y proveedores desde el backend
  useEffect(() => {
    let url = "http://localhost:3001/api/productos?tipo=" + (
      seccion === "motos" ? "moto" :
      seccion === "accesorios" ? "accesorio" :
      "repuesto"
    );
    if (mostrarInactivos) url += "&inactivos=1";
    fetch(url)
      .then(res => res.json())
      .then(data => setProductos(data));
  }, [seccion, mostrarInactivos]);

  // Cargar TODAS las marcas (sin filtrar)
  useEffect(() => {
    fetch("http://localhost:3001/api/marcas")
      .then(res => res.json())
      .then(data => setMarcas(data));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/proveedores")
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, []);

  // Abrir modal para agregar o editar
  const handleAgregar = () => {
    setEditId(null);
    setNombre("");
    setPrecio("");
    setCantidad("");
    setMarca("");
    setDescripcion("");
    setProveedor("");
    setMensajeValidacion(null);
    setShowModal(true);
  };

  // Guardar producto (nuevo o editado)
  const [mensajeValidacion, setMensajeValidacion] = useState<string | null>(null);

  const handleGuardar = async () => {
    setMensajeValidacion(null);
    if (!nombre.trim()) {
      setMensajeValidacion("El nombre es obligatorio.");
      return;
    }
    if (!precio.trim() || isNaN(Number(precio)) || Number(precio) <= 0) {
      setMensajeValidacion("El precio debe ser un número positivo.");
      return;
    }
    if (!marca.trim()) {
      setMensajeValidacion("La marca es obligatoria.");
      return;
    }
    if (!proveedor.trim()) {
      setMensajeValidacion("El proveedor es obligatorio.");
      return;
    }

    const nuevoProducto: Producto = {
      id: editId ?? 0,
      nombre,
      precio: String(precio),
      cantidad: editId !== null ? String(cantidad) : "0",
      marca,
      descripcion,
      tipo: seccion === "motos" ? "moto" : seccion === "accesorios" ? "accesorio" : "repuesto",
      proveedor,
      activo: 1
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
    setProductos(productos.map(p => p.id === id ? { ...p, activo: 0 } : p));
  };

  // Editar producto
  const handleEditar = (producto: Producto) => {
    setEditId(producto.id);
    setNombre(producto.nombre ?? "");
    setPrecio(String(producto.precio ?? ""));      
    setCantidad(String(producto.cantidad ?? ""));
    setMarca(producto.marca ?? "");
    setDescripcion(producto.descripcion ?? "");
    setProveedor(producto.proveedor ?? "");
    setMensajeValidacion(null);
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
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            maxLength={32}
          />
          <div style={{ fontSize: 12, color: '#888' }}>
            {nombre.length}/32 caracteres
          </div>
        </label>
        <label>
          Precio:
          <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} min={1} />
        </label>
        <label>
          Marca:
          <select value={marca || ""} onChange={e => setMarca(e.target.value)}>
            {editId === null && <option value="">Seleccionar marca</option>}
            {marcas.map(m => (
              <option key={m.id} value={m.nombre}>{m.nombre}</option>
            ))}
            {/* Mantener marca actual si no está en la lista (por si fue eliminada) */}
            {marca && !marcas.some(m => m.nombre === marca) && (
              <option value={marca}>{marca} (marca eliminada)</option>
            )}
          </select>
        </label>
        <label>
          Descripción:
          <input
            type="text"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            maxLength={32}
          />
          <div style={{ fontSize: 12, color: '#888' }}>
            {descripcion.length}/32 caracteres
          </div>
        </label>
        <label>
          Proveedor:
          <select value={proveedor || ""} onChange={e => setProveedor(e.target.value)}>
            {editId === null && <option value="">Seleccionar proveedor</option>}
            {proveedores.map(p => (
              <option key={p.id} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Stock actual:
          <span style={{ fontWeight: 600, color: "#ffd700", marginLeft: 8 }}>
            {editId !== null
              ? cantidad
              : "Se asigna desde Compras"}
          </span>
        </label>
        {mensajeValidacion && (
          <div className="mensaje-validacion">{mensajeValidacion}</div>
        )}
        <div className="modal-actions">
          <button
            className="motos-bar-btn agregar-btn"
            onClick={handleGuardar}
          >
            {editId !== null ? "Modificar" : "Agregar"}
          </button>
          <button className="motos-bar-btn" onClick={() => {
            setShowModal(false);
            setMensajeValidacion(null);
          }}>
            Cancelar
          </button>
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
        <div>
          <strong>Proveedor:</strong> {productoSeleccionado?.proveedor || 'Sin proveedor'}
        </div>
        <div>
          <strong>Precio:</strong> ${productoSeleccionado?.precio}
        </div>
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

  const productosFiltrados = productos.filter(producto => {
    const coincideMarca = !filtroMarca || producto.marca === filtroMarca || producto.marca == null;
    const coincideBusqueda =
      !busqueda ||
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideProveedor =
      !filtroProveedor || producto.proveedor === filtroProveedor;
    return coincideMarca && coincideBusqueda && coincideProveedor;
  });

  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroMarca, filtroProveedor, busqueda, seccion]);

  // Determina el mínimo de stock según tipo
  const getMinimoStock = (producto: Producto) => {
    if (producto.tipo === "moto") return 1;
    return 3; 
  };

  const esBajoStock = (producto: Producto) =>
    Number(producto.cantidad) > 0 && Number(producto.cantidad) <= getMinimoStock(producto);

  const recargarProductos = () => {
    let url = "http://localhost:3001/api/productos?tipo=" + (
      seccion === "motos" ? "moto" :
      seccion === "accesorios" ? "accesorio" :
      "repuesto"
    );
    if (mostrarInactivos) url += "&inactivos=1";
    fetch(url)
      .then(res => res.json())
      .then(data => setProductos(data));
  };

  const cambiarEstadoProducto = async (producto: Producto, nuevoEstado: number) => {
    await fetch(`http://localhost:3001/api/productos/${producto.id}/activo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: nuevoEstado })
    });
    recargarProductos();
  };

  useEffect(() => {
    setFiltroMarca(null);
  }, [seccion]);

  return (
    <div className="productos-container">
      <aside className="productos-sidebar">
        <img src={riderLogo} alt="Rider Motos" className="logo-productos" />
        <button
          className="sidebar-btn inicio-btn"
          style={{ fontSize: "1.5rem" }}
          onClick={() => navigate("/menu")}
        >
          INICIO
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
        <div className="motos-bar" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="motos-bar-btn agregar-btn"
            onClick={handleAgregar}
          >
            <span style={{display: "inline-flex", alignItems: "center", gap: 8}}>
              <svg width="20" height="20" viewBox="0 0 22 22" style={{marginRight: 2}}>
                <circle cx="11" cy="11" r="11" fill="#a32020"/>
                <rect x="10" y="5" width="2" height="12" rx="1" fill="white"/>
                <rect x="5" y="10" width="12" height="2" rx="1" fill="white"/>
              </svg>
              Agregar Producto
            </span>
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="motos-bar-btn activo-btn"
            style={{
              fontSize: "1.2rem",
              padding: "6px 12px",
              minWidth: 55,
              minHeight: 55,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
            onClick={() => {
              setMostrarInactivos(v => !v);
            }}
            title={mostrarInactivos ? "Ver activos" : "Ver inactivos"}
          >
            {mostrarInactivos ? (
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#a32020"/>
                <path d="M7 7l8 8M15 7l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#43a047"/>
                <path d="M6 12l4 4 6-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            )}
          </button>
          {/* Botón Proveedor */}
          <div style={{ position: "relative" }}>
            <button
              className="motos-bar-btn proveedor-btn"
              onClick={() => setMostrarFiltroProveedor(p => !p)}
            >
              Proveedor
            </button>
            {mostrarFiltroProveedor && (
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
                  minWidth: 160,
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
          {/* Botón Marcas (SIMPLIFICADO - siempre usa todas las marcas) */}
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
                {marcas.map(m => (
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
        <hr className="separador-productos" />
        {/* Lista de productos */}
        {!mostrarInactivos && productosFiltrados.some(esBajoStock) && (
          <div style={{
            background: "#fff3cd",
            color: "#010101ff",
            fontWeight: "bold",
            borderRadius: "8px",
            padding: "8px 18px",
            marginBottom: "18px",
            textAlign: "center"
          }}>
            ¡Atención! Hay productos con bajo stock.
          </div>
        )}
        <ul className="productos-lista">
          {productosPagina.map(producto => (
            <li
              key={producto.id}
              className={
                `producto-item` +
                (producto.activo === 0
                  ? " producto-inactivo"
                  : producto.cantidad === "0"
                    ? " producto-sin-stock"
                    : esBajoStock(producto)
                      ? " producto-bajo-stock"
                      : " producto-con-stock")
              }
            >
              <span>{producto.nombre}</span>
              <span className="producto-descripcion">{producto.descripcion}</span>
              <span className="producto-previsualizacion">
                {producto.marca.toUpperCase()} | STOCK: {producto.cantidad} | ${producto.precio}
                {Number(producto.cantidad) === 0 && (
                  <span className="alerta-bajo-stock" style={{ background: "#d85858ff", color: "#000000ff" }}>
                    &nbsp;¡Sin stock!
                  </span>
                )}
                {Number(producto.cantidad) > 0 && esBajoStock(producto) && (
                  <span className="alerta-bajo-stock">
                    &nbsp;¡Bajo stock!
                  </span>
                )}
              </span>
              <div className="producto-actions">
                <button className="ver-btn motos-bar-btn" onClick={() => handleVerDetalle(producto)} title="Ver">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
                </button>
                {producto.activo !== 0 ? (
                  <>
                    <button className="modificar-btn motos-bar-btn" onClick={() => handleEditar(producto)} title="Editar">
                      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button
                      className="eliminar-btn motos-bar-btn"
                      onClick={() => setProductoAEliminar(producto)}
                      title="Inactivar"
                    >
                      <svg width="18" height="18" viewBox="0 0 22 22">
                        <circle cx="11" cy="11" r="11" fill="#a32020"/>
                        <path d="M7 7l8 8M15 7l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    className="activar-btn motos-bar-btn"
                    style={{ background: "#43a047", color: "#fff" }}
                    onClick={() => setProductoAReactivar(producto)}
                    title="Reactivar"
                  >
                    <svg width="18" height="18" viewBox="0 0 22 22">
                      <circle cx="11" cy="11" r="11" fill="#80c481ff"/>
                      <path d="M6 12l4 4 6-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                  </button>
                )}
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
              </p>
              <div style={{display: "flex", justifyContent: "center", gap: 16}}>
                <button
                  className="eliminar-btn motos-bar-btn"
                  style={{minWidth: 110}}
                  onClick={async () => {
                    await handleEliminar(productoAEliminar.id);
                    setProductoAEliminar(null);
                    recargarProductos();
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
        {productoAReactivar && (
          <div className="modal-backdrop">
            <div className="modal mini-modal" style={{textAlign: "center"}}>
              <h2 style={{color: "#43a047", marginBottom: 18}}>¿Reactivar producto?</h2>
              <p style={{marginBottom: 24, color: "#fff"}}>
                Vas a reactivar <b>{productoAReactivar.nombre}</b>.<br />
              </p>
              <div style={{display: "flex", justifyContent: "center", gap: 16}}>
                <button
                  className="motos-bar-btn"
                  style={{background: "#43a047", minWidth: 110}}
                  onClick={async () => {
                    await fetch(`http://localhost:3001/api/productos/${productoAReactivar.id}/activo`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ activo: 1 })
                    });
                    setProductoAReactivar(null);
                    setMostrarInactivos(false);
                    setTimeout(recargarProductos, 0); 
                  }}
                >
                  Reactivar
                </button>
                <button
                  className="motos-bar-btn"
                  style={{background: "#353535", minWidth: 110}}
                  onClick={() => setProductoAReactivar(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {totalPaginas > 1 && (
          <PaginacionUnificada
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            onAnterior={() => setPaginaActual(paginaActual - 1)}
            onSiguiente={() => setPaginaActual(paginaActual + 1)}
          />
        )}
      </main>
    </div>
  );
};

export default Productos;