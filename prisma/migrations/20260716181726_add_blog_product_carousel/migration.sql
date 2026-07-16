-- CreateTable
CREATE TABLE "BlogProduct" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogProduct_blogId_idx" ON "BlogProduct"("blogId");

-- CreateIndex
CREATE INDEX "BlogProduct_productId_idx" ON "BlogProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogProduct_blogId_productId_key" ON "BlogProduct"("blogId", "productId");

-- AddForeignKey
ALTER TABLE "BlogProduct" ADD CONSTRAINT "BlogProduct_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogProduct" ADD CONSTRAINT "BlogProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
