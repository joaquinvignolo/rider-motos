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

app.listen(3001, () => {
  console.log('API corriendo en http://localhost:3001');
});

console.log("Iniciando backend Rider Motos...");