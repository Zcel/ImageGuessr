/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Guess` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "createdAt",
ALTER COLUMN "hints" SET NOT NULL,
ALTER COLUMN "hints" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Guess" DROP COLUMN "createdAt";
