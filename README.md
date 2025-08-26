
# Invoices Management API

A RESTful API built with Node.js, Express, TypeScript, Prisma, and PostgreSQL for managing invoices and warranties. This API features secure authentication, robust validation, and cloud storage integration.

## Project Goals

* Provide a secure and reliable API for managing invoices and warranties.
* Enable efficient data validation and storage.
* Facilitate automated invoice processing using OCR technology.
* Offer a modular and maintainable codebase.

---

## Technologies Used

[![Node.js](https://img.shields.io/badge/Node.js-%3E=18.0.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-Routing--Layer-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict--Types-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM--Auditable-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Relational--DB-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-Token--Based--Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Bcrypt](https://img.shields.io/badge/Bcrypt-Password--Hashing-F2B300?style=flat-square&logoColor=black)](https://github.com/kelektiv/node.bcrypt.js)
[![Zod](https://img.shields.io/badge/Zod-Strict--Validation-3f3f3f?style=flat-square)](https://zod.dev/)
[![Multer](https://img.shields.io/badge/Multer-File--Upload--Middleware-3f3f3f?style=flat-square)](https://github.com/expressjs/multer)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Asset--Storage-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Google Cloud Vision](https://img.shields.io/badge/Google--Vision-OCR--API-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/vision)

---

## API Documentation

### Authentication Endpoints (`/api/auth`)

* **Register:** `POST /api/auth/register`

    > Request:

    json
    {
        "message": "User registered successfully",
        "user": {
            "id": "user_id",
            "email": "<user@example.com>"
        }
    }
  * **Get Authenticated User:** `GET /api/auth/me`

    > Request:
    > Headers: `Authorization: Bearer <token>`
    > Response:

json
    {
        "id": "user_id",
        "email": "<user@example.com>"
    }
        > Request (with file upload):
    > Headers: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

json
    {
        "id": "invoice_id",
        "provider": "Example Provider",
        "title": "Invoice Title",
        "issueDate": "2024-01-01",
        "attachments": []
    }
        > Request:
    > Headers: `Authorization: Bearer <token>`

    > Response:

    > Request:
    > Headers: `Authorization: Bearer <token>`

    > Response:

    ```json
        {
            "id": "invoice_id",
            "provider": "Example Provider",
            "title": "Invoice Title",
            "issueDate": "2024-01-01",
            "attachments": [
                {
                    "id": "attachment_id",
                    "filename": "invoice.pdf",
                    "url": "cloudinary_url"
                }
            ],
            "warranty":{
                "id": "warranty_id",
                "duration": "2 years"
            }
        }

    ```
    
        > Request:
    > Headers: `Authorization: Bearer <token>`

    > Response:

        > Downloads the specified attachment

    > *Authentication Required:* Yes, using JWT.

* **Import Invoice via OCR:** `POST /api/invoices/import`

    > Request:
    > Headers: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

form-data
    ```json
        {
        "invoiceFile": &lt;File Object&gt;
        }

    *   **`modules/`**: Contains feature-specific modules like `auth` and `invoice`.

* **`shared/`**: Includes reusable components such as `middleware`, `OCR`, and `services`.
* **`config/`**: Configuration files for Prisma, Cloudinary, and environment variables.
* **`prisma/`**: Prisma schema and migrations.
* **`src/app.ts`**: Main application entry point.

bash
    git clone <https://github.com/MQuirosP/invoices_mngmt.git>
    cd invoices_mngmt/backend
    env
    DATABASE_URL="postgresql://user:password@localhost:5432/invoices_db"
    JWT_SECRET="your_secret_key"
    SALT_ROUNDS=10
    CLOUDINARY_CLOUD_NAME="your_cloud_name"
    CLOUDINARY_API_KEY="your_api_key"
    CLOUDINARY_API_SECRET="your_api_secret"
    GOOGLE_APPLICATION_CREDENTIALS="./path/to/your-ocr-key.json"
    *   **Multer:** Used for handling file uploads. Configured with `memoryStorage` to store files in memory before uploading to Cloudinary.

* **Cloudinary:** Used for storing and managing file attachments.
* **MIME Type Validation:** Implemented using `file-type` to validate the MIME type of uploaded files.

> Example of MIME type validation middleware:

    ``` ts
        import { validateRealMime } from './shared/utils/file/validateRealMime';

        const uploadMiddleware = (req, res, next) => {
            if (req.file) {
                const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
                const isValidMime = validateRealMime(req.file, validMimeTypes);

                if (!isValidMime) {
                    return next(new Error('Invalid MIME type'));
                }
            }
            next();
        };

    ```

The project uses Google Cloud Vision for OCR (Optical Character Recognition) to automatically extract data from invoice images.

* **OCR Factory:** The `OCRFactory` class in `shared/ocr/ocr.factory.ts` is responsible for creating OCR provider instances.
* **Providers:** Supports multiple OCR providers, including Google Cloud Vision and Tesseract.
* **Automatic Import:** The `/api/invoices/import` endpoint uses the OCR service to extract text from uploaded invoice images and create invoice records.

> Example of OCR configuration:

    ``` ts
        // config/index.ts
        export const config = {
        ocrProvider: process.env.OCR_PROVIDER || 'gcp', // Default to Google Cloud Vision
        };

        // shared/ocr/ocr.factory.ts
        import { GoogleCloudVision } from './ocr.providers/gcp';
        import { TesseractOCR } from './ocr.providers/tesseract';

        export class OCRFactory {
            static create(providerName: string) {
                switch (providerName) {
                    case 'gcp':
                        return new GoogleCloudVision();
                    case 'tesseract':
                        return new TesseractOCR();
                    default:
                        throw new Error('Invalid OCR provider');
                }
            }
        }

        // src/modules/invoice/invoice.schema.ts
        import { z } from 'zod';

        export const createInvoiceSchema = z.object({
            body: z.object({
                provider: z.string().min(1),
                title: z.string().min(1),
                issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            }),
        });

        // src/modules/invoice/invoice.controller.test.ts
        import { createInvoice } from './invoice.controller';
        import { Request, Response } from 'express';

        describe('Invoice Controller', () => {
        it('should create an invoice', async () => {
            const mockRequest = {} as Request;
            const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            } as unknown as Response;

            await createInvoice(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalled();
        });
        });

    ```

[![GitHub](https://img.shields.io/github/followers/MQuirosP?style=social)](https://github.com/MQuirosP)
[![GitHub](https://img.shields.io/badge/GitHub-invoices_mngmt-3f3f3f?style=flat-square&logo=github&logoColor=white)](https://github.com/MQuirosP/invoices_mngmt)
[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/MQuirosP/invoices_mngmt)
[![Audit Ready](https://img.shields.io/badge/Audit--Ready-Strict--Validation-3f3f3f?style=flat-square)](https://github.com/MQuirosP/invoices_mngmt)
[![Modular Core](https://img.shields.io/badge/Architecture-Modular--Core-3f3f3f?style=flat-square)](https://github.com/MQuirosP/invoices_mngmt)
[![Build Status](https://img.shields.io/badge/Build-Passing-3f3f3f?style=flat-square&logo=githubactions)](https://github.com/MQuirosP/invoices_mngmt/actions)
[![Coverage](https://img.shields.io/badge/Coverage-100%25-3f3f3f?style=flat-square)](https://github.com/MQuirosP/invoices_mngmt)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=18.0.0-3f3f3f?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM--Strict-3f3f3f?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Backoff--Events--Tracing-3f3f3f?style=flat-square&logo=redis)](https://redis.io/)

---

## Contributing

    - Follow conventional commits
    - Ensure all tests pass before PR
