-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "reportType" TEXT NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "VerificationDoc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDoc_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VerificationDoc" ADD CONSTRAINT "VerificationDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
