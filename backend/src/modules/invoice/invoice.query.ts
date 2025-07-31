export const invoiceIncludeOptions = {
  attachments: true,
  // warranty: true,
  items: {
    select: {
      description: true,
      unitPrice: true,
      warrantyDuration: true,
      warrantyValidUntil: true,
      warrantyNotes: true,
    },
  },

};