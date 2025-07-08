# 🧾 invoices-mngmt – Backend API

Sistema de gestión de facturas y garantías con autenticación segura, validación robusta y almacenamiento en la nube.

## 🚀 Tecnologías

- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- JWT + Bcrypt
- Zod para validaciones
- Multer + Cloudinary para manejo de archivos

---

## 📁 Estructura del Proyecto

- Arquitectura modular

- src/
  - app.ts                # Configuración principal de Express
  - server.ts             # Punto de entrada del servidor
  - config/
    - prisma.ts           # Cliente de Prisma
  - routes/
    - index.ts            # Rutas principales
  - modules/
    - auth/               # Módulo de autenticación
    - invoices/           # Módulo de facturas
    - warranties/         # Módulo de garantías
  - shared/
    - middleware/
      - errorHandler.ts   # Middleware para manejo de errores
    - utils/
      - AppError.ts       # Clase de error personalizada

- prisma/
  - schema.prisma         # Modelo de base de datos

---

## 🔐 Autenticación

- Registro: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Validación con Zod
- Contraseñas encriptadas con Bcrypt
- Tokens JWT
- Ruta protegida: `GET /api/auth/me`

---

## 🧾 Facturas (`/api/invoices`)

- `POST /`: Crear factura (requiere token y archivo PDF/XML/JPG)
- `GET /`: Listar facturas del usuario
- `GET /:id`: Obtener factura específica
- `DELETE /:id`: Eliminar factura
- Archivos subidos a Cloudinary (`resource_type: raw`)
- Validación con Zod
- Asociación automática con `userId`

---

## 🛠️ Garantías (`/api/warranties`)

- `POST /`: Crear garantía asociada a factura
- `GET /:invoiceId`: Obtener garantía
- `PUT /:invoiceId`: Actualizar garantía
- `DELETE /:invoiceId`: Eliminar garantía
- Relación 1:1 con factura
- Validación con Zod

---

## ☁️ Subida de Archivos

- Archivos recibidos vía `form-data` con Multer
- Convertidos a base64 y subidos a Cloudinary
- Soporte para PDF, XML, JPG
- Configuración de Cloudinary:
  - `resource_type: "raw"`
  - `overwrite: true`
  - Activada opción: “Allow delivery of PDF and ZIP files”

---

## 🧪 Scripts

```bash
npm run dev       # Desarrollo con recarga
npm run build     # Compilación TypeScript
npm run start     # Producción
npx prisma ...    # Comandos Prisma

## 💻 Instalación y uso local

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/invoices_mngmt.git
cd invoices_mngmt/backend

2. Instala dependencias:
```bash
npm install

3. Configura variables de entorno:
```bash
DATABASE_URL=postgresql://usuario:password@localhost:5432/facturas_db
JWT_SECRET=tu_clave_secreta
SALT_ROUNDS=10
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

4. Ejecuta migraciones:
```bash
npx prisma migrate dev --name init

5. Iniciar servidor:
```bash
npm run dev

## 📖 Documentación de la API

- Pronto estará disponible una colección de Postman o documentación Swagger con todos los endpoints.

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Libre para uso, modificación y distribución con atribución.

## 🙋‍♂️ Autor

Desarrollado por Mario Quirós  
[https://github.com/MQuirosP]
