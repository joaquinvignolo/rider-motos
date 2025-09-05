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

    // Opciones de marcas
    const opcionesMarcas = [
        { value: 'primera', label: 'Primera Marca' },
        { value: 'segunda', label: 'Segunda Marca' }
    ];

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

    const agregarAlCarrito = () => {
        if (productoSeleccionado === null) return;
        const prod = productos.find(p => p.id === productoSeleccionado);
        if (!prod) return;
        setCarrito([...carrito, {
            ...prod,
            cantidad: cantidad
        }]);
        setCantidad(1);
        setProductoSeleccionado(null);
    };

    const eliminarDelCarrito = (idx: number) => {
        setCarrito(carrito.filter((_, i) => i !== idx));
    };

    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    // --- Botón volver al menú principal ---
    const volverAlMenu = () => {
        window.location.href = '/menu'; // Cambia '/menu' por la ruta de tu menú principal si es diferente
    };

    return (
        <div className="compras-bg">
            <div className="compras-container">
                {/* Botón INICIO arriba a la izquierda */}
                <button
                    onClick={volverAlMenu}
                    style={{
                        position: 'absolute',
                        top: 28,
                        left: 32,
                        background: '#a82020',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 32px',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                    }}
                >
                    INICIO
                </button>
                <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '2.5rem', marginBottom: '32px', letterSpacing: '2px', textAlign: 'center' }}>Compras</h1>
                <h2>Gestión de Compras</h2>
                <div className="nueva-compra">
                    <div className="form-row">
                        <label>Tipo de Compra</label>
                        <select value={tipo} onChange={e => setTipo(e.target.value)}>
                            {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Producto</label>
                        <select value={productoSeleccionado !== null ? productoSeleccionado : ''} onChange={e => setProductoSeleccionado(Number(e.target.value))}>
                            <option value="">Seleccione un producto</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} ({p.marca})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Cantidad</label>
                        <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                    </div>
                    {/* Marcas y proveedores según tipo */}
                    {(tipo === 'accesorio' || tipo === 'repuesto') && (
                        <div className="form-row">
                            <label>Marcas</label>
                            <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)}>
                                <option value="">Seleccione una marca</option>
                                {opcionesMarcas.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    )}
                    {tipo === 'moto' && (
                        <div className="form-row">
                            <label>Marcas</label>
                            <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)}>
                                <option value="">Seleccione una marca</option>
                                {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    {tipo === 'repuesto' && (
                        <div className="form-row">
                            <label>Proveedor</label>
                            <select>
                                {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    <button className="btn-agregar" onClick={agregarAlCarrito}>Agregar al carrito</button>
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
                                        <td>${Number(item.precio).toFixed(2)}</td>
                                        <td>${Number(item.precio) * item.cantidad}</td>
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
                <button className="btn-confirmar">Confirmar compra</button>
            </div>
        </div>
    );
};

export default Compras;
