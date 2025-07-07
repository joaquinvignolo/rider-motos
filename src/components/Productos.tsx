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

  const [filtroMarca, setFiltroMarca] = useState<string | null>(null);
  const [mostrarFiltroMarcas, setMostrarFiltroMarcas] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

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
            {seccion === "motos" ? (
              <>
                <option>Keller</option>
                <option>Yamaha</option>
                <option>Honda</option>
                <option>Suzuki</option>
                <option>Bajaj</option>
                <option>Corven</option>
                <option>Gilera</option>
                <option>Motomel</option>
                <option>Voge</option>
                <option>Zanella</option>
                <option>Guerrero</option>
                <option>Siam</option>
                <option>Brava</option>
              </>
            ) : (
              <>
                <option>Primera marca</option>
                <option>Segunda marca</option>
              </>
            )}
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
                {seccion === "motos" &&
                  marcas.map(m => (
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
                {seccion !== "motos" && (
                  <>
                    <button
                      style={{
                        background: filtroMarca === "Primera marca" ? "#a32020" : "#353535",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        marginBottom: 4,
                        width: "100%",
                        cursor: "pointer",
                      }}
                      onClick={() => setFiltroMarca("Primera marca")}
                    >
                      Primera marca
                    </button>
                    <button
                      style={{
                        background: filtroMarca === "Segunda marca" ? "#a32020" : "#353535",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        marginBottom: 4,
                        width: "100%",
                        cursor: "pointer",
                      }}
                      onClick={() => setFiltroMarca("Segunda marca")}
                    >
                      Segunda marca
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
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
      </div>
      <hr className="separador-productos" />
      {/* Lista de productos */}
      <ul className="productos-lista">
        {productosFiltrados.map(producto => (
          <li
            key={producto.id}
            className={`producto-item${producto.cantidad === "0" ? " producto-sin-stock" : ""}`}
          >
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

  const marcas = [
    "Keller", "Yamaha", "Honda", "Suzuki", "Bajaj", "Corven", "Gilera",
    "Motomel", "Voge", "Zanella", "Guerrero", "Siam", "Brava"
  ];

  const productosFiltrados = productos.filter(producto => {
    const coincideMarca = !filtroMarca || producto.marca === filtroMarca;
    const coincideBusqueda =
      !busqueda ||
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideMarca && coincideBusqueda;
  });

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
          <button className="motos-bar-btn agregar-btn" onClick={handleAgregar}>Agregar</button>
          <div style={{ display: "flex", gap: "16px" }}>
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
                  {seccion === "motos" &&
                    marcas.map(m => (
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
                  {seccion !== "motos" && (
                    <>
                      <button
                        style={{
                          background: filtroMarca === "Primera marca" ? "#a32020" : "#353535",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          marginBottom: 4,
                          width: "100%",
                          cursor: "pointer",
                        }}
                        onClick={() => setFiltroMarca("Primera marca")}
                      >
                        Primera marca
                      </button>
                      <button
                        style={{
                          background: filtroMarca === "Segunda marca" ? "#a32020" : "#353535",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          marginBottom: 4,
                          width: "100%",
                          cursor: "pointer",
                        }}
                        onClick={() => setFiltroMarca("Segunda marca")}
                      >
                        Segunda marca
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ position: "relative" }}>
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
        </div>
        <hr className="separador-productos" />
        {/* Lista de productos */}
        <ul className="productos-lista">
          {productosFiltrados.map(producto => (
            <li
              key={producto.id}
              className={`producto-item${producto.cantidad === "0" ? " producto-sin-stock" : ""}`}
            >
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
      </main>
    </div>
  );
};

export default Productos;