/// <reference types="jest" />

import { importFromUrl } from '../invoice.controller';
import { ImportService } from '../../../shared/services/import.service';
import { AuthRequest } from '../../auth/auth.middleware';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Response, NextFunction } from 'express';

// Mock the services and utilities
jest.mock('@/shared/services/import.service');

const MockedImportService = ImportService as jest.MockedClass<
  typeof ImportService
>;

describe('Invoice Controller: importFromUrl', () => {
  let req: AuthRequest;
  let res: Response;
  let next: NextFunction;
  let mockUpdateFromUrl: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const { res: mockRes, next: mockNext } = getMockRes();
    res = mockRes;
    next = mockNext;

    mockUpdateFromUrl = jest.fn();
    MockedImportService.mockImplementation(() => {
      return {
        updateFromUrl: mockUpdateFromUrl,
      } as any;
    });
  });

  it('should successfully import from a URL and return 201 status', async () => {
    const mockUrl = 'http://example.com/invoice.pdf';
    const mockInvoiceId = 'inv-id-123';
    const mockUserId = 'user-id-456';
    const mockInvoice = { id: mockInvoiceId, total: 120.5 };

    req = getMockReq({
      body: { url: mockUrl },
      params: { invoiceId: mockInvoiceId },
      user: { id: mockUserId },
    }) as AuthRequest;

    mockUpdateFromUrl.mockResolvedValue(mockInvoice);

    await importFromUrl(req, res, next);

    expect(mockUpdateFromUrl).toHaveBeenCalledWith(mockUrl, mockInvoiceId);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Invoice imported from Cloudinary URL',
      data: mockInvoice,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return a 400 error if the URL is missing', async () => {
    req = getMockReq({
      body: {}, // URL is missing
      params: { invoiceId: 'inv-id-123' },
      user: { id: 'user-id-456' },
    }) as AuthRequest;

    await importFromUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing URL, invoice ID or user ID',
    });
    expect(mockUpdateFromUrl).not.toHaveBeenCalled();
  });

  it('should return a 400 error if the invoice ID is missing', async () => {
    req = getMockReq({
      body: { url: 'http://example.com/invoice.pdf' },
      params: {}, // invoiceId is missing
      user: { id: 'user-id-456' },
    }) as AuthRequest;

    await importFromUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing URL, invoice ID or user ID',
    });
    expect(mockUpdateFromUrl).not.toHaveBeenCalled();
  });

  it('should return a 400 error if the user ID is missing', async () => {
    req = getMockReq({
      body: { url: 'http://example.com/invoice.pdf' },
      params: { invoiceId: 'inv-id-123' },
      user: undefined, // user is missing
    }) as AuthRequest;

    await importFromUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing URL, invoice ID or user ID',
    });
    expect(mockUpdateFromUrl).not.toHaveBeenCalled();
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

    mockUpdateFromUrl.mockRejectedValue(mockError);

    await importFromUrl(req, res, next);

    expect(mockUpdateFromUrl).toHaveBeenCalledWith(mockUrl, mockInvoiceId);
    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});