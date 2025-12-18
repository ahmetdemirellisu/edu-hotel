-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "freeAccommodation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guestList" JSONB,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "priceType" TEXT,
ADD COLUMN     "taxNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT;
