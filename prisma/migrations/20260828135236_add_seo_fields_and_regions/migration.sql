-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "canonicalPath" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "canonicalPath" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "regions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "canonicalPath" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "regions" TEXT[] DEFAULT ARRAY[]::TEXT[];

