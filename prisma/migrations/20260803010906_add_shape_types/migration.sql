-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShapeType" ADD VALUE 'DECK';
ALTER TYPE "ShapeType" ADD VALUE 'DRIVEWAY';
ALTER TYPE "ShapeType" ADD VALUE 'POOL';
ALTER TYPE "ShapeType" ADD VALUE 'STEPS';
ALTER TYPE "ShapeType" ADD VALUE 'LAWN';
ALTER TYPE "ShapeType" ADD VALUE 'TREE';
ALTER TYPE "ShapeType" ADD VALUE 'STRUCTURE';
