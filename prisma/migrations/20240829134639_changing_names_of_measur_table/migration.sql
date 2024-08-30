/*
  Warnings:

  - The primary key for the `measur` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `measur` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `measur` table. All the data in the column will be lost.
  - Added the required column `measure_type` to the `measur` table without a default value. This is not possible if the table is not empty.
  - The required column `measure_uuid` was added to the `measur` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "measur" DROP CONSTRAINT "measur_pkey",
DROP COLUMN "id",
DROP COLUMN "type",
ADD COLUMN     "measure_type" "MeasureType" NOT NULL,
ADD COLUMN     "measure_uuid" TEXT NOT NULL,
ADD CONSTRAINT "measur_pkey" PRIMARY KEY ("measure_uuid");
