/*
  Warnings:

  - You are about to drop the column `extrated` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "extrated",
ADD COLUMN     "extracted" BOOLEAN NOT NULL DEFAULT false;
