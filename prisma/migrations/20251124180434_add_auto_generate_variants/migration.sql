-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "autoGenerate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "capacities" TEXT,
ADD COLUMN     "capacityUnit" TEXT,
ADD COLUMN     "connectionStyles" TEXT,
ADD COLUMN     "lengthUnit" TEXT,
ADD COLUMN     "lengths" TEXT;
