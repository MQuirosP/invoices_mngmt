/*
  Warnings:

  - You are about to drop the column `fileType` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "fileType",
DROP COLUMN "fileUrl";
