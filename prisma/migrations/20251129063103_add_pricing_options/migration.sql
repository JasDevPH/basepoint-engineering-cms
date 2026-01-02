-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "basePrice" DOUBLE PRECISION,
ADD COLUMN     "priceType" TEXT NOT NULL DEFAULT 'base';
