import React, { useEffect, useState } from 'react';
import './Compras.css';

interface Marca {
    id: number;
    nombre: string;
}

interface Proveedor {
    id: number;
    nombre: string;
}

interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    cantidad: number;
    marca: string;
    proveedor?: string;
    tipo: string;
}

const tipos = [
    { value: 'moto', label: 'Moto' },
    { value: 'accesorio', label: 'Accesorio' },
    { value: 'repuesto', label: 'Repuesto' }
];

const Compras = () => {
    const [tipo, setTipo] = useState<string>('moto');
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
    const [cantidad, setCantidad] = useState<number>(1);
    const [carrito, setCarrito] = useState<(Producto & { cantidad: number })[]>([]);
    const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('');
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>('');
    const [precioUnitario, setPrecioUnitario] = useState<string>('');
    const [mensajeError, setMensajeError] = useState<string>('');
    const [observaciones, setObservaciones] = useState<string>('');
    const [mensajeExito, setMensajeExito] = useState<string>('');
    const [confirmando, setConfirmando] = useState<boolean>(false);
    const [cooldownBtn, setCooldownBtn] = useState<boolean>(false);

    useEffect(() => {
        fetch('http://localhost:3001/api/marcas')
            .then(res => res.json())
            .then((data: Marca[]) => setMarcas(data));
        fetch('http://localhost:3001/api/proveedores')
            .then(res => res.json())
            .then((data: Proveedor[]) => setProveedores(data));
    }, []);

    useEffect(() => {
        fetch(`http://localhost:3001/api/productos?tipo=${tipo}`)
            .then(res => res.json())
            .then((data: Producto[]) => setProductos(data));
        setProductoSeleccionado(null);
    }, [tipo]);

    useEffect(() => {
        if (mensajeError) {
            const timer = setTimeout(() => setMensajeError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensajeError]);

    const agregarAlCarrito = () => {
        if (productoSeleccionado === null) {
            setMensajeError("Seleccione un producto.");
            return;
        }
        if (!cantidad || cantidad < 1 || !Number.isInteger(cantidad)) {
            setMensajeError("Ingrese una cantidad válida (mayor a 0 y entera).");
            return;
        }
        const precioNum = Number(precioUnitario);
        if (
            precioUnitario === '' ||
            isNaN(precioNum) ||
            precioNum <= 0 ||
            !Number.isInteger(precioNum)
        ) {
            setMensajeError("El precio unitario debe ser un número entero mayor a 0.");
            return;
        }
        if (carrito.some(item => item.id === productoSeleccionado)) {
            setMensajeError("Este producto ya está en el carrito.");
            return;
        }
        if (tipo === "repuesto" && !proveedorSeleccionado) {
            setMensajeError("Seleccione un proveedor.");
            return;
        }
        if (tipo === "moto" && !marcaSeleccionada) {
            setMensajeError("Seleccione una marca.");
             return;
        }
        setMensajeError('');
        const prod = productos.find(p => p.id === productoSeleccionado);
        if (!prod) return;
        setCarrito([...carrito, {
            ...prod,
            cantidad: cantidad,
            precio: precioNum,
            observaciones 
        }]);
        setCantidad(1);
        setProductoSeleccionado(null);
        setPrecioUnitario('');
        setObservaciones(''); 
    };

    const eliminarDelCarrito = (idx: number) => {
        setCarrito(carrito.filter((_, i) => i !== idx));
    };

    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const volverAlMenu = () => {
        window.location.href = '/menu';
    };

    const confirmarCompra = async () => {
        if (confirmando || cooldownBtn) return;
         if (carrito.length === 0) {
             setMensajeError("El carrito está vacío.");
             return;
         }
         if (tipo === "repuesto" && !proveedorSeleccionado) {
             setMensajeError("Seleccione un proveedor.");
             return;
         }
         setMensajeError('');
         let proveedor_id = null;
         if (tipo === "repuesto") {
             const proveedor = proveedores.find(p => p.nombre === proveedorSeleccionado);
             if (!proveedor) {
                 setMensajeError("Proveedor no válido.");
                 return;
             }
             proveedor_id = proveedor.id;
         }
         try {
             setConfirmando(true);
             const res = await fetch('http://localhost:3001/api/compras', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     proveedor_id,
                     total,
                     observaciones,
                     productos: carrito.map(item => ({
                         id: item.id,
                         cantidad: item.cantidad,
                         precio: Number(item.precio)
                     }))
                 })
             });
             const data = await res.json();
             if (data.success) {
                 setCarrito([]);
                 setObservaciones('');
                 setMensajeError('');
                 setMensajeExito('¡Compra registrada correctamente!');
                 setTipo('moto');
                 setMarcaSeleccionada('');
                 setProveedorSeleccionado('');
                 setProductoSeleccionado(null);
                 setCantidad(1);
                 setPrecioUnitario('');
                 setTimeout(() => setMensajeExito(''), 3500);
                // Bloqueo breve del botón tras el éxito (igual que ventas)
                setCooldownBtn(true);
                setTimeout(() => setCooldownBtn(false), 2000);
             } else {
                 setMensajeError(data.error || 'Error al registrar la compra');
             }
         } catch (err) {
             setMensajeError('Error de conexión con el servidor');
         } finally {
             setConfirmando(false);
         }
    };

    return (
        <div className="compras-bg">
            <button
                onClick={volverAlMenu}
                className="inicio-btn"
                style={{
                    position: 'fixed',
                    top: 32,
                    left: 32,
                    zIndex: 100
                }}
            >
                INICIO
            </button>
            <div className="compras-container">
                {}
                <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '2.5rem', marginBottom: '32px', letterSpacing: '2px', textAlign: 'center' }}>Compras</h1>
                <h2>Crear un pedido</h2>
                {}
                {mensajeError && (
                    <div style={{
                        background: "#ffe0e0",
                        color: "#a32020",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        marginBottom: "18px",
                        fontWeight: "bold",
                        textAlign: "center"
                    }}>
                        {mensajeError}
                    </div>
                )}
                <div className="nueva-compra">
                    <div className="form-row">
                        <label>Tipo de Compra</label>
                        <select value={tipo} onChange={e => {
                            setTipo(e.target.value);
                            setMarcaSeleccionada('');
                            setProveedorSeleccionado('');
                            setProductoSeleccionado(null);
                        }}>
                            {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    {tipo === 'repuesto' && (
                        <div className="form-row">
                            <label>Proveedor</label>
                            <select
                                value={proveedorSeleccionado}
                                onChange={e => {
                                    setProveedorSeleccionado(e.target.value);
                                    setProductoSeleccionado(null);
                                }}
                            >
                                <option value="">Seleccione un proveedor</option>
                                {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    {(tipo === 'repuesto' || tipo === 'accesorio') && (
                        <div className="form-row">
                            <label>Calidad</label>
                            <select
                                value={marcaSeleccionada}
                                onChange={e => {
                                    setMarcaSeleccionada(e.target.value);
                                    setProductoSeleccionado(null);
                                }}
                            >
                                <option value="">Todas</option>
                                <option value="Primera Marca">Primera Marca</option>
                                <option value="Segunda Marca">Segunda Marca</option>
                            </select>
                        </div>
                    )}
                    {tipo === 'moto' && (
                        <div className="form-row">
                            <label>Marca</label>
                            <select
                                value={marcaSeleccionada}
                                onChange={e => {
                                    setMarcaSeleccionada(e.target.value);
                                    setProductoSeleccionado(null);
                                }}
                            >
                                <option value="">Seleccione una marca</option>
                                {marcas
                                    .filter(m => m.nombre !== "Primera Marca" && m.nombre !== "Segunda Marca")
                                    .map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="form-row">
                        <label>Producto</label>
                        <select
                            value={productoSeleccionado !== null ? productoSeleccionado : ''}
                            onChange={e => setProductoSeleccionado(Number(e.target.value))}
                        >
                            <option value="">Seleccione un producto</option>
                            {productos
                                .filter(p =>
                                    (tipo === 'repuesto' ? p.proveedor === proveedorSeleccionado : true) &&
                                    (tipo === 'moto'
                                        ? p.marca === marcaSeleccionada
                                        : (tipo === 'repuesto' || tipo === 'accesorio')
                                            ? (marcaSeleccionada
                                                ? p.marca.toLowerCase() === marcaSeleccionada.toLowerCase()
                                                : true)
                                            : true
                                    )
                                )
                                .map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} ({p.marca}{p.proveedor ? ` - ${p.proveedor}` : ''})
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Cantidad</label>
                        <input
                            type="number"
                            min={1}
                            value={cantidad === 0 ? "" : cantidad}
                            onChange={e => {
                                const val = e.target.value;
                                setCantidad(val === "" ? 0 : Number(val));
                            }}
                        />
                    </div>
                    <div className="form-row">
                        <label>Precio unitario</label>
                        <input
                            type="number"
                            min={0}
                            value={precioUnitario}
                            onChange={e => setPrecioUnitario(e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <label>Observaciones</label>
                        <textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            placeholder="Observaciones de la compra (opcional)"
                            rows={3}
                            maxLength={120}
                            style={{
                                resize: 'none', // <--- evita que se estire el modal para abajo
                                width: '100%',
                                background: '#232526',
                                color: '#fff',
                                border: '1px solid #353535',
                                borderRadius: '8px',
                                padding: '8px',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                                marginTop: '4px'
                            }}
                        />
                    </div>
                    <button
                        className="btn-agregar"
                        onClick={agregarAlCarrito}
                        disabled={
                            productoSeleccionado === null ||
                            !cantidad || cantidad < 1 ||
                            precioUnitario === '' || Number(precioUnitario) <= 0 ||
                            (tipo === "repuesto" && !proveedorSeleccionado) ||
                            (tipo === "moto" && !marcaSeleccionada)
                        }
                    >
                        Agregar al carrito
                    </button>
                </div>
                <div className="carrito">
                    <h3 style={{ marginTop: '8px', marginBottom: '18px', color: '#fff' }}>Carrito de Compras</h3>
                    {carrito.length === 0 ? <p style={{ color: '#fff' }}>No hay productos en el carrito.</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Marca</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>Subtotal</th>
                                    <th>Obs.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {item.nombre}
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                title="Eliminar"
                                                onClick={() => eliminarDelCarrito(idx)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c1121f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                            </button>
                                        </td>
                                        <td>{item.marca}</td>
                                        <td>{item.cantidad}</td>
                                        <td>${Number(item.precio)}</td>
                                        <td>${Number(item.precio) * item.cantidad}</td>
                                        <td>{item.observaciones || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="total-row">
                        <span>Total:</span>
                        <span className="total">${total}</span>
                    </div>
                </div>
                {}
                {mensajeExito && (
                    <div style={{
                        background: "#1e7e34",
                        color: "#fff",
                        padding: "12px 20px",
                        borderRadius: 8,
                        marginTop: 18,      // separación del carrito
                        marginBottom: 18,
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(30,126,52,0.18)"
                    }}>
                        {mensajeExito}
                    </div>
                )}
                <button
                    className="btn-confirmar"
                    onClick={confirmarCompra}
                    disabled={confirmando || cooldownBtn}
                    title={confirmando ? "Confirmando..." : undefined}
                >
                    {confirmando ? "CONFIRMANDO..." : "CONFIRMAR COMPRA"}
                </button>
            </div>
        </div>
    );
};

export default Compras;
