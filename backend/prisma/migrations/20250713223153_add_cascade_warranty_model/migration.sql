-- DropForeignKey
ALTER TABLE "Warranty" DROP CONSTRAINT "Warranty_invoiceId_fkey";

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
