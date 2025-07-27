/// <reference types="jest" />

import { importFromUrl } from '../invoice.controller';
import { AuthRequest } from '../../auth/auth.middleware';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Response, NextFunction } from 'express';
import * as InvoiceService from '@/modules/invoice/invoice.service';

describe('Invoice Controller: importFromUrl', () => {
  let req: AuthRequest;
  let res: Response;
  let next: NextFunction;

  const mockInvoice = {
    id: 'inv-id-123',
    userId: 'user-id-456',
    title: 'Factura de prueba',
    issueDate: new Date(),
    expiration: new Date(),
    provider: 'Proveedor S.A.',
    extracted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: [
      {
        id: 'att-id-1',
        invoiceId: 'inv-id-123',
        url: 'http://example.com/file.pdf',
        mimeType: 'application/pdf',
        fileName: 'factura.pdf',
        createdAt: new Date(),
      },
    ],
    warranty: {
      id: 'warranty-id-1',
      invoiceId: 'inv-id-123',
      duration: 365,
      notes: null,
      validUntil: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [
  {
    id: "item-id-1",
    invoiceId: "inv-id-123",
    description: "Producto A",
    quantity: 2,
    unitPrice: 1500,
    total: 3000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { res: mockRes, next: mockNext } = getMockRes();
    res = mockRes;
    next = mockNext;
  });

  it('should successfully import from a URL and return 201 status', async () => {
    const mockUrl = 'http://example.com/invoice.pdf';
    const mockInvoiceId = 'inv-id-123';
    const mockUserId = 'user-id-456';

    req = getMockReq({
      body: { url: mockUrl },
      params: { invoiceId: mockInvoiceId },
      user: { id: mockUserId },
    }) as AuthRequest;

    const spy = jest
      .spyOn(InvoiceService, 'updateInvoiceFromUrlOcr')
      .mockResolvedValue(mockInvoice);

    await importFromUrl(req, res, next);

    expect(spy).toHaveBeenCalledWith(mockInvoiceId, mockUserId, mockUrl);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Invoice imported from Cloudinary URL', // ✅ mensaje corregido
      data: mockInvoice,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return a 400 error if the URL is missing', async () => {
    req = getMockReq({
      body: {},
      params: { invoiceId: 'inv-id-123' },
      user: { id: 'user-id-456' },
    }) as AuthRequest;

    await importFromUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing URL, invoice ID or user ID',
    });
  });

  it('should return a 400 error if the invoice ID is missing', async () => {
    req = getMockReq({
      body: { url: 'http://example.com/invoice.pdf' },
      params: {},
      user: { id: 'user-id-456' },
    }) as AuthRequest;

    await importFromUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing URL, invoice ID or user ID',
    });
  });

  it('should return a 400 error if the user ID is missing', async () => {
    req = getMockReq({
      body: { url: 'http://example.com/invoice.pdf' },
      params: { invoiceId: 'inv-id-123' },
      user: undefined,
    }) as AuthRequest;

    await importFromUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing URL, invoice ID or user ID',
    });
  });

  it('should call the next function with an error if the service fails', async () => {
    const mockError = new Error('Service unavailable');
    const mockUrl = 'http://example.com/invoice.pdf';
    const mockInvoiceId = 'inv-id-123';
    const mockUserId = 'user-id-456';

    req = getMockReq({
      body: { url: mockUrl },
      params: { invoiceId: mockInvoiceId },
      user: { id: mockUserId },
    }) as AuthRequest;

    const spy = jest
      .spyOn(InvoiceService, 'updateInvoiceFromUrlOcr')
      .mockRejectedValue(mockError);

    await importFromUrl(req, res, next);

    expect(spy).toHaveBeenCalledWith(mockInvoiceId, mockUserId, mockUrl);
    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
