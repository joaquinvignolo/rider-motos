import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Login from './components/Login';
import MenuPrincipal from './components/MenuPrincipal';
import Productos from './components/Productos';
import Ventas from './components/Ventas'; // Agrega esta línea


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<MenuPrincipal />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/ventas" element={<Ventas />} /> {/* Agrega esta línea */}
      </Routes>
    </Router>
  );
}

export default App;