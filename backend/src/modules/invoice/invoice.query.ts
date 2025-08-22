export const invoiceIncludeOptions = {
  attachments: {
    select: {
      url: true,
      mimeType: true,
      fileName: true,
    }
  },
  // warranty: true,
  items: {
    select: {
      description: true,
      quantity: true,
      unitPrice: true,
      warrantyDuration: true,
      warrantyValidUntil: true,
      warrantyNotes: true,
    },
  },

};