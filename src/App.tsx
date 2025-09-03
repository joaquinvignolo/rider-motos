import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Login from './components/Login';
import MenuPrincipal from './components/MenuPrincipal';
import Productos from './components/Productos';
import Ventas from './components/Ventas';
import Clientes from './components/Clientes';
import Reportes from './components/Reportes';
import RutaPrivada from './components/RutaPrivada'; 


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={
          <RutaPrivada>
            <MenuPrincipal />
          </RutaPrivada>
        } />
        <Route path="/productos" element={
          <RutaPrivada>
            <Productos />
          </RutaPrivada>
        } />
        <Route path="/ventas" element={
          <RutaPrivada>
            <Ventas />
          </RutaPrivada>
        } />
        <Route path="/clientes" element={
          <RutaPrivada>
            <Clientes />
          </RutaPrivada>
        } />
        <Route path="/reportes" element={
          <RutaPrivada>
            <Reportes />
          </RutaPrivada>
        } />
      </Routes>
    </Router>
  );
}

export default App;