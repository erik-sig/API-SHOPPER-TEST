/*
  Warnings:

  - Added the required column `measure_datetime` to the `measur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "measur" ADD COLUMN     "measure_datetime" TIMESTAMP(3) NOT NULL;
