/*
  Warnings:

  - You are about to drop the column `baseDepthIn` on the `DesignShape` table. All the data in the column will be lost.
  - You are about to drop the column `baseMaterial` on the `DesignShape` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DesignShape" DROP COLUMN "baseDepthIn",
DROP COLUMN "baseMaterial",
ADD COLUMN     "baseLayers" TEXT;
