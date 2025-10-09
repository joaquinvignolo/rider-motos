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
  //console.log("Datos recibidos en /api/ventas:", req.body);
  db.query(
    'INSERT INTO ventas (cliente_id, fecha, total, tipo_venta, metodo_pago) VALUES (?, NOW(), ?, ?, ?)',
    [clienteIdFinal, total, tipo_venta, metodo_pago],
    (err, result) => {
      if (err) {
        console.error("Error al registrar venta:", err);
        return res.status(500).json({ error: 'Error al registrar venta' });
      }
      const venta_id = result.insertId;
      const detalles = productos.map(p => [venta_id, p.id, p.cantidad, p.precio]);
      db.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES ?',
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
                  if (!err && clientes.length && clientes[0].correo) {
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

// Obtener todas las ventas
app.get('/api/ventas', async (req, res) => {
  try {
    // 1. Traer todas las ventas con datos completos del cliente
    const [ventas] = await db.promise().query(`
      SELECT v.id, v.fecha, v.total, v.tipo_venta, v.metodo_pago,
             IFNULL(c.nombre, 'Consumidor final') as cliente,
             c.nombre AS cliente_nombre,
             c.apellido AS cliente_apellido,
             c.telefono AS cliente_telefono,
             c.correo AS cliente_correo
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
    `);

    // 2. Traer detalles de todas las ventas
    const [detalles] = await db.promise().query(`
      SELECT dv.venta_id, dv.cantidad, dv.precio_unitario as precio, pr.nombre, pr.descripcion, m.nombre as marca
      FROM detalle_ventas dv
      JOIN productos pr ON dv.producto_id = pr.id
      LEFT JOIN marcas m ON pr.marca_id = m.id
    `);

    // 3. Asociar detalles a cada venta
    const ventasConDetalles = ventas.map(venta => ({
      ...venta,
      detalles: detalles
        .filter(d => d.venta_id === venta.id)
        .map(d => ({
          nombre: d.nombre,
          descripcion: d.descripcion,
          marca: d.marca,
          cantidad: d.cantidad,
          precio: d.precio
        }))
    }));

    res.json(ventasConDetalles);
  } catch (err) {
    console.error("Error en /api/ventas:", err);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// Registrar compra
app.post('/api/compras', (req, res) => {
  let { proveedor_id, total, observaciones, productos } = req.body;
  if (!proveedor_id || proveedor_id === "" || proveedor_id === "null") {
    proveedor_id = null;
  }
  db.query(
    'INSERT INTO compras (proveedor_id, total, observaciones) VALUES (?, ?, ?)',
    [proveedor_id, total, observaciones],
    (err, result) => {
      if (err) {
        console.error("Error al registrar compra:", err);
        return res.status(500).json({ error: 'Error al registrar compra' });
      }
      const compra_id = result.insertId;
      const detalles = productos.map(p => [
        compra_id,
        p.id,
        p.cantidad,
        p.precio,
        p.observaciones || null // <-- agrega la observación de cada producto
      ]);
      db.query(
        'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, observaciones) VALUES ?',
        [detalles],
        (err2) => {
          if (err2) {
            console.error("Error al registrar detalle de compra:", err2);
            return res.status(500).json({ error: 'Error al registrar detalle de compra' });
          }
          // Sumar stock de cada producto comprado
          const updates = productos.map(p =>
            new Promise((resolve, reject) => {
              db.query(
                'UPDATE productos SET cantidad = cantidad + ? WHERE id = ?',
                [p.cantidad, p.id],
                (err3) => {
                  if (err3) reject(err3);
                  else resolve();
                }
              );
            })
          );
          Promise.all(updates)
            .then(() => res.json({ success: true, compra_id }))
            .catch(err3 => {
              console.error("Error al actualizar stock:", err3);
              res.status(500).json({ error: 'Error al actualizar stock' });
            });
        }
      );
    }
  );
});

// Obtener todas las compras
app.get('/api/compras', async (req, res) => {
  try {
    // 1. Traer todas las compras con datos completos del proveedor
    const [compras] = await db.promise().query(`
      SELECT c.id, c.fecha, c.total, IFNULL(p.nombre, 'Sin proveedor') as proveedor
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      ORDER BY c.fecha DESC
    `);

    // 2. Traer detalles de todas las compras
    const [detalles] = await db.promise().query(`
      SELECT dc.compra_id, dc.cantidad, dc.precio_unitario as precio, pr.nombre, dc.observaciones
      FROM detalle_compras dc
      JOIN productos pr ON dc.producto_id = pr.id
    `);

    // 3. Asociar detalles a cada compra
    const comprasConDetalles = compras.map(compra => ({
      ...compra,
      detalles: detalles
        .filter(d => d.compra_id === compra.id)
        .map(d => ({
          nombre: d.nombre,
          cantidad: d.cantidad,
          precio: d.precio,
          observaciones: d.observaciones
        }))
    }));

    res.json(comprasConDetalles);
  } catch (err) {
    console.error("Error en /api/compras:", err);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
});

// Ventas de motos sin trámite de patentamiento
app.get('/api/ventas-disponibles-patentamiento', (req, res) => {
  db.query(`
    SELECT 
      v.id, 
      v.fecha, 
      c.nombre as cliente_nombre, 
      c.apellido as cliente_apellido,
      pr.nombre as moto_nombre, 
      m.nombre as marca
    FROM ventas v
    JOIN detalle_ventas dv ON dv.venta_id = v.id
    JOIN productos pr ON dv.producto_id = pr.id
    LEFT JOIN marcas m ON pr.marca_id = m.id
    LEFT JOIN clientes c ON v.cliente_id = c.id
    WHERE pr.tipo = 'moto'
      AND v.id NOT IN (SELECT venta_id FROM patentamientos)
      AND v.cliente_id IS NOT NULL
    ORDER BY v.fecha DESC
  `, (err, results) => {
    if (err) {
      console.error("Error SQL ventas disponibles:", err);
      return res.status(500).json({ error: 'Error al obtener ventas disponibles' });
    }
    //console.log("Ventas disponibles para patentamiento:", results);
    res.json(results);
  });
});

// Crear trámite de patentamiento
app.post('/api/patentamientos', (req, res) => {
  const { venta_id, observaciones, numero_chasis, numero_motor, numero_certificado } = req.body;
  if (!venta_id) return res.status(400).json({ error: "Debe seleccionar una venta." });
  if (
    !numero_chasis || !numero_chasis.trim() ||
    !numero_motor || !numero_motor.trim() ||
    !numero_certificado || !numero_certificado.trim()
  ) {
    return res.status(400).json({ error: "Debe ingresar chasis, motor y certificado." });
  }

  function validarCampo(campo, nombre, min, max) {
    if (!campo || typeof campo !== "string" || !campo.trim()) {
      return `${nombre} es obligatorio.`;
    }
    if (campo.length < min || campo.length > max) {
      return `${nombre} debe tener entre ${min} y ${max} caracteres.`;
    }
    if (!/^[A-Za-z0-9\-\.]+$/.test(campo)) {
      return `${nombre} solo puede contener letras, números, guiones o puntos.`;
    }
    return null;
  }

  const errorChasis = validarCampo(numero_chasis, "Chasis", 10, 20);
  const errorMotor = validarCampo(numero_motor, "Motor", 5, 20);
  const errorCertificado = validarCampo(numero_certificado, "Certificado", 5, 30);

  if (errorChasis || errorMotor || errorCertificado) {
    return res.status(400).json({ error: errorChasis || errorMotor || errorCertificado });
  }

  // Validar unicidad de chasis y motor
  db.query(
    'SELECT id FROM motos_entregadas WHERE numero_chasis = ? OR numero_motor = ?',
    [numero_chasis, numero_motor],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al validar unicidad." });
      if (rows.length > 0) {
        return res.status(400).json({ error: "El número de chasis o motor ya está registrado." });
      }
      db.query('SELECT id FROM patentamientos WHERE venta_id = ?', [venta_id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error al validar trámite existente." });
        if (rows.length > 0) return res.status(400).json({ error: "Ya existe un trámite para esta venta." });
        db.query(
          'INSERT INTO patentamientos (venta_id, fecha_solicitud, observaciones) VALUES (?, CURDATE(), ?)',
          [venta_id, observaciones || null],
          (err2, result) => {
            if (err2) return res.status(500).json({ error: "Error al iniciar trámite." });
            const patentamiento_id = result.insertId;
            // Insertar datos únicos de la moto
            db.query(
              'INSERT INTO motos_entregadas (patentamiento_id, numero_chasis, numero_motor, numero_certificado) VALUES (?, ?, ?, ?)',
              [patentamiento_id, numero_chasis, numero_motor, numero_certificado],
              (err3) => {
                if (err3) return res.status(500).json({ error: "Error al registrar datos de la moto." });
                res.json({ success: true, id: patentamiento_id });
              }
            );
          }
        );
      });
    }
  );
});

// Listar trámites de patentamiento con datos de cliente y moto
app.get('/api/patentamientos', (req, res) => {
  db.query(`
    SELECT p.id, p.fecha_solicitud as fechaSolicitud, p.fecha_finalizacion as fechaFinalizacion, p.ultima_actualizacion as ultimaActualizacion,
           p.estado, p.observaciones,
           CONCAT(c.nombre, ' ', c.apellido) as cliente,
           CONCAT(marcas.nombre, ' ', productos.nombre) as moto
    FROM patentamientos p
    JOIN ventas v ON p.venta_id = v.id
    JOIN clientes c ON v.cliente_id = c.id
    JOIN detalle_ventas dv ON dv.venta_id = v.id
    JOIN productos ON dv.producto_id = productos.id
    LEFT JOIN marcas ON productos.marca_id = marcas.id
    WHERE productos.tipo = 'moto'
    ORDER BY p.fecha_solicitud DESC
  `, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener trámites' });
    res.json(results);
  });
});

// Actualizar estado de trámite de patentamiento y enviar email si es "Completado"
app.patch('/api/patentamientos/:id', (req, res) => {
  const { estado } = req.body;
  let query = 'UPDATE patentamientos SET estado=?, ultima_actualizacion=NOW()';
  let params = [estado];
  if (estado === 'Completado') {
    query += ', fecha_finalizacion=CURDATE()';
  }
  query += ' WHERE id=?';
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar trámite' });

    // Si el estado es "Completado", enviar email al cliente
    if (estado === 'Completado') {
      // Traer datos del cliente, moto y patentamiento
      db.query(`
        SELECT c.correo, c.nombre, c.apellido, marcas.nombre as marca, productos.nombre as moto,
               p.fecha_finalizacion, me.numero_chasis, me.numero_motor, me.numero_certificado
        FROM patentamientos p
        JOIN ventas v ON p.venta_id = v.id
        JOIN clientes c ON v.cliente_id = c.id
        JOIN detalle_ventas dv ON dv.venta_id = v.id
        JOIN productos ON dv.producto_id = productos.id
        LEFT JOIN marcas ON productos.marca_id = marcas.id
        LEFT JOIN motos_entregadas me ON me.patentamiento_id = p.id
        WHERE p.id = ? AND productos.tipo = 'moto'
        LIMIT 1
      `, [req.params.id], (err2, results) => {
        if (!err2 && results.length && results[0].correo) {
          const cliente = results[0];
          const fechaFinal = cliente.fecha_finalizacion
            ? new Date(cliente.fecha_finalizacion).toLocaleDateString()
            : "-";
          transporter.sendMail({
            from: '"Rider Motos" <ridermotos@gmail.com>',
            to: cliente.correo,
            subject: '¡Tu moto ya está patentada!',
            html: `
              <div style="font-family: Arial, sans-serif; color: #222; background: #f8f8f8; padding: 32px; border-radius: 12px; max-width: 520px; margin: auto;">
                <h2 style="color: #a32020; margin-bottom: 12px;">¡Tu moto ya está patentada!</h2>
                <p>Hola <b>${cliente.nombre} ${cliente.apellido}</b>,</p>
                <p>
                  Te informamos que el trámite de patentamiento de tu moto <b>${cliente.marca} ${cliente.moto}</b> ha sido <span style="color: #27ae60; font-weight: bold;">completado exitosamente</span> el día <b>${fechaFinal}</b>.
                </p>
                <div style="background: #fff; border-radius: 8px; padding: 18px 22px; margin: 18px 0; box-shadow: 0 2px 8px #0001;">
                  <h4 style="color: #a32020; margin-bottom: 10px;">Datos de tu moto:</h4>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li><b>Chasis:</b> ${cliente.numero_chasis || "-"}</li>
                    <li><b>Motor:</b> ${cliente.numero_motor || "-"}</li>
                    <li><b>Certificado:</b> ${cliente.numero_certificado || "-"}</li>
                  </ul>
                </div>
                <p style="margin-top: 18px;">¡Gracias por confiar en <b>Rider Motos</b>!<br>Estamos a tu disposición para cualquier consulta.</p>
                <hr style="margin: 28px 0 12px 0; border: none; border-top: 1px solid #eee;">
                <small style="color: #888;">Este es un mensaje automático, por favor no responder.</small>
              </div>
            `
          }, (errMail) => {
            return res.json({ success: true });
          });
        } else {
          // Si no hay correo, igual respondé éxito
          return res.json({ success: true });
        }
      });
    } else {
      res.json({ success: true });
    }
  });
});

app.post('/api/motos-entregadas', (req, res) => {
  const { patentamiento_id, numero_chasis, numero_motor, numero_certificado } = req.body;
  if (!patentamiento_id || !numero_chasis || !numero_motor || !numero_certificado) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }
  db.query(
    'INSERT INTO motos_entregadas (patentamiento_id, numero_chasis, numero_motor, numero_certificado) VALUES (?, ?, ?, ?)',
    [patentamiento_id, numero_chasis, numero_motor, numero_certificado],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error al registrar la moto entregada." });
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.get('/api/motos-entregadas/:patentamiento_id', (req, res) => {
  db.query(
    'SELECT numero_chasis, numero_motor, numero_certificado FROM motos_entregadas WHERE patentamiento_id = ?',
    [req.params.patentamiento_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Error al obtener datos de la moto." });
      if (!results.length) return res.status(404).json({ error: "No se encontraron datos para este trámite." });
      res.json(results[0]);
    }
  );
});

app.listen(3001, () => {
  console.log('API corriendo en http://localhost:3001');
});

console.log("Iniciando backend Rider Motos...");