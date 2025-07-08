import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import riderLogo from "../assets/rider-logo.png";
import "./Productos.css";

// Agrega proveedor al tipo Producto
type Producto = {
  id: number;
  nombre: string;
  precio: string;
  cantidad: string;
  marca: string;
  descripcion: string;
  proveedor?: string; // Nuevo campo
};

const Productos: React.FC = () => {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<"motos" | "accesorios" | "repuestos">("motos");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showVerModal, setShowVerModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

  // Un estado para cada lista
  const [productosMotos, setProductosMotos] = useState<Producto[]>([]);
  const [productosAccesorios, setProductosAccesorios] = useState<Producto[]>([]);
  const [productosRepuestos, setProductosRepuestos] = useState<Producto[]>([]);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [marca, setMarca] = useState("Primera marca");
  const [descripcion, setDescripcion] = useState("");
  const [proveedor, setProveedor] = useState("OKN");

  const [filtroMarca, setFiltroMarca] = useState<string | null>(null);
  const [mostrarFiltroMarcas, setMostrarFiltroMarcas] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  const [filtroProveedor, setFiltroProveedor] = useState<string | null>(null);
  const [mostrarFiltroProveedor, setMostrarFiltroProveedor] = useState(false);

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
    setDescripcion("");
    setProveedor("OKN");
    setShowModal(true);
  };

  // Guardar producto (nuevo o editado)
  const handleGuardar = () => {
    if (!nombre.trim()) return;
    if (editId !== null) {
      setProductos(productos.map(p =>
        p.id === editId
          ? {
              ...p,
              nombre,
              precio,
              cantidad,
              marca,
              descripcion,
              ...(seccion === "repuestos" ? { proveedor } : {}) // <-- agrega proveedor solo en repuestos
            }
          : p
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
          descripcion,
          ...(seccion === "repuestos" ? { proveedor } : {}) // <-- agrega proveedor solo en repuestos
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
    setDescripcion(producto.descripcion);
    setProveedor(producto.proveedor);
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
              <option>OKN</option>
              <option>Tablada</option>
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
          <strong>Nombre:</strong> {productoSeleccionado.nombre}
        </div>
        <div>
          <strong>Descripción:</strong> {productoSeleccionado.descripcion}
        </div>
        <div>
          <strong>Marca:</strong> {productoSeleccionado.marca}
        </div>
        <div>
          <strong>Cantidad:</strong> {productoSeleccionado.cantidad}
        </div>
        {seccion === "repuestos" && (
          <div>
            <strong>Proveedor:</strong> {productoSeleccionado.proveedor}
          </div>
        )}
        {seccion === "motos" && (
          <div>
            <strong>Precio:</strong> ${productoSeleccionado.precio}
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
                <button
                  style={{
                    background: filtroProveedor === "OKN" ? "#a32020" : "#353535",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    marginBottom: 4,
                    width: "100%",
                    cursor: "pointer",
                  }}
                  onClick={() => setFiltroProveedor("OKN")}
                >
                  OKN
                </button>
                <button
                  style={{
                    background: filtroProveedor === "Tablada" ? "#a32020" : "#353535",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    marginBottom: 4,
                    width: "100%",
                    cursor: "pointer",
                  }}
                  onClick={() => setFiltroProveedor("Tablada")}
                >
                  Tablada
                </button>
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
                {/* Reemplaza esto por tus marcas reales */}
                {marcas.map(marca => (
                  <button
                    key={marca}
                    style={{
                      background: filtroMarca === marca ? "#a32020" : "#353535",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      marginBottom: 4,
                      width: "100%",
                      cursor: "pointer",
                    }}
                    onClick={() => setFiltroMarca(marca)}
                  >
                    {marca}
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
            <span>{producto.nombre}</span>
            <span className="producto-descripcion">{producto.descripcion}</span>
            <div className="producto-actions">
              <button className="ver-btn motos-bar-btn" onClick={() => {
                setProductoSeleccionado(producto);
                setShowVerModal(true);
              }}>
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
    </>
  );

  const marcas =
    seccion === "repuestos"
      ? ["Primera marca", "Segunda marca"]
      : [
          "Keller", "Yamaha", "Honda", "Suzuki", "Bajaj", "Corven", "Gilera",
          "Motomel", "Voge", "Zanella", "Guerrero", "Siam", "Brava"
        ];

  const productosFiltrados = productos.filter(producto => {
    const coincideMarca = !filtroMarca || producto.marca === filtroMarca;
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
                  <button
                    style={{
                      background: filtroProveedor === "OKN" ? "#a32020" : "#353535",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      marginBottom: 4,
                      width: "100%",
                      cursor: "pointer",
                    }}
                    onClick={() => setFiltroProveedor("OKN")}
                  >
                    OKN
                  </button>
                  <button
                    style={{
                      background: filtroProveedor === "Tablada" ? "#a32020" : "#353535",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      marginBottom: 4,
                      width: "100%",
                      cursor: "pointer",
                    }}
                    onClick={() => setFiltroProveedor("Tablada")}
                  >
                    Tablada
                  </button>
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
                  {/* Reemplaza esto por tus marcas reales */}
                  {marcas.map(marca => (
                    <button
                      key={marca}
                      style={{
                        background: filtroMarca === marca ? "#a32020" : "#353535",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        marginBottom: 4,
                        width: "100%",
                        cursor: "pointer",
                      }}
                      onClick={() => setFiltroMarca(marca)}
                    >
                      {marca}
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
              <span>{producto.nombre}</span>
              <span className="producto-descripcion">{producto.descripcion}</span>
              <div className="producto-actions">
                <button className="ver-btn motos-bar-btn" onClick={() => {
                  setProductoSeleccionado(producto);
                  setShowVerModal(true);
                }}>
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