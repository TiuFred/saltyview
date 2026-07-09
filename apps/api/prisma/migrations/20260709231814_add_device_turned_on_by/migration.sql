-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "turnedOnByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_turnedOnByUserId_fkey" FOREIGN KEY ("turnedOnByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
