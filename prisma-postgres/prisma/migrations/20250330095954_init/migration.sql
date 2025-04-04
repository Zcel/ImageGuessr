/*
  Warnings:

  - You are about to drop the column `locationLat` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `locationLng` on the `Game` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "locationLat",
DROP COLUMN "locationLng",
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
