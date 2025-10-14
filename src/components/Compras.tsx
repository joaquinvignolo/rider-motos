import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Compras.css';
import IndicadorCarga from './IndicadorCarga';

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
    const navigate = useNavigate();
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
    const [cantidad, setCantidad] = useState<number>(1);
    const [carrito, setCarrito] = useState<(Producto & { cantidad: number; precio: number })[]>([]);
    const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('');
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>('');
    const [precioUnitario, setPrecioUnitario] = useState<string>('');
    const [mensajeError, setMensajeError] = useState<string>('');
    const [observaciones, setObservaciones] = useState<string>('');
    const [mensajeExito, setMensajeExito] = useState<string>('');
    const [confirmando, setConfirmando] = useState<boolean>(false);
    const [cooldownBtn, setCooldownBtn] = useState<boolean>(false);
    
    // Estados para tipo de producto (filtro)
    const [tipo, setTipo] = useState<string>('');
    
    // Estados para comprobante
    const [tipoComprobante, setTipoComprobante] = useState<string>('Factura B');
    const [numeroComprobante, setNumeroComprobante] = useState<string>('');
    const [fechaEmision, setFechaEmision] = useState<string>(new Date().toISOString().split('T')[0]);
    
    // Estados para errores visuales
    const [errorProveedor, setErrorProveedor] = useState<boolean>(false);
    const [errorNumeroComprobante, setErrorNumeroComprobante] = useState<boolean>(false);

    const volverAlMenu = () => navigate('/menu');

    useEffect(() => {
        fetch('http://localhost:3001/api/marcas')
            .then(res => res.json())
            .then((data: Marca[]) => setMarcas(data));
        
        fetch('http://localhost:3001/api/proveedores')
            .then(res => res.json())
            .then((data: Proveedor[]) => setProveedores(data));
    }, []);

    useEffect(() => {
        const tipoQuery = tipo ? `?tipo=${tipo}` : '';
        fetch(`http://localhost:3001/api/productos${tipoQuery}`)
            .then(res => res.json())
            .then((data: Producto[]) => setProductos(data));
        setProductoSeleccionado(null);
    }, [tipo]);

    const agregarAlCarrito = () => {
        let errores: string[] = [];
        
        if (!proveedorSeleccionado) {
            errores.push("Seleccione un proveedor primero");
            setErrorProveedor(true);
            setMensajeError("Seleccione un proveedor primero");
            return;
        }
        
        if (productoSeleccionado === null) {
            errores.push("Seleccione un producto");
        }
        if (!cantidad || cantidad < 1 || !Number.isInteger(cantidad)) {
            errores.push("Cantidad inválida");
        }
        const precioNum = Number(precioUnitario);
        if (precioUnitario === '' || isNaN(precioNum) || precioNum <= 0) {
            errores.push("El precio debe ser mayor a 0");
        }
        if (carrito.some(item => item.id === productoSeleccionado)) {
            errores.push("Este producto ya está en el carrito");
        }
        
        if (errores.length > 0) {
            setMensajeError(errores.join(" | "));
            return;
        }
        
        const prod = productos.find(p => p.id === productoSeleccionado);
        if (!prod) return;
        
        setCarrito([...carrito, {
            ...prod,
            cantidad: cantidad,
            precio: precioNum
        }]);
        
        setCantidad(1);
        setProductoSeleccionado(null);
        setPrecioUnitario('');
        setMensajeError('');
    };

    const eliminarDelCarrito = (index: number) => {
        setCarrito(carrito.filter((_, i) => i !== index));
    };

    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    const confirmarCompra = async () => {
        if (confirmando || cooldownBtn) return;
        
        let errores: string[] = [];
        
        if (!proveedorSeleccionado) {
            errores.push("Seleccione un proveedor");
            setErrorProveedor(true);
        } else {
            setErrorProveedor(false);
        }
        
        if (!tipoComprobante) {
            errores.push("Seleccione un tipo de comprobante");
        }
        
        if (!numeroComprobante || numeroComprobante.trim() === '') {
            errores.push("El número de comprobante es obligatorio");
            setErrorNumeroComprobante(true);
        } else {
            setErrorNumeroComprobante(false);
        }
        
        if (!fechaEmision) {
            errores.push("Ingrese la fecha de emisión");
        } else {
            const fechaEmisionDate = new Date(fechaEmision);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (fechaEmisionDate > hoy) {
                errores.push("La fecha de emisión no puede ser futura");
            }
        }
        
        if (carrito.length === 0) {
            errores.push("Agregue al menos un producto");
        }
        
        if (errores.length > 0) {
            setMensajeError(errores.join(" | "));
            return;
        }
        
        setMensajeError('');
        
        const proveedor = proveedores.find(p => p.nombre === proveedorSeleccionado);
        if (!proveedor) {
            setMensajeError("Proveedor no válido.");
            return;
        }
        const proveedor_id = proveedor.id;
        
        try {
            setConfirmando(true);
            const res = await fetch('http://localhost:3001/api/compras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proveedor_id,
                    total,
                    observaciones,
                    tipo_comprobante: tipoComprobante,
                    numero_comprobante: numeroComprobante.trim(),
                    fecha_emision: fechaEmision,
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
                setNumeroComprobante('');
                setFechaEmision(new Date().toISOString().split('T')[0]);
                setTipoComprobante('Factura B');
                setMensajeError('');
                setMensajeExito('¡Compra registrada correctamente!');
                setTipo('');
                setMarcaSeleccionada('');
                setProveedorSeleccionado('');
                setProductoSeleccionado(null);
                setCantidad(1);
                setPrecioUnitario('');
                setErrorProveedor(false);
                setErrorNumeroComprobante(false);
                setTimeout(() => setMensajeExito(''), 3500);
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
                {confirmando && <IndicadorCarga mensaje="Registrando compra..." />}
                <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '2.5rem', marginBottom: '32px', letterSpacing: '2px', textAlign: 'center' }}>Compras</h1>
                
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
                    <h2>Registrar Factura de Compra</h2>
                    
                    {/* 1. PROVEEDOR (OBLIGATORIO PRIMERO) */}
                    <div className="form-row">
                        <label>
                            Proveedor *
                            {errorProveedor && <span style={{ color: '#ff4444', marginLeft: 4 }}>(obligatorio)</span>}
                        </label>
                        <select
                            value={proveedorSeleccionado}
                            onChange={e => {
                                setProveedorSeleccionado(e.target.value);
                                setErrorProveedor(false);
                            }}
                            style={errorProveedor ? { border: '2px solid #ff4444' } : undefined}
                        >
                            <option value="">Seleccione el proveedor de la factura</option>
                            {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                        </select>
                    </div>

                    {/* 2. TIPO DE COMPROBANTE */}
                    <div className="form-row">
                        <label>Tipo de Comprobante *</label>
                        <select
                            value={tipoComprobante}
                            onChange={e => setTipoComprobante(e.target.value)}
                        >
                            <option value="Factura A">Factura A</option>
                            <option value="Factura B">Factura B</option>
                            <option value="Factura C">Factura C</option>
                            <option value="Remito">Remito</option>
                        </select>
                    </div>

                    {/* 3. NÚMERO DE COMPROBANTE (SIEMPRE OBLIGATORIO) */}
                    <div className="form-row">
                        <label>
                            Nº de Comprobante *
                            <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: 8 }}>
                                (según factura en papel)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={numeroComprobante}
                            onChange={e => {
                                setNumeroComprobante(e.target.value);
                                setErrorNumeroComprobante(false);
                            }}
                            placeholder="Ej: 0001-00001234"
                            maxLength={50}
                            style={errorNumeroComprobante ? { border: '2px solid #ff4444' } : undefined}
                        />
                    </div>

                    {/* 4. FECHA DE EMISIÓN */}
                    <div className="form-row">
                        <label>Fecha de Emisión *</label>
                        <input
                            type="date"
                            value={fechaEmision}
                            onChange={e => setFechaEmision(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #353535' }} />

                    <h3 style={{ color: '#fff', marginBottom: '16px' }}>Productos de la factura</h3>

                    {/* FILTROS OPCIONALES */}
                    <div className="form-row">
                        <label>Tipo de Producto (filtro opcional)</label>
                        <select value={tipo} onChange={e => setTipo(e.target.value)}>
                            <option value="">Todos los tipos</option>
                            {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="form-row">
                        <label>Marca (filtro opcional)</label>
                        <select
                            value={marcaSeleccionada}
                            onChange={e => setMarcaSeleccionada(e.target.value)}
                        >
                            <option value="">Todas las marcas</option>
                            {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                        </select>
                    </div>

                    {/* 5. PRODUCTO */}
                    <div className="form-row">
                        <label>Producto *</label>
                        <select
                            value={productoSeleccionado ?? ''}
                            onChange={e => {
                                const prodId = Number(e.target.value);
                                setProductoSeleccionado(prodId);
                                const prod = productos.find(p => p.id === prodId);
                                if (prod) setPrecioUnitario(prod.precio.toString());
                            }}
                            disabled={!proveedorSeleccionado}
                        >
                            <option value="">
                                {proveedorSeleccionado ? 'Seleccione un producto' : 'Primero seleccione un proveedor'}
                            </option>
                            {productos
                                .filter(p => {
                                    if (tipo && p.tipo !== tipo) return false;
                                    if (marcaSeleccionada && p.marca !== marcaSeleccionada) return false;
                                    return true;
                                })
                                .map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} - {p.marca} (Stock: {p.cantidad})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* 6. CANTIDAD */}
                    <div className="form-row">
                        <label>Cantidad (según factura) *</label>
                        <input
                            type="number"
                            min={1}
                            value={cantidad || ''}
                            onChange={e => setCantidad(Number(e.target.value))}
                            disabled={!proveedorSeleccionado}
                        />
                    </div>

                    {/* 7. PRECIO UNITARIO */}
                    <div className="form-row">
                        <label>
                            Precio Unitario (según factura) *
                            <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: 8 }}>
                                (puede diferir del sistema)
                            </span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={precioUnitario}
                            onChange={e => setPrecioUnitario(e.target.value)}
                            placeholder="Precio en la factura"
                            disabled={!proveedorSeleccionado}
                        />
                    </div>

                    <button
                        className="btn-agregar"
                        onClick={agregarAlCarrito}
                        disabled={!proveedorSeleccionado}
                    >
                        {proveedorSeleccionado ? 'Agregar producto' : 'Primero seleccione un proveedor'}
                    </button>

                    {/* 8. OBSERVACIONES (OPCIONAL) */}
                    <div className="form-row" style={{ marginTop: '24px' }}>
                        <label>Observaciones (opcional)</label>
                        <textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            placeholder="Notas adicionales sobre esta compra..."
                            rows={3}
                            maxLength={200}
                            style={{
                                resize: 'none',
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
                </div>
                
                <div className="carrito">
                    <h3 style={{ marginTop: '8px', marginBottom: '18px', color: '#fff' }}>Productos cargados ({carrito.length})</h3>
                    {carrito.length === 0 ? <p style={{ color: '#888' }}>No hay productos agregados</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Marca</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.nombre}</td>
                                        <td>{item.marca}</td>
                                        <td>{item.cantidad}</td>
                                        <td>${Number(item.precio).toFixed(2)}</td>
                                        <td>${(Number(item.precio) * item.cantidad).toFixed(2)}</td>
                                        <td>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                title="Eliminar"
                                                onClick={() => eliminarDelCarrito(idx)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c1121f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="total-row">
                        <span>Total de la factura:</span>
                        <span className="total">${total.toFixed(2)}</span>
                    </div>
                </div>
                
                {mensajeExito && (
                    <div style={{
                        background: "#1e7e34",
                        color: "#fff",
                        padding: "12px 20px",
                        borderRadius: 8,
                        marginTop: 18,
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
                    disabled={confirmando || cooldownBtn || carrito.length === 0}
                >
                    {confirmando ? "REGISTRANDO..." : "REGISTRAR COMPRA"}
                </button>
            </div>
        </div>
    );
};

export default Compras;
