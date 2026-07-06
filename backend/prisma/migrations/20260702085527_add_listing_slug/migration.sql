/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
