# invoices-mngmt – Backend API

Sistema de gestión de facturas y garantías con autenticación segura, validación robusta y almacenamiento en la nube.

---

## Tecnologías

- Node.js + Express  
- TypeScript  
- Prisma ORM + PostgreSQL  
- JWT + Bcrypt  
- Zod para validaciones  
- Multer + Cloudinary para manejo de archivos  
- Google Cloud Vision API para OCR

---

## Estructura del Proyecto

- Arquitectura modular

## mquirosp-invoices_mngmt

```bash
└──
    ├── README.md
    ├── CHANGELOG.md
    ├── LICENSE
    ├── render.yaml
    ├── backend/
    │   ├── global.d.ts
    │   ├── jest.config.ts
    │   ├── package.json
    │   ├── prisma-to-xata.sql
    │   ├── tsconfig.build.json
    │   ├── tsconfig.dev.json
    │   ├── tsconfig.json
    │   ├── tsconfig.test.json
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   │       ├── migration_lock.toml
    │   │       ├── 20250706235007_init/
    │   │       │   └── migration.sql
    │   │       ├── 20250708025655_rename_extrated_to_extracted/
    │   │       │   └── migration.sql
    │   │       ├── 20250709024520_add_attachments_model/
    │   │       │   └── migration.sql
    │   │       ├── 20250709025629_remove_file_fields/
    │   │       │   └── migration.sql
    │   │       ├── 20250713222846_add_cascade_attachment_model/
    │   │       │   └── migration.sql
    │   │       ├── 20250713223153_add_cascade_warranty_model/
    │   │       │   └── migration.sql
    │   │       ├── 20250715210145_add_user_role/
    │   │       │   └── migration.sql
    │   │       ├── 20250726230951_add_invoice_items/
    │   │       │   └── migration.sql
    │   │       └── 20250730235818_add_item_warranty_fields/
    │   │           └── migration.sql
    │   └── src/
    │       ├── app.ts
    │       ├── server.ts
    │       ├── cache/
    │       │   └── userCache.ts
    │       ├── config/
    │       │   ├── cloudinary.ts
    │       │   ├── index.ts
    │       │   ├── prisma.ts
    │       │   └── validateEnv.ts
    │       ├── lib/
    │       │   └── redis.ts
    │       ├── modules/
    │       │   ├── auth/
    │       │   │   ├── auth.controller.ts
    │       │   │   ├── auth.middleware.ts
    │       │   │   ├── auth.routes.ts
    │       │   │   ├── auth.schema.ts
    │       │   │   ├── auth.service.ts
    │       │   │   ├── auth.types.ts
    │       │   │   └── index.ts
    │       │   └── invoice/
    │       │       ├── index.ts
    │       │       ├── invoice.controller.ts
    │       │       ├── invoice.query.ts
    │       │       ├── invoice.routes.ts
    │       │       ├── invoice.schema.ts
    │       │       ├── invoice.service.ts
    │       │       └── invoiceItems.schema.ts
    │       ├── routes/
    │       │   └── index.ts
    │       └── shared/
    │           ├── index.ts
    │           ├── constants/
    │           │   ├── mimeExtensionMap.ts
    │           │   └── roles.ts
    │           ├── middleware/
    │           │   ├── errorHandler.ts
    │           │   ├── rateLimiter.ts
    │           │   ├── requireRole.ts
    │           │   ├── upload.ts
    │           │   └── validateParams.ts
    │           ├── ocr/
    │           │   ├── index.ts
    │           │   ├── ocr.factory.ts
    │           │   ├── ocr.types.ts
    │           │   ├── preprocessing.ts
    │           │   ├── extractors/
    │           │   │   ├── extractIssueDate.ts
    │           │   │   ├── extractItems.ts
    │           │   │   ├── extractMetadata.ts
    │           │   │   ├── extractProvider.ts
    │           │   │   ├── extractTitle.ts
    │           │   │   ├── extractWarranty.ts
    │           │   │   └── index.ts
    │           │   ├── ocr.providers/
    │           │   │   ├── aws.ts
    │           │   │   ├── gcp.ts
    │           │   │   └── tesseract.ts
    │           │   └── patterns/
    │           │       ├── index.ts
    │           │       ├── matchers.ts
    │           │       └── regex.ts
    │           ├── services/
    │           │   ├── attachment.service.ts
    │           │   ├── cache.service.ts
    │           │   ├── cloudinary.service.ts
    │           │   ├── fileFetcher.service.ts
    │           │   └── import.service.ts
    │           └── utils/
    │               ├── AppError.utils.ts
    │               ├── hashPassword.ts
    │               ├── logger.ts
    │               ├── requireUserId.ts
    │               └── file/
    │                   ├── generateRandomFilename.ts
    │                   ├── getFileExtension.ts
    │                   └── validateRealMime.ts
└── .github/
    └── workflows/
        └── keep-alive.yml

```

## 🔐 Autenticación

- Registro: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Datos autenticados: `GET /api/auth/me`

Características:

- Validación con Zod
- Contraseñas hasheadas con bcrypt
- JWT con `sub`, `email`, expiración segura
- Middleware `authenticate` para proteger rutas

---

## 🧾 Gestión de facturas (`/api/invoices`)

- `POST /` → Crear factura con o sin archivos
- `GET /` → Listar facturas propias
- `GET /:id` → Obtener detalle
- `DELETE /:id` → Borrar factura y sus archivos

- ✅ Incluye adjuntos (`attachments`) y garantía (`warranty`) en las respuestas  
- ✅ Validación MIME declarada + real (buffer)

---

## 📎 Archivos adjuntos (Attachments)

- Multer configurado con `memoryStorage`
- Validación MIME binaria con `file-type`
- Tipos permitidos: PDF, XML, JPG, PNG
- Tamaño máximo: 5MB
- Subida directa a Cloudinary (`resource_type: raw`)
- Nombre generado aleatoriamente (`generateRandomFilename`)
- Registrados en la base como `Attachment` con metadata

### 📥 Descargas

- `GET /api/invoices/:id/download` → Descarga principal
- `GET /api/invoices/:invoiceId/attachments/:attachmentId/download` → Descarga por archivo

- 🔐 Verifica propiedad del usuario  
- 📎 Descarga como `stream` con `Content-Disposition` seguro  
- 🌐 No se expone la URL pública de Cloudinary

---

## 🧠 Importación automática con OCR (`/api/invoices/import`)

- OCR desde buffer o URL (`Vision API`, `Tesseract`)
- Extrae texto y genera factura + garantía + attachment
- Servicios desacoplados (`OCRFactory`, `ImportService`)
- Validación MIME antes de procesar OCR
- OCR también disponible sobre archivo existente (`POST /:id/import-url`)

---

## ⏳ Gestión de garantías (`/api/warranties`)

---

## 🧪 Testing y calidad

- Unit tests con Jest (`invoice.controller.test.ts`)
- Supertest para integración de OCR y subida
- Validación de errores, cobertura de casos límite

---

## 📖 Documentación

- ✅ OCR modular con fallback y configuración vía `.env`
- ✅ Refactor para servicios de attachments centralizados
-- ZIP de múltiples archivos  
-- Paginación y filtros en listado  
-- Endpoint PATCH parcial  
-- Dashboard API para métricas  
-- UI mínima en React/Vite  
-- OCR para PDFs en Google Cloud Storage  
-- Swagger completo y colección Postman pública

---

## Scripts

```bash
npm run dev       # Desarrollo con recarga
npm run build     # Compilación TypeScript
npm run start     # Producción
npx prisma ...    # Comandos Prisma
```

---

``` bash

npm install

```

### Configura variables de entorno

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/facturas_db
JWT_SECRET=tu_clave_secreta
SALT_ROUNDS=10
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GOOGLE_APPLICATION_CREDENTIALS=./ruta/clave-ocr.json
```

### Ejecuta migraciones

```bash
npx prisma migrate dev --name init
```

### Inicia el servidor

```bash
npm run dev
```

---

---

## 📝 Licencia

- Este proyecto está bajo la licencia MIT. Libre para uso, modificación y distribución con atribución.

---

## 🙋‍♂️ Autor

### Desarrollado por Mario Quirós

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/MQuirosP/invoices_mngmt)

[![Repositorio en GitHub](https://img.shields.io/badge/GitHub-invoices_mngmt-3f3f3f?logo=github&logoColor=white)](https://github.com/MQuirosP/invoices_mngmt)
