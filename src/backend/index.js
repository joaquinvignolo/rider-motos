// backend/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configura tu conexión MySQL
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
  const { tipo } = req.query;
  let sql = 'SELECT p.id, p.nombre, p.descripcion, p.precio, p.cantidad, m.nombre as marca, pr.nombre as proveedor, p.tipo FROM productos p LEFT JOIN marcas m ON p.marca_id = m.id LEFT JOIN proveedores pr ON p.proveedor_id = pr.id';
  const params = [];
  if (tipo) {
    sql += ' WHERE p.tipo = ?';
    params.push(tipo);
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

// Eliminar producto
app.delete('/api/productos/:id', (req, res) => {
  db.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
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

    if (tipo === 'repuesto' && proveedor) {
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
    } else {
      db.query(
        'UPDATE productos SET nombre=?, descripcion=?, precio=?, cantidad=?, marca_id=?, proveedor_id=NULL, tipo=? WHERE id=?',
        [nombre, descripcion, precio, cantidad, marca_id, tipo, req.params.id],
        (err3) => {
          if (err3) return res.status(500).json({ error: 'Error al editar producto' });
          res.json({ success: true });
        }
      );
    }
  });
});

app.listen(3001, () => {
  console.log('API corriendo en http://localhost:3001');
});

console.log("Iniciando backend Rider Motos...");