/*
  Warnings:

  - Changed the type of `type` on the `measur` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MeasureType" AS ENUM ('WATER', 'GAS');

-- AlterTable
ALTER TABLE "measur" DROP COLUMN "type",
ADD COLUMN     "type" "MeasureType" NOT NULL;
