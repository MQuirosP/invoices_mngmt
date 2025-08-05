/*
  Warnings:

  - You are about to drop the `Warranty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Warranty" DROP CONSTRAINT "Warranty_invoiceId_fkey";

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "warrantyDuration" INTEGER,
ADD COLUMN     "warrantyNotes" TEXT,
ADD COLUMN     "warrantyValidUntil" TIMESTAMP(3);

-- DropTable
DROP TABLE "Warranty";
