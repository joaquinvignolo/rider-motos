const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

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

  db.query('SELECT id FROM marcas WHERE nombre = ?', [marca], (err, marcaRows) => {
    if (err || marcaRows.length === 0) return res.status(400).json({ error: 'Marca no encontrada' });
    const marca_id = marcaRows[0].id;

    if (tipo === 'repuesto' && proveedor) {
      db.query('SELECT id FROM proveedores WHERE nombre = ?', [proveedor], (err2, provRows) => {
        if (err2 || provRows.length === 0) return res.status(400).json({ error: 'Proveedor no encontrado' });
        const proveedor_id = provRows[0].id;
        db.query(
          'INSERT INTO productos (nombre, descripcion, precio, cantidad, marca_id, proveedor_id, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nombre, descripcion, precio, cantidad, marca_id, proveedor_id, tipo],
          (err3, result) => {
            if (err3) return res.status(500).json({ error: 'Error al agregar producto' });
            res.json({ success: true, id: result.insertId });
          }
        );
      });
    } else {
      // Para motos y accesorios (sin proveedor)
      db.query(
        'INSERT INTO productos (nombre, descripcion, precio, cantidad, marca_id, tipo) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, descripcion, precio, cantidad, marca_id, tipo],
        (err3, result) => {
          if (err3) return res.status(500).json({ error: 'Error al agregar producto' });
          res.json({ success: true, id: result.insertId });
        }
      );
    }
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
  const activo = Number(cantidad) > 0 ? 1 : 0; // Determina si el producto está activo según la cantidad

  db.query('SELECT id FROM marcas WHERE nombre = ?', [marca], (err, marcaRows) => {
    if (err || marcaRows.length === 0) return res.status(400).json({ error: 'Marca no encontrada' });
    const marca_id = marcaRows[0].id;

    if (tipo === 'repuesto' && proveedor) {
      db.query('SELECT id FROM proveedores WHERE nombre = ?', [proveedor], (err2, provRows) => {
        if (err2 || provRows.length === 0) return res.status(400).json({ error: 'Proveedor no encontrado' });
        const proveedor_id = provRows[0].id;
        db.query(
          'UPDATE productos SET nombre=?, descripcion=?, precio=?, cantidad=?, marca_id=?, proveedor_id=?, tipo=?, activo=? WHERE id=?',
          [nombre, descripcion, precio, cantidad, marca_id, proveedor_id, tipo, activo, req.params.id],
          (err3) => {
            if (err3) return res.status(500).json({ error: 'Error al editar producto' });
            res.json({ success: true });
          }
        );
      });
    } else {
      db.query(
        'UPDATE productos SET nombre=?, descripcion=?, precio=?, cantidad=?, marca_id=?, proveedor_id=NULL, tipo=?, activo=? WHERE id=?',
        [nombre, descripcion, precio, cantidad, marca_id, tipo, activo, req.params.id],
        (err3) => {
          if (err3) return res.status(500).json({ error: 'Error al editar producto' });
          res.json({ success: true });
        }
      );
    }
  });
});

// Obtener clientes. solo activos por defecto
app.get('/api/clientes', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM clientes WHERE activo=1';
  let params = [];
  if (search) {
    sql += ' AND (nombre LIKE ? OR apellido LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
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
  console.log("Datos recibidos en /api/ventas:", req.body);
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
            .then(() => res.json({ success: true, venta_id }))
            .catch(err3 => {
              console.error("Error al actualizar stock:", err3);
              res.status(500).json({ error: 'Error al actualizar stock' });
            });
        }
      );
    }
  );
});

app.listen(3001, () => {
  console.log('API corriendo en http://localhost:3001');
});

console.log("Iniciando backend Rider Motos...");