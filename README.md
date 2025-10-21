# Rider Motos - Sistema de Gestión

Sistema integral para gestionar ventas, compras, inventario y patentamientos de una concesionaria de motos.

## 🚀 Despliegue en Producción

- **Frontend (React + Vite):** https://rider-motos-ten.vercel.app
- **Backend (Node.js + Express):** https://rider-motos.onrender.com
- **Base de Datos:** MySQL en Railway

## 🛠️ Tecnologías

### Frontend
- React 18
- Vite
- React Router
- Axios
- CSS Modules

### Backend
- Node.js
- Express
- MySQL2
- PDFKit
- Nodemailer

### Base de Datos
- MySQL 8.4
- Railway

## 📦 Estructura del Proyecto

```
rider-motos/
├── src/              # Frontend React
├── backend/          # Backend Express
└── database/         # Scripts SQL
```

## ⚙️ Variables de Entorno

### Frontend (Vercel)
- `VITE_API_URL`: URL del backend

### Backend (Render)
- `DB_HOST`: Host de MySQL (Railway)
- `DB_USER`: Usuario de MySQL
- `DB_PASSWORD`: Contraseña de MySQL
- `DB_NAME`: Nombre de la base de datos
- `DB_PORT`: Puerto de MySQL
- `NODE_ENV`: production
- `FRONTEND_URL`: URL del frontend (para CORS)
- `PORT`: 10000

## 🔧 Desarrollo Local

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
node index.js
```

## 📝 Notas

- El backend está desplegado en **Render** (en lugar de Vercel serverless) debido a las conexiones persistentes de MySQL y operaciones de larga duración (PDFs, emails).
- Primera carga del backend puede tardar 30-60 segundos (Render Free Tier hiberna después de 15 minutos de inactividad).

## 👥 Equipo

- [Vignolo Joaquín y Ceballos Genaro]
- [Rider Motos]