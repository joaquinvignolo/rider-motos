import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Login from './components/Login';
import MenuPrincipal from './components/MenuPrincipal';
import Productos from './components/Productos';
import Ventas from './components/Ventas';
import Clientes from './components/Clientes';
import Reportes from './components/Reportes';
import RutaPrivada from './components/RutaPrivada'; 
import Compras from './components/Compras';
import Patentamiento from './components/Patentamiento';
import Proveedores from './components/Proveedores';


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
        <Route path="/compras" element={
          <RutaPrivada>
            <Compras />
          </RutaPrivada>
        } />
        <Route path="/patentamientos" element={
          <RutaPrivada>
            <Patentamiento />
          </RutaPrivada>
        } />
        <Route path="/proveedores" element={
          <RutaPrivada>
            <Proveedores />
          </RutaPrivada>
        } />
      </Routes>
    </Router>
  );
}

export default App;