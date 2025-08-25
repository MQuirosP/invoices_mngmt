export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;

  warrantyDuration?: number | null;
  warrantyValidUntil?: Date | null;
  warrantyNotes?: string | null;
}

export interface ExtractedInvoiceMetadata {
  expiration: Date;
  title: string;
  provider: string;
  issueDate: Date;
  duration?: number;
  validUntil?: Date;
  mimeType?: string;
  items?: InvoiceItemInput[];
}

export interface OCRProvider {
  extract(buffer: Buffer): Promise<ExtractedInvoiceMetadata>;
}
