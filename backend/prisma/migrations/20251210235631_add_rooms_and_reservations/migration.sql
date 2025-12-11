/*
  Warnings:

  - The `status` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `available` on the `Room` table. All the data in the column will be lost.
  - Added the required column `accommodationType` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceType` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('PERSONAL', 'CORPORATE', 'EDUCATION');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_roomId_fkey";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "accommodationType" "AccommodationType" NOT NULL,
ADD COLUMN     "eventCode" TEXT,
ADD COLUMN     "invoiceType" "InvoiceType" NOT NULL,
ADD COLUMN     "note" TEXT,
ALTER COLUMN "roomId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "available",
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
