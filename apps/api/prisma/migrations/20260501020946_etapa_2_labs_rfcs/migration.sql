-- CreateEnum
CREATE TYPE "RfcStatus" AS ENUM ('DRAFT', 'IN_DISCUSSION', 'IN_BUILDING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "glyph" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfc" (
    "id" TEXT NOT NULL,
    "number" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" "RfcStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "authorId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "translationOfId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfcVersion" (
    "id" TEXT NOT NULL,
    "rfcId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfcVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");

-- CreateIndex
CREATE INDEX "Lab_order_idx" ON "Lab"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Rfc_number_key" ON "Rfc"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Rfc_slug_key" ON "Rfc"("slug");

-- CreateIndex
CREATE INDEX "Rfc_status_publishedAt_idx" ON "Rfc"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Rfc_labId_idx" ON "Rfc"("labId");

-- CreateIndex
CREATE INDEX "Rfc_locale_status_idx" ON "Rfc"("locale", "status");

-- CreateIndex
CREATE INDEX "Rfc_authorId_idx" ON "Rfc"("authorId");

-- CreateIndex
CREATE INDEX "RfcVersion_rfcId_idx" ON "RfcVersion"("rfcId");

-- CreateIndex
CREATE UNIQUE INDEX "RfcVersion_rfcId_version_key" ON "RfcVersion"("rfcId", "version");

-- AddForeignKey
ALTER TABLE "Rfc" ADD CONSTRAINT "Rfc_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfc" ADD CONSTRAINT "Rfc_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfc" ADD CONSTRAINT "Rfc_translationOfId_fkey" FOREIGN KEY ("translationOfId") REFERENCES "Rfc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfcVersion" ADD CONSTRAINT "RfcVersion_rfcId_fkey" FOREIGN KEY ("rfcId") REFERENCES "Rfc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sequence atomica para numeração de RFCs (atribuída na publicação)
CREATE SEQUENCE IF NOT EXISTS rfc_number_seq START 1;
