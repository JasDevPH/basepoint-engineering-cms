-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- Set existing admin accounts as active
UPDATE "Admin" SET "isActive" = true WHERE "role" = 'admin';
