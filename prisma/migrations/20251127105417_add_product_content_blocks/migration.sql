/*
  Warnings:

  - You are about to drop the column `basePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `endConnectionStyle` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `ProductVariant` table. All the data in the column will be lost.
  - Made the column `capacity` on table `ProductVariant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ProductVariant_sku_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "basePrice",
ADD COLUMN     "categoryOrder" INTEGER,
ADD COLUMN     "contentBlocks" JSONB,
ADD COLUMN     "showVariantsTable" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "capacityUnit" SET DEFAULT 'tons',
ALTER COLUMN "lengthUnit" SET DEFAULT 'ft';

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "endConnectionStyle",
DROP COLUMN "sku",
ADD COLUMN     "endConnection" TEXT,
ADD COLUMN     "headroom" TEXT,
ADD COLUMN     "maxSpread" TEXT,
ADD COLUMN     "minSpread" TEXT,
ADD COLUMN     "modelNumber" TEXT,
ADD COLUMN     "unitWeight" TEXT,
ALTER COLUMN "capacity" SET NOT NULL,
ALTER COLUMN "price" DROP NOT NULL;
