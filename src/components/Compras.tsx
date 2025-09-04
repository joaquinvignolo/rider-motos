import React from "react";
import "./Compras.css";

export default function Compras() {
  return (
    <div className="compras-container">
      {/* Motos */}
      <div className="compras-card">
        <h2>Agregar Moto</h2>
        <label>Nombre de la moto:</label>
        <input type="text" />
        <label>Precio:</label>
        <input type="number" />
        <label>Marca:</label>
        <select>
          <option>Seleccionar marca</option>
        </select>
        <label>Descripción:</label>
        <input type="text" />
        <label>Stock total:</label>
        <input type="number" min={0} />
        <div className="compras-btns">
          <button>Agregar</button>
          <button className="cancelar">Cancelar</button>
        </div>
      </div>
      {/* Accesorios */}
      <div className="compras-card">
        <h2>Agregar Accesorio</h2>
        <label>Nombre del accesorio:</label>
        <input type="text" />
        <label>Precio:</label>
        <input type="number" />
        <label>Marca:</label>
        <select>
          <option>Seleccionar marca</option>
        </select>
        <label>Descripción:</label>
        <input type="text" />
        <label>Stock total:</label>
        <input type="number" min={0} />
        <div className="compras-btns">
          <button>Agregar</button>
          <button className="cancelar">Cancelar</button>
        </div>
      </div>
      {/* Repuestos */}
      <div className="compras-card">
        <h2>Agregar Repuesto</h2>
        <label>Nombre del repuesto:</label>
        <input type="text" />
        <label>Precio:</label>
        <input type="number" />
        <label>Marca:</label>
        <select>
          <option>Seleccionar marca</option>
        </select>
        <label>Descripción:</label>
        <input type="text" />
        <label>Proveedor:</label>
        <select>
          <option>Seleccionar proveedor</option>
        </select>
        <label>Stock total:</label>
        <input type="number" min={0} />
        <div className="compras-btns">
          <button>Agregar</button>
          <button className="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  );
}