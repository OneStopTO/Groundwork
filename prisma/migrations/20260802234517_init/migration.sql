-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('BASIC', 'CORE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PATIO', 'RETAINING_WALL', 'WALKWAY', 'PLANTING_BED', 'FIRE_PIT', 'DRIVEWAY', 'OTHER');

-- CreateEnum
CREATE TYPE "ShapeType" AS ENUM ('PATIO', 'WALKWAY', 'WALL', 'BED', 'FIREPIT');

-- CreateEnum
CREATE TYPE "LineItemKind" AS ENUM ('MATERIAL', 'LABOR', 'MARGIN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'DESIGNED', 'QUOTED', 'SENT', 'ACCEPTED');

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT,
    "typicalProjectTypes" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "selectedTier" "PricingTier" NOT NULL DEFAULT 'CORE',
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceBookItem" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "kind" "LineItemKind" NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "projectType" "ProjectType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceBookItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "address" TEXT,
    "projectType" "ProjectType" NOT NULL,
    "lengthFt" DOUBLE PRECISION NOT NULL,
    "widthFt" DOUBLE PRECISION NOT NULL,
    "areaSqft" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignShape" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "ShapeType" NOT NULL,
    "material" TEXT NOT NULL,
    "label" TEXT,
    "points" TEXT NOT NULL,
    "heightFt" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignShape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "marginPct" DOUBLE PRECISION NOT NULL,
    "materialTotal" DOUBLE PRECISION NOT NULL,
    "laborTotal" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "roiLowPct" DOUBLE PRECISION NOT NULL,
    "roiHighPct" DOUBLE PRECISION NOT NULL,
    "proposalHeadline" TEXT NOT NULL,
    "proposalMessage" TEXT NOT NULL,
    "proposalClosingCta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "kind" "LineItemKind" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_email_key" ON "Contractor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Job_shareToken_key" ON "Job"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_jobId_key" ON "Quote"("jobId");

-- AddForeignKey
ALTER TABLE "PriceBookItem" ADD CONSTRAINT "PriceBookItem_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignShape" ADD CONSTRAINT "DesignShape_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
