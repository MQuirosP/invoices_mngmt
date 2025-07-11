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

- src/
  - app.ts                    # Configuración principal de Express
  - server.ts                 # Punto de entrada del servidor
  - config/
    - prisma.ts               # Cliente de Prisma
  - routes/
    - index.ts                # Rutas principales
  - modules/
    - auth/                   # Módulo de autenticación
    - invoice/               # Módulo de facturas
    - warranty/             # Módulo de garantías
  - shared/
    - middleware/
      - errorHandler.ts       # Middleware para manejo de errores
      - upload.ts             # Middleware para subida de archivos
    - services/
      - cloudinary.service.ts # Servicio para subir a cloudinary
      - fileFetcher.service.ts# Servicio para obtener archivos
      - import.service.ts     # Servicio para actualizar facturas
      - ocr.service.ts        # Servicio para reconocimiento OCR
    - utils/
      - AppError.ts           # Clase de error personalizada
      - extractMetadata.ts    # Utilidad para procesar texto extraído por OCR

- prisma/
  - schema.prisma             # Modelo de base de datos

---

## Autenticación

- `POST /api/auth/register` – Registro de usuario  
- `POST /api/auth/login` – Inicio de sesión  
- `GET /api/auth/me` – Ruta protegida para obtener datos del usuario  
- Validación con Zod  
- Contraseñas encriptadas con Bcrypt  
- Tokens JWT  

---

## Facturas (`/api/invoices`)

- `POST /` – Crear factura (requiere token y archivo PDF/XML/JPG)  
- `GET /` – Listar facturas del usuario  
- `GET /:id` – Obtener factura específica  
- `DELETE /:id` – Eliminar factura  
- Archivos subidos a Cloudinary (`resource_type: raw`)  
- Validación con Zod  
- Asociación automática con `userId`  

### Descarga de facturas

- `GET /api/invoices/:id/download`  
  - Protegido por JWT  
  - Usa `axios` para obtener el archivo desde Cloudinary  
  - Enviado al cliente como `stream`  

- `GET /api/invoices/:invoiceId/attachments/:attachmentId/download`  
  - Descarga individual por ID de archivo adjunto  
  - Verifica que el archivo pertenezca a la factura y al usuario  
  - Devuelve stream seguro con headers adecuados  

- Headers:
  - `Content-Disposition: attachment; filename="<titulo>.<ext>"`  
  - `Content-Type` dinámico  

- Beneficios:
  - No se expone la URL de Cloudinary  
  - Forza descarga en navegador  
  - Control de acceso total  

---

## Importación por OCR (`/api/invoices/import`)

- `POST /api/invoices/import` – Importa factura desde URL (PDF/JPG)  
- Requiere token de autenticación  
- Procesa el archivo remoto con Google Cloud Vision API  
- Extrae texto OCR y lo interpreta para crear automáticamente:
  - La factura (`title`, `issueDate`, `expiration`, `provider`)
  - La garantía si se infiere duración (`duration`, `validUntil`)
  - Un attachment con el archivo subido a Cloudinary

- Validación extra para asegurar que la URL de attachment pertenezca a la factura (prevención de accesos inválidos)

- Lógica encapsulada en el módulo `imports/` (servicio y controlador)
- Utiliza utilidad `extractMetadataFromText()` para analizar el contenido extraído

- OCR sobre archivo ya subido también implementado:
  - `POST /api/invoices/:id/import`
  - Extrae texto desde attachment existente y actualiza la factura
  - Marca `extracted: true`

---

## Garantías (`/api/warranties`)

- `POST /` – Crear garantía asociada a factura  
- `GET /:invoiceId` – Obtener garantía  
- `PUT /:invoiceId` – Actualizar garantía  
- `DELETE /:invoiceId` – Eliminar garantía  
- Relación 1:1 con factura  
- Validación con Zod  

---

## Subida de Archivos

- Archivos recibidos vía `form-data` con Multer  
- Convertidos a base64 y subidos a Cloudinary  
- Soporte para PDF, XML, JPG, PNG  
- Configuración de Cloudinary:
  - `resource_type: "raw"`  
  - `overwrite: true`  
  - Activada opción: “Allow delivery of PDF and ZIP files”  

### Validación de tipo MIME

- Solo permite: `application/pdf`, `application/xml`, `text/xml`, `image/jpeg`, `image/jpg`, `image/png`  
- Rechaza otros tipos con error 415  
- Tamaño máximo: 5 MB  
- Seguridad reforzada en la carga  

---

## Consideraciones

- Se mantiene `fileType` para determinar la extensión esperada  
- El nombre del archivo se genera desde `title` de la factura  
- Descarga ahora permite seleccionar un archivo específico por ID  
- Posibilidad futura: descargar todos como archivo ZIP  
- OCR habilitado para automatizar ingreso de facturas desde imagen o PDF  
- Validación de ownership implementada en importación y descarga  

---

## Scripts

```bash
npm run dev       # Desarrollo con recarga
npm run build     # Compilación TypeScript
npm run start     # Producción
npx prisma ...    # Comandos Prisma
```

---

## 💻 Instalación y uso local

### Clona el repositorio

```bash
git clone https://github.com/tu-usuario/invoices_mngmt.git
cd invoices_mngmt/backend
```

### Instala dependencias

```bash
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

## 📖 Documentación de la API

- Pronto estará disponible una colección de Postman o documentación Swagger con todos los endpoints.

---

## 📝 Licencia

- Este proyecto está bajo la licencia MIT. Libre para uso, modificación y distribución con atribución.

---

## 🙋‍♂️ Autor

### Desarrollado por Mario Quirós

```bash
<https://github.com/MQuirosP>
```
