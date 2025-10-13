require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const { generarPDFVenta } = require('./pdfVenta');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'q1w2e3r4',
  database: 'rider_motos'
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err.message);
    process.exit(1);
  } else {
    console.log('Conexión a MySQL exitosa');
  }
});

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Ruta para login
app.post('/api/login', (req, res) => {
  const { usuario, contrasena } = req.body;
  db.query(
    'SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?',
    [usuario, contrasena],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en el servidor' });
      if (results.length > 0) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
      }
    }
  );
});

// Obtener todas las marcas
app.get('/api/marcas', (req, res) => {
  db.query('SELECT * FROM marcas', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    res.json(results);
  });
});

// Obtener todos los proveedores
app.get('/api/proveedores', (req, res) => {
  db.query('SELECT * FROM proveedores', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    res.json(results);
  });
});

// Obtener productos por tipo
app.get('/api/productos', (req, res) => {
  const { tipo, inactivos } = req.query;
  let sql = 'SELECT p.id, p.nombre, p.descripcion, p.precio, p.cantidad, m.nombre as marca, pr.nombre as proveedor, p.tipo, p.activo FROM productos p LEFT JOIN marcas m ON p.marca_id = m.id LEFT JOIN proveedores pr ON p.proveedor_id = pr.id';
  const params = [];
  let where = [];
  if (tipo) {
    where.push('p.tipo = ?');
    params.push(tipo);
  }
  if (!inactivos) {
    where.push('p.activo = 1');
  } else if (inactivos === "1") {
    where.push('p.activo = 0');
  }
  if (where.length) {
    sql += ' WHERE ' + where.join(' AND ');
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    res.json(results);
  });
});

// Agregar producto
app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, cantidad, marca, proveedor, tipo } = req.body;
  const cantidadFinal = cantidad === "" || cantidad == null ? 0 : cantidad;

  db.query('SELECT id FROM marcas WHERE nombre = ?', [marca], (err, marcaRows) => {
    if (err || marcaRows.length === 0) return res.status(400).json({ error: 'Marca no encontrada' });
    const marca_id = marcaRows[0].id;

    db.query('SELECT id FROM proveedores WHERE nombre = ?', [proveedor], (err2, provRows) => {
      if (err2 || provRows.length === 0) return res.status(400).json({ error: 'Proveedor no encontrado' });
      const proveedor_id = provRows[0].id;
      db.query(
        'INSERT INTO productos (nombre, descripcion, precio, cantidad, marca_id, proveedor_id, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion, precio, cantidadFinal, marca_id, proveedor_id, tipo],
        (err3, result) => {
          if (err3) return res.status(500).json({ error: 'Error al agregar producto' });
          res.json({ success: true, id: result.insertId });
        }
      );
    });
  });
});

// Eliminar producto (eliminado lógico)
app.delete('/api/productos/:id', (req, res) => {
  db.query('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar producto' });
    res.json({ success: true });
  });
});

// Editar producto
app.put('/api/productos/:id', (req, res) => {
  const { nombre, descripcion, precio, cantidad, marca, proveedor, tipo } = req.body;

  db.query('SELECT id FROM marcas WHERE nombre = ?', [marca], (err, marcaRows) => {
    if (err || marcaRows.length === 0) return res.status(400).json({ error: 'Marca no encontrada' });
    const marca_id = marcaRows[0].id;

    db.query('SELECT id FROM proveedores WHERE nombre = ?', [proveedor], (err2, provRows) => {
      if (err2 || provRows.length === 0) return res.status(400).json({ error: 'Proveedor no encontrado' });
      const proveedor_id = provRows[0].id;
      db.query(
        'UPDATE productos SET nombre=?, descripcion=?, precio=?, cantidad=?, marca_id=?, proveedor_id=?, tipo=? WHERE id=?',
        [nombre, descripcion, precio, cantidad, marca_id, proveedor_id, tipo, req.params.id],
        (err3) => {
          if (err3) return res.status(500).json({ error: 'Error al editar producto' });
          res.json({ success: true });
        }
      );
    });
  });
});

// Activar/Inactivar producto
app.patch('/api/productos/:id/activo', (req, res) => {
  const { activo } = req.body;
  db.query(
    'UPDATE productos SET activo=? WHERE id=?',
    [activo, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al cambiar estado del producto' });
      res.json({ success: true });
    }
  );
});

// Obtener clientes. solo activos por defecto
app.get('/api/clientes', (req, res) => {
  const { search, inactivos } = req.query;
  let sql = 'SELECT * FROM clientes';
  let params = [];
  let where = [];

  if (inactivos === "1") {
    where.push('activo=0');
  } else {
    where.push('activo=1');
  }
  if (search) {
    where.push('(nombre LIKE ? OR apellido LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (where.length) {
    sql += ' WHERE ' + where.join(' AND ');
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener clientes' });
    res.json(results);
  });
});

// Agregar cliente
app.post('/api/clientes', (req, res) => {
  const { nombre, apellido, telefono, correo } = req.body;
  db.query(
    'INSERT INTO clientes (nombre, apellido, telefono, correo, activo) VALUES (?, ?, ?, ?, 1)',
    [nombre, apellido, telefono, correo],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al agregar cliente' });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Editar cliente
app.put('/api/clientes/:id', (req, res) => {
  const { nombre, apellido, telefono, correo } = req.body;
  db.query(
    'UPDATE clientes SET nombre=?, apellido=?, telefono=?, correo=? WHERE id=?',
    [nombre, apellido, telefono, correo, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al editar cliente' });
      res.json({ success: true });
    }
  );
});

// Activar/Inactivar cliente
app.patch('/api/clientes/:id/activo', (req, res) => {
  const { activo } = req.body;
  db.query(
    'UPDATE clientes SET activo=? WHERE id=?',
    [activo, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al cambiar estado' });
      res.json({ success: true });
    }
  );
});

// Registrar venta
app.post('/api/ventas', (req, res) => {
  const { cliente_id, total, tipo_venta, metodo_pago, productos } = req.body;
  const clienteIdFinal = typeof cliente_id === "undefined" ? null : cliente_id;
  
  db.query(
    'INSERT INTO ventas (cliente_id, fecha, total, tipo_venta, metodo_pago) VALUES (?, NOW(), ?, ?, ?)',
    [clienteIdFinal, total, tipo_venta, metodo_pago],
    (err, result) => {
      if (err) {
        console.error("Error al registrar venta:", err);
        return res.status(500).json({ error: 'Error al registrar venta' });
      }
      const venta_id = result.insertId;
      
      const detalles = productos.map(p => [
        venta_id, 
        p.id, 
        p.cantidad, 
        p.precio,
        p.metodo_pago || metodo_pago  
      ]);
      
      db.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, metodo_pago) VALUES ?',
        [detalles],
        (err2) => {
          if (err2) {
            console.error("Error al registrar detalle de venta:", err2);
            return res.status(500).json({ error: 'Error al registrar detalle de venta' });
          }
          // Descontar stock de cada producto vendido
          const updates = productos.map(p =>
            new Promise((resolve, reject) => {
              db.query(
                'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?',
                [p.cantidad, p.id],
                (err3) => {
                  if (err3) reject(err3);
                  else resolve();
                }
              );
            })
          );
          Promise.all(updates)
            .then(async () => {
              // Buscar datos del cliente
              if (clienteIdFinal) {
                db.query('SELECT * FROM clientes WHERE id = ?', [clienteIdFinal], async (err, clientes) => {
                  // VALIDAR que exista correo
                  if (!err && clientes.length && clientes[0].correo && clientes[0].correo.trim() !== '') {
                    // Traer detalles de la venta
                    db.query(
                      'SELECT dv.cantidad, dv.precio_unitario as precio, pr.nombre, pr.descripcion, m.nombre as marca FROM detalle_ventas dv JOIN productos pr ON dv.producto_id = pr.id LEFT JOIN marcas m ON pr.marca_id = m.id WHERE dv.venta_id = ?',
                      [venta_id],
                      async (err4, detallesVenta) => {
                        if (!err4 && detallesVenta.length) {
                          // Generar PDF
                          const pdfBuffer = await generarPDFVenta(
                            { fecha: new Date(), total, ...req.body },
                            detallesVenta,
                            clientes[0]
                          );
                          // Enviar email
                          transporter.sendMail({
                            from: '"Rider Motos" <ridermotos@gmail.com>',
                            to: clientes[0].correo,
                            subject: 'Comprobante de su compra - Rider Motos',
                            text: 'Adjuntamos el comprobante de su compra. ¡Gracias por confiar en nosotros!',
                            attachments: [
                              { filename: 'detalle-venta.pdf', content: pdfBuffer }
                            ]
                          }, (errMail, info) => {
                            if (errMail) {
                              console.error('Error enviando mail:', errMail);
                              return res.json({ success: true, venta_id, mailEnviado: false });
                            } else {
                              //console.log('Mail enviado:', info);
                              return res.json({ success: true, venta_id, mailEnviado: true });
                            }
                          });
                          return; 
                        }
                        // Si no hay detalles de venta, igual respondé
                        return res.json({ success: true, venta_id, mailEnviado: false });
                      }
                    );
                    return; 
                  }
                  // Si no hay cliente o correo, igual respondé
                  return res.json({ success: true, venta_id, mailEnviado: false });
                });
                return; 
              }
              // Si no hay clienteIdFinal, respondé normalmente
              return res.json({ success: true, venta_id, mailEnviado: false });
            })
            .catch(err3 => {
              console.error("Error al actualizar stock:", err3);
              res.status(500).json({ error: 'Error al actualizar stock' });
            });
        }
      );
    }
  );
});

// Obtener todas las ventas CON DETALLES en una sola consulta
app.get('/api/ventas', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        v.id as venta_id,
        v.fecha, 
        v.total, 
        v.tipo_venta, 
        v.metodo_pago as venta_metodo_pago,
        IFNULL(c.nombre, 'Consumidor final') as cliente,
        c.nombre AS cliente_nombre,
        c.apellido AS cliente_apellido,
        c.telefono AS cliente_telefono,
        c.correo AS cliente_correo,
        dv.cantidad,
        dv.precio_unitario as precio,
        dv.metodo_pago,
        pr.nombre as producto_nombre,
        pr.descripcion,
        pr.tipo,
        m.nombre as marca
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      LEFT JOIN productos pr ON dv.producto_id = pr.id
      LEFT JOIN marcas m ON pr.marca_id = m.id
      ORDER BY v.fecha DESC
    `);

    // Agrupar por venta_id
    const ventasMap = new Map();
    
    rows.forEach(row => {
      if (!ventasMap.has(row.venta_id)) {
        ventasMap.set(row.venta_id, {
          id: row.venta_id,
          fecha: row.fecha,
          total: row.total,
          tipo_venta: row.tipo_venta,
          metodo_pago: row.venta_metodo_pago,
          cliente: row.cliente,
          cliente_nombre: row.cliente_nombre,
          cliente_apellido: row.cliente_apellido,
          cliente_telefono: row.cliente_telefono,
          cliente_correo: row.cliente_correo,
          detalles: []
        });
      }
      
      if (row.producto_nombre) {
        ventasMap.get(row.venta_id).detalles.push({
          nombre: row.producto_nombre,
          marca: row.marca,
          tipo: row.tipo,
          cantidad: row.cantidad,
          precio: row.precio,
          metodo_pago: row.metodo_pago
        });
      }
    });

    res.json(Array.from(ventasMap.values()));
  } catch (err) {
    console.error("Error en /api/ventas:", err);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// Ruta para obtener todas las compras
app.get('/api/compras', async (req, res) => {
  try {
    const [compras] = await db.promise().query(`
      SELECT 
        c.id, 
        c.fecha, 
        c.fecha_emision, 
        c.tipo_comprobante, 
        c.numero_comprobante, 
        c.total, 
        c.observaciones,
        p.nombre as proveedor
      FROM compras c
      INNER JOIN proveedores p ON c.proveedor_id = p.id
      ORDER BY c.fecha_emision DESC, c.fecha DESC
    `);

    const [detalles] = await db.promise().query(`
      SELECT 
        dc.compra_id, 
        dc.cantidad, 
        dc.precio_unitario as precio, 
        pr.nombre,
        pr.tipo,  -- ← AGREGAR
        m.nombre as marca,
        dc.observaciones
      FROM detalle_compras dc
      JOIN productos pr ON dc.producto_id = pr.id
      LEFT JOIN marcas m ON pr.marca_id = m.id
    `);

    const comprasConDetalles = compras.map(compra => ({
      ...compra,
      detalles: detalles
        .filter(d => d.compra_id === compra.id)
        .map(d => ({
          nombre: d.nombre,
          tipo: d.tipo, 
          marca: d.marca,
          cantidad: d.cantidad,
          precio: d.precio,
          observaciones: d.observaciones
        }))
    }));

    res.json(comprasConDetalles);
  } catch (err) {
    console.error("Error en /api/compras:", err);
    res.status(500).json({ error: 'Error al obtener compras: ' + err.message });
  }
});

// Ruta para registrar una nueva compra
app.post('/api/compras', (req, res) => {
  let { 
    proveedor_id, 
    total, 
    observaciones, 
    productos, 
    tipo_comprobante, 
    numero_comprobante, 
    fecha_emision 
  } = req.body;
  
  // 1. Proveedor obligatorio
  if (!proveedor_id || proveedor_id === "" || proveedor_id === "null" || proveedor_id === null) {
    return res.status(400).json({ error: 'El proveedor es obligatorio' });
  }
  
  // 2. Validar que el proveedor exista
  db.query('SELECT id FROM proveedores WHERE id = ?', [proveedor_id], (err, provRows) => {
    if (err || provRows.length === 0) {
      return res.status(400).json({ error: 'Proveedor no válido o no existe' });
    }
    
    // 3. Tipo de comprobante obligatorio
    if (!tipo_comprobante || tipo_comprobante.trim() === "") {
      return res.status(400).json({ error: 'El tipo de comprobante es obligatorio' });
    }
    
    // 4. Validar tipo de comprobante permitido
    const tiposPermitidos = ['Factura A', 'Factura B', 'Factura C', 'Remito', 'Presupuesto', 'Ticket'];
    if (!tiposPermitidos.includes(tipo_comprobante)) {
      return res.status(400).json({ error: 'Tipo de comprobante inválido' });
    }
    
    // 5. Número de comprobante SIEMPRE obligatorio (la factura ya existe)
    if (!numero_comprobante || numero_comprobante.trim() === '') {
      return res.status(400).json({ 
        error: 'El número de comprobante es obligatorio (factura en papel)' 
      });
    }
    
    if (numero_comprobante.length > 50) {
      return res.status(400).json({ error: 'El número de comprobante no puede superar 50 caracteres' });
    }
    
    // 6. Fecha de emisión
    if (!fecha_emision || fecha_emision.trim() === "") {
      fecha_emision = new Date().toISOString().split('T')[0];
    }
    
    // 7. Validar que la fecha no sea futura
    const fechaEmisionDate = new Date(fecha_emision);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaEmisionDate > hoy) {
      return res.status(400).json({ error: 'La fecha de emisión no puede ser futura' });
    }
    
    // 8. Validar que haya productos
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe agregar al menos un producto' });
    }
    
    if (!total || total <= 0) {
      return res.status(400).json({ error: 'El total debe ser mayor a $0' });
    }
    
    // 9. Validar precios y cantidades
    for (const p of productos) {
      if (!p.cantidad || p.cantidad <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para producto ID ${p.id}` });
      }
      if (!p.precio || p.precio <= 0) {
        return res.status(400).json({ error: `Precio inválido para producto ID ${p.id}` });
      }
    }
    
    // 10. Insertar compra
    db.query(
      `INSERT INTO compras 
        (proveedor_id, tipo_comprobante, numero_comprobante, fecha_emision, total, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        proveedor_id, 
        tipo_comprobante, 
        numero_comprobante, 
        fecha_emision, 
        total, 
        observaciones || null
      ],
      (err3, result) => {
        if (err3) {
          console.error("Error al registrar compra:", err3);
          return res.status(500).json({ error: 'Error al registrar compra: ' + err3.message });
        }
        const compra_id = result.insertId;
        
        const detalles = productos.map(p => [
          compra_id,
          p.id,
          p.cantidad,
          p.precio,
          null
        ]);
        
        db.query(
          'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, observaciones) VALUES ?',
          [detalles],
          (err4) => {
            if (err4) {
              console.error("Error al registrar detalle de compra:", err4);
              return res.status(500).json({ error: 'Error al registrar detalle de compra: ' + err4.message });
            }
            
            // Actualizar stock
            const updates = productos.map(p =>
              new Promise((resolve, reject) => {
                db.query(
                  'UPDATE productos SET cantidad = cantidad + ? WHERE id = ?',
                  [p.cantidad, p.id],
                  (err5) => {
                    if (err5) reject(err5);
                    else resolve();
                  }
                );
              })
            );
            
            Promise.all(updates)
              .then(() => res.json({ success: true, compra_id }))
              .catch(err6 => {
                console.error("Error al actualizar stock:", err6);
                res.status(500).json({ error: 'Error al actualizar stock: ' + err6.message });
              });
          }
        );
      }
    );
  });
});

// Obtener ventas de motos disponibles para patentamiento (sin trámite iniciado)
app.get('/api/ventas-disponibles-patentamiento', async (req, res) => {
  try {
    const [ventas] = await db.promise().query(`
      SELECT 
        v.id,
        v.fecha,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        pr.nombre as moto_nombre,
        m.nombre as marca
      FROM ventas v
      INNER JOIN clientes c ON v.cliente_id = c.id
      INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
      INNER JOIN productos pr ON dv.producto_id = pr.id
      INNER JOIN marcas m ON pr.marca_id = m.id
      WHERE v.tipo_venta = 'moto'
        AND pr.tipo = 'moto'
        AND NOT EXISTS (
          SELECT 1 FROM patentamientos p WHERE p.venta_id = v.id
        )
      ORDER BY v.fecha DESC
    `);
    res.json(ventas);
  } catch (err) {
    console.error("Error en /api/ventas-disponibles-patentamiento:", err);
    res.status(500).json({ error: 'Error al obtener ventas disponibles' });
  }
});

// Obtener todos los trámites de patentamiento
app.get('/api/patentamientos', async (req, res) => {
  try {
    const [tramites] = await db.promise().query(`
      SELECT 
        p.id,
        p.venta_id,
        p.estado,
        p.fecha_solicitud as fechaSolicitud,
        p.fecha_finalizacion as fechaFinalizacion,
        p.observaciones,
        CONCAT(c.nombre, ' ', c.apellido) as cliente,
        CONCAT(m.nombre, ' ', pr.nombre) as moto
      FROM patentamientos p
      INNER JOIN ventas v ON p.venta_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
      INNER JOIN productos pr ON dv.producto_id = pr.id
      INNER JOIN marcas m ON pr.marca_id = m.id
      WHERE pr.tipo = 'moto'
      ORDER BY p.fecha_solicitud DESC
    `);
    res.json(tramites);
  } catch (err) {
    console.error("Error en /api/patentamientos:", err);
    res.status(500).json({ error: 'Error al obtener patentamientos' });
  }
});

// Crear nuevo trámite de patentamiento
app.post('/api/patentamientos', async (req, res) => {
  const { venta_id, observaciones, numero_chasis, numero_motor, numero_certificado } = req.body;
  
  try {
    // Verificar que la venta exista y sea de tipo moto
    const [ventas] = await db.promise().query(
      'SELECT id FROM ventas WHERE id = ? AND tipo_venta = "moto"',
      [venta_id]
    );
    
    if (ventas.length === 0) {
      return res.status(400).json({ error: 'Venta no válida o no es de tipo moto' });
    }
    
    // Verificar que no exista ya un trámite para esta venta
    const [tramitesExistentes] = await db.promise().query(
      'SELECT id FROM patentamientos WHERE venta_id = ?',
      [venta_id]
    );
    
    if (tramitesExistentes.length > 0) {
      return res.status(400).json({ error: 'Ya existe un trámite para esta venta' });
    }
    
    // Insertar trámite
    const [result] = await db.promise().query(
      `INSERT INTO patentamientos 
        (venta_id, estado, fecha_solicitud, observaciones) 
       VALUES (?, 'Pendiente', NOW(), ?)`,
      [venta_id, observaciones || null]
    );
    
    const patentamiento_id = result.insertId;
    
    await db.promise().query(
      `INSERT INTO motos_entregadas 
        (patentamiento_id, numero_chasis, numero_motor, numero_certificado) 
       VALUES (?, ?, ?, ?)`,
      [patentamiento_id, numero_chasis, numero_motor, numero_certificado]
    );
    
    res.json({ success: true, patentamiento_id });
  } catch (err) {
    console.error("Error al crear patentamiento:", err);
    res.status(500).json({ error: 'Error al crear patentamiento: ' + err.message });
  }
});

// Actualizar estado de patentamiento
app.patch('/api/patentamientos/:id', async (req, res) => {
  const { estado } = req.body;
  const { id } = req.params;
  
  try {
    const fechaFinalizacion = estado === 'Completado' ? new Date() : null;
    
    await db.promise().query(
      'UPDATE patentamientos SET estado = ?, fecha_finalizacion = ? WHERE id = ?',
      [estado, fechaFinalizacion, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error al actualizar estado:", err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Obtener datos únicos de la moto para un trámite
app.get('/api/motos-entregadas/:tramite_id', async (req, res) => {
  try {
    const [datos] = await db.promise().query(
      'SELECT numero_chasis, numero_motor, numero_certificado FROM motos_entregadas WHERE patentamiento_id = ?',
      [req.params.tramite_id]
    );
    
    if (datos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos' });
    }
    
    res.json(datos[0]);
  } catch (err) {
    console.error("Error al obtener datos de moto:", err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.listen(3001, () => {
  console.log('Servidor corriendo en http://localhost:3001');
});