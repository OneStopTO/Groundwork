-- AlterTable
ALTER TABLE "Contractor" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_stripeCustomerId_key" ON "Contractor"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_stripeSubscriptionId_key" ON "Contractor"("stripeSubscriptionId");
